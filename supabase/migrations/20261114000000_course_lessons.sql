create table public.course_lessons (
  id uuid primary key default gen_random_uuid(),
  course_id text not null references public.courses (id) on delete cascade,
  title text not null,
  thumbnail_url text,
  drive_url text not null check (drive_url ~ '^https://(drive|docs)\.google\.com/'),
  position integer not null check (position > 0),
  created_at timestamptz not null default now()
);

create index course_lessons_playlist_order
  on public.course_lessons (course_id, position);

alter table public.course_lessons enable row level security;

create policy "Enrolled students can view course lessons"
  on public.course_lessons for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments enrollment
      where enrollment.course_id = course_lessons.course_id
        and enrollment.user_id = (select auth.uid())
    )
  );

create policy "Admins can manage course lessons"
  on public.course_lessons for all
  to authenticated
  using ((select public.is_admin()))
  with check ((select public.is_admin()));

grant select on public.course_lessons to authenticated;
grant insert, update, delete on public.course_lessons to authenticated;
grant all on public.course_lessons to service_role;

insert into public.course_lessons (course_id, title, drive_url, position)
select
  access.course_id,
  course.title || ' — Full course',
  access.drive_url,
  1
from public.course_access_links access
join public.courses course on course.id = access.course_id
on conflict do nothing;
