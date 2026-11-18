create or replace function public.get_popular_products()
returns table (product_id text, purchase_count bigint)
language sql
stable
security definer
set search_path = ''
as $$
  select popular.product_id, popular.purchase_count
  from (
    select course.id as product_id, count(enrollment.user_id)::bigint as purchase_count
    from public.courses as course
    left join public.enrollments as enrollment on enrollment.course_id = course.id
    where course.published = true
    group by course.id

    union all

    select ebook.id as product_id, count(purchase.user_id)::bigint as purchase_count
    from public.ebooks as ebook
    left join public.ebook_purchases as purchase on purchase.ebook_id = ebook.id
    where ebook.published = true
    group by ebook.id
  ) as popular
  order by popular.purchase_count desc, popular.product_id;
$$;

revoke all on function public.get_popular_products() from public;
grant execute on function public.get_popular_products() to anon, authenticated;
