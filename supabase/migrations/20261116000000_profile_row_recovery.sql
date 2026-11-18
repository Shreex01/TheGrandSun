create policy "Students can create their own profile"
  on public.profiles for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

grant insert (user_id) on public.profiles to authenticated;

insert into public.profiles (user_id, full_name)
select
  auth_user.id,
  coalesce(
    nullif(trim(auth_user.raw_user_meta_data ->> 'full_name'), ''),
    nullif(trim(auth_user.raw_user_meta_data ->> 'name'), ''),
    ''
  )
from auth.users as auth_user
left join public.profiles as profile on profile.user_id = auth_user.id
where profile.user_id is null
on conflict (user_id) do nothing;
