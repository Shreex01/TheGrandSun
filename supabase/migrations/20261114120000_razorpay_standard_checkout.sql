alter table public.orders
  add column razorpay_order_id text unique;

create function public.fulfill_razorpay_standard_order(
  p_order_id uuid,
  p_razorpay_order_id text,
  p_payment_id text,
  p_amount_paid_paise integer
)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  target_order public.orders%rowtype;
begin
  select *
    into target_order
    from public.orders
    where id = p_order_id
    for update;

  if not found then
    raise exception 'Order not found';
  end if;

  if target_order.razorpay_order_id is distinct from p_razorpay_order_id then
    raise exception 'Razorpay order does not match the order record';
  end if;

  if p_amount_paid_paise <> target_order.amount_paise then
    raise exception 'Payment amount does not match the order amount';
  end if;

  if target_order.status = 'paid' then
    return;
  end if;

  if target_order.status <> 'pending' then
    raise exception 'Order is not pending';
  end if;

  insert into public.enrollments (user_id, course_id)
  select target_order.user_id, item.value ->> 'id'
    from jsonb_array_elements(target_order.product_snapshot) as item(value)
    where item.value ->> 'type' = 'course'
  on conflict (user_id, course_id) do nothing;

  insert into public.ebook_purchases (user_id, ebook_id)
  select target_order.user_id, item.value ->> 'id'
    from jsonb_array_elements(target_order.product_snapshot) as item(value)
    where item.value ->> 'type' = 'ebook'
  on conflict (user_id, ebook_id) do nothing;

  update public.orders
    set status = 'paid',
        razorpay_payment_id = p_payment_id,
        paid_at = now()
    where id = p_order_id;
end;
$$;

revoke all on function public.fulfill_razorpay_standard_order(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.fulfill_razorpay_standard_order(uuid, text, text, integer) to service_role;
