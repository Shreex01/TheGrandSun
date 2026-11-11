create table public.admin_users (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table public.admin_users enable row level security;
grant all on public.admin_users to service_role;

create function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_users
    where user_id = (select auth.uid())
  );
$$;

revoke all on function public.is_admin() from public, anon;
grant execute on function public.is_admin() to authenticated;

drop policy "Anyone can view published courses" on public.courses;
create policy "Visitors can view published or owned courses"
  on public.courses for select
  to anon, authenticated
  using (
    published = true
    or (select public.is_admin())
    or exists (
      select 1 from public.enrollments enrollment
      where enrollment.course_id = courses.id
        and enrollment.user_id = (select auth.uid())
    )
  );

create policy "Admins can manage courses"
  on public.courses for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
grant insert, update, delete on public.courses to authenticated;

drop policy "Anyone can view published e-books" on public.ebooks;
create policy "Visitors can view published or owned e-books"
  on public.ebooks for select
  to anon, authenticated
  using (
    published = true
    or (select public.is_admin())
    or exists (
      select 1 from public.ebook_purchases purchase
      where purchase.ebook_id = ebooks.id
        and purchase.user_id = (select auth.uid())
    )
  );

create policy "Admins can manage e-books"
  on public.ebooks for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
grant insert, update, delete on public.ebooks to authenticated;

create policy "Admins can view e-book purchases"
  on public.ebook_purchases for select
  to authenticated
  using ((select public.is_admin()));

create policy "Admins can manage e-book assets"
  on public.ebook_assets for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
grant insert, update, delete on public.ebook_assets to authenticated;

create policy "Admins can manage course links"
  on public.course_access_links for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));
grant insert, update, delete on public.course_access_links to authenticated;

create policy "Admins can upload e-book files"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'ebooks' and (select public.is_admin()));

create policy "Admins can inspect e-book files"
  on storage.objects for select
  to authenticated
  using (bucket_id = 'ebooks' and (select public.is_admin()));

create policy "Admins can replace e-book files"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'ebooks' and (select public.is_admin()))
  with check (bucket_id = 'ebooks' and (select public.is_admin()));

create policy "Admins can remove e-book files"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'ebooks' and (select public.is_admin()));
