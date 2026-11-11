create table public.ebooks (
  id text primary key,
  title text not null,
  category text not null,
  author text not null,
  price_inr integer not null check (price_inr >= 0),
  pages integer not null check (pages > 0),
  file_format text not null default 'PDF',
  published boolean not null default true
);

create table public.ebook_purchases (
  user_id uuid not null references auth.users (id) on delete cascade,
  ebook_id text not null references public.ebooks (id) on delete cascade,
  purchased_at timestamptz not null default now(),
  primary key (user_id, ebook_id)
);

create table public.ebook_assets (
  ebook_id text primary key references public.ebooks (id) on delete cascade,
  storage_path text not null unique,
  updated_at timestamptz not null default now(),
  constraint ebook_asset_path_matches_id check (storage_path like ebook_id || '/%')
);

create table public.course_access_links (
  course_id text primary key references public.courses (id) on delete cascade,
  drive_url text not null check (drive_url ~ '^https://(drive|docs)\.google\.com/'),
  updated_at timestamptz not null default now()
);

alter table public.ebooks enable row level security;
alter table public.ebook_purchases enable row level security;
alter table public.ebook_assets enable row level security;
alter table public.course_access_links enable row level security;

create policy "Anyone can view published e-books"
  on public.ebooks for select
  to anon, authenticated
  using (published = true);

create policy "Students can view their own e-book purchases"
  on public.ebook_purchases for select
  to authenticated
  using ((select auth.uid()) = user_id);

create policy "Students can view assets for purchased e-books"
  on public.ebook_assets for select
  to authenticated
  using (
    exists (
      select 1
      from public.ebook_purchases purchase
      where purchase.ebook_id = ebook_assets.ebook_id
        and purchase.user_id = (select auth.uid())
    )
  );

create policy "Enrolled students can view course links"
  on public.course_access_links for select
  to authenticated
  using (
    exists (
      select 1
      from public.enrollments enrollment
      where enrollment.course_id = course_access_links.course_id
        and enrollment.user_id = (select auth.uid())
    )
  );

grant select on public.ebooks to anon, authenticated;
grant select on public.ebook_purchases, public.ebook_assets, public.course_access_links to authenticated;
grant all on public.ebooks, public.ebook_purchases, public.ebook_assets, public.course_access_links to service_role;

insert into public.ebooks (id, title, category, author, price_inr, pages, file_format) values
  ('creative-branding-field-guide', 'The Creative Branding Field Guide', 'Design', 'Elena Moretti', 299, 148, 'PDF'),
  ('everyday-photography-notes', 'Everyday Photography: A Field Notebook', 'Photography', 'James Whitfield', 249, 96, 'PDF'),
  ('mindful-mornings-journal', 'A Gentler Morning: Guided Journal', 'Wellness', 'Amara Okafor', 199, 72, 'PDF')
on conflict (id) do update set
  title = excluded.title,
  category = excluded.category,
  author = excluded.author,
  price_inr = excluded.price_inr,
  pages = excluded.pages,
  file_format = excluded.file_format;

insert into storage.buckets (id, name, public)
values ('ebooks', 'ebooks', false)
on conflict (id) do update set public = false;

create policy "Students can download purchased e-books"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'ebooks'
    and exists (
      select 1
      from public.ebook_assets asset
      join public.ebook_purchases purchase on purchase.ebook_id = asset.ebook_id
      where asset.storage_path = storage.objects.name
        and purchase.user_id = (select auth.uid())
    )
  );
