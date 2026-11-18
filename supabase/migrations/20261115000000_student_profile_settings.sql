alter table public.profiles
  add column username text,
  add column gender text not null default '',
  add column avatar_path text;

alter table public.profiles
  add constraint profiles_username_format
    check (username is null or username ~ '^[a-z0-9_]{3,24}$'),
  add constraint profiles_gender_valid
    check (gender in ('', 'female', 'male', 'non_binary', 'other')),
  add constraint profiles_avatar_path_owned
    check (avatar_path is null or avatar_path like (user_id::text || '/%'));

create unique index profiles_username_lower_unique
  on public.profiles (lower(username))
  where username is not null;

grant update (username, gender, avatar_path) on public.profiles to authenticated;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp'];

create policy "Users can view their own profile pictures"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can upload their own profile pictures"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );

create policy "Users can update their own profile pictures"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  )
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] = (select auth.uid()::text)
  );
