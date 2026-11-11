create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  amount_paise integer not null check (amount_paise > 0),
  currency text not null default 'INR' check (currency = 'INR'),
  status text not null default 'pending' check (status in ('pending', 'paid', 'failed', 'expired')),
  product_snapshot jsonb not null check (jsonb_typeof(product_snapshot) = 'array'),
  razorpay_payment_link_id text unique,
  razorpay_payment_id text,
  created_at timestamptz not null default now(),
  paid_at timestamptz
);

create index orders_user_created_at_idx on public.orders (user_id, created_at desc);
alter table public.orders enable row level security;

create policy "Customers can view their own orders"
  on public.orders for select
  to authenticated
  using ((select auth.uid()) = user_id);

grant select on public.orders to authenticated;
grant all on public.orders to service_role;

create function public.fulfill_razorpay_order(
  p_order_id uuid,
  p_payment_link_id text,
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

  if target_order.razorpay_payment_link_id is distinct from p_payment_link_id then
    raise exception 'Payment link does not match the order';
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

revoke all on function public.fulfill_razorpay_order(uuid, text, text, integer) from public, anon, authenticated;
grant execute on function public.fulfill_razorpay_order(uuid, text, text, integer) to service_role;
