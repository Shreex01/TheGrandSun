create table public.profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  full_name text not null default '',
  created_at timestamptz not null default now()
);

create table public.courses (
  id text primary key,
  title text not null,
  category text not null,
  instructor text not null,
  price_inr integer not null check (price_inr >= 0),
  published boolean not null default true
);

create table public.enrollments (
  user_id uuid not null references auth.users (id) on delete cascade,
  course_id text not null references public.courses (id) on delete cascade,
  enrolled_at timestamptz not null default now(),
  primary key (user_id, course_id)
);

alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.enrollments enable row level security;

create policy "Students can view their own profile"
  on public.profiles for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can update their own profile"
  on public.profiles for update
  to authenticated
  using ((select auth.uid()) = user_id)
  with check ((select auth.uid()) = user_id);

create policy "Anyone can view published courses"
  on public.courses for select
  to anon, authenticated
  using (published = true);

create policy "Students can view their own enrollments"
  on public.enrollments for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.profiles to authenticated;
grant update (full_name) on public.profiles to authenticated;
grant select on public.courses to anon, authenticated;
grant select on public.enrollments to authenticated;
grant usage on schema public to anon, authenticated;
grant all on public.profiles, public.courses, public.enrollments to service_role;

create or replace function public.handle_new_student()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (user_id, full_name)
  values (
    new.id,
    coalesce(
      nullif(trim(new.raw_user_meta_data ->> 'full_name'), ''),
      nullif(trim(new.raw_user_meta_data ->> 'name'), ''),
      ''
    )
  );
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_student();

insert into public.courses (id, title, category, instructor, price_inr) values
  ('creative-branding', 'The Art of Creative Branding', 'Design', 'Elena Moretti', 799),
  ('modern-photography', 'Photography: Finding Your Light', 'Photography', 'James Whitfield', 699),
  ('everyday-cooking', 'A Little More Joy in the Kitchen', 'Lifestyle', 'Sofia Laurent', 599),
  ('digital-illustration', 'Digital Illustration, From Sketch to Story', 'Design', 'Maya Chen', 999),
  ('mindful-mornings', 'Mindful Mornings: Make Space for You', 'Wellness', 'Amara Okafor', 499),
  ('floral-watercolor', 'Watercolor Florals for Every Season', 'Art', 'Clara Bennett', 749)
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  instructor = excluded.instructor,
  price_inr = excluded.price_inr;
