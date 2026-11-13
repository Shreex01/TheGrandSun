drop policy "Visitors can view published or owned courses" on public.courses;
create policy "Anyone can view published courses"
  on public.courses for select
  to anon
  using (published = true);

create policy "Authenticated users can view published or owned courses"
  on public.courses for select
  to authenticated
  using (
    published = true
    or (select public.is_admin())
    or exists (
      select 1
      from public.enrollments enrollment
      where enrollment.course_id = courses.id
        and enrollment.user_id = (select auth.uid())
    )
  );

drop policy "Visitors can view published or owned e-books" on public.ebooks;
create policy "Anyone can view published e-books"
  on public.ebooks for select
  to anon
  using (published = true);

create policy "Authenticated users can view published or owned e-books"
  on public.ebooks for select
  to authenticated
  using (
    published = true
    or (select public.is_admin())
    or exists (
      select 1
      from public.ebook_purchases purchase
      where purchase.ebook_id = ebooks.id
        and purchase.user_id = (select auth.uid())
    )
  );
