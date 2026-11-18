create table public.product_ratings (
  product_id text not null,
  product_type text not null check (product_type in ('course', 'ebook')),
  user_id uuid not null references auth.users (id) on delete cascade,
  rating smallint not null check (rating between 1 and 5),
  created_at timestamptz not null default now(),
  primary key (product_type, product_id, user_id)
);

alter table public.product_ratings enable row level security;
revoke all on public.product_ratings from public, anon;

create policy "Students can view their own product ratings"
  on public.product_ratings for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can rate products"
  on public.product_ratings for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Students can update their own product ratings"
  on public.product_ratings for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

grant select on public.product_ratings to authenticated;
grant insert (product_id, product_type, user_id, rating) on public.product_ratings to authenticated;
grant update (product_id, product_type, user_id, rating) on public.product_ratings to authenticated;
grant all on public.product_ratings to service_role;

create or replace function public.get_product_rating_summaries()
returns table (product_id text, product_type text, average_rating numeric, rating_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select rating.product_id, rating.product_type, round(avg(rating.rating)::numeric, 1), count(*)::bigint
  from public.product_ratings as rating
  where (rating.product_type = 'course' and exists (
    select 1 from public.courses as course
    where course.id = rating.product_id and course.published = true
  ))
  or (rating.product_type = 'ebook' and exists (
    select 1 from public.ebooks as ebook
    where ebook.id = rating.product_id and ebook.published = true
  ))
  group by rating.product_id, rating.product_type;
$$;

revoke all on function public.get_product_rating_summaries() from public;
grant execute on function public.get_product_rating_summaries() to anon, authenticated;
