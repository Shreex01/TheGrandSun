alter table public.courses
  add column description text not null default '',
  add column cover_path text,
  add constraint courses_cover_path_matches_id
    check (cover_path is null or cover_path like id || '/%');

alter table public.ebooks
  add column description text not null default '',
  add column cover_path text,
  add constraint ebooks_cover_path_matches_id
    check (cover_path is null or cover_path like id || '/%');

alter table public.course_lessons
  alter column drive_url drop not null;

alter table public.course_lessons
  drop constraint if exists course_lessons_drive_url_check,
  add constraint course_lessons_drive_url_check
    check (drive_url is null or drive_url ~ '^https://(drive|docs)\.google\.com/');

insert into storage.buckets (
  id,
  name,
  public,
  file_size_limit,
  allowed_mime_types
)
values (
  'product-covers',
  'product-covers',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

create policy "Admins can upload product covers"
  on storage.objects for insert
  to authenticated
  with check (bucket_id = 'product-covers' and (select public.is_admin()));

create policy "Admins can replace product covers"
  on storage.objects for update
  to authenticated
  using (bucket_id = 'product-covers' and (select public.is_admin()))
  with check (bucket_id = 'product-covers' and (select public.is_admin()));

create policy "Admins can remove product covers"
  on storage.objects for delete
  to authenticated
  using (bucket_id = 'product-covers' and (select public.is_admin()));
