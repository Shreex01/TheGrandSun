create or replace function public.get_public_course_lesson_titles(requested_course_id text)
returns table (title text, position integer)
language sql
stable
security definer
set search_path = public
as $$
  select lesson.title, lesson.position
  from public.course_lessons lesson
  join public.courses course on course.id = lesson.course_id
  where lesson.course_id = requested_course_id
    and course.published = true
  order by lesson.position;
$$;

revoke all on function public.get_public_course_lesson_titles(text) from public;
grant execute on function public.get_public_course_lesson_titles(text) to authenticated;
