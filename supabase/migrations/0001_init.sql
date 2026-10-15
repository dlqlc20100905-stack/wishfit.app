-- 통합 위시리스트 1·2단계 스키마
-- 앱 서버는 service role 키로 접근하고 권한은 서버 코드에서 확인한다.
-- RLS는 anon/authenticated 키로 직접 접근할 때를 막는 이중 안전장치다.

create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  kakao_id text,
  nickname text not null,
  monthly_budget integer check (monthly_budget is null or monthly_budget >= 0),
  created_at timestamptz not null default now()
);

create table public.wishlists (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  occasion_date date,
  share_token text not null unique,
  created_at timestamptz not null default now()
);
create index on public.wishlists (user_id);

create table public.items (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  wishlist_id uuid not null references public.wishlists (id) on delete cascade,
  url text not null,
  mall text not null,
  name text not null,
  image_url text,
  price integer check (price is null or price >= 0),
  category text not null default 'etc'
    check (category in ('outer', 'top', 'bottom', 'shoes', 'bag', 'etc')),
  created_at timestamptz not null default now()
);
create index on public.items (user_id);
create index on public.items (wishlist_id);

-- 상품당 예약 1건(기본키)으로 중복 선물을 원천 차단한다.
-- 정책이 없으므로 리스트 주인을 포함한 어떤 사용자 키로도 읽을 수 없다.
create table public.reservations (
  item_id uuid primary key references public.items (id) on delete cascade,
  reserver_name text not null,
  secret_hash text not null,
  created_at timestamptz not null default now()
);

create table public.outfits (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users (id) on delete cascade,
  title text not null,
  total integer not null default 0,
  share_token text not null unique,
  created_at timestamptz not null default now()
);
create index on public.outfits (user_id);

create table public.outfit_items (
  outfit_id uuid not null references public.outfits (id) on delete cascade,
  item_id uuid not null references public.items (id) on delete cascade,
  slot text not null check (slot in ('outer', 'top', 'bottom', 'shoes', 'bag')),
  primary key (outfit_id, slot)
);

-- 성공 지표(공유 수, 예약 후 구매 클릭률 등) 집계용
create table public.events (
  id bigint generated always as identity primary key,
  type text not null,
  ref_id text,
  created_at timestamptz not null default now()
);

alter table public.users enable row level security;
alter table public.wishlists enable row level security;
alter table public.items enable row level security;
alter table public.reservations enable row level security;
alter table public.outfits enable row level security;
alter table public.outfit_items enable row level security;
alter table public.events enable row level security;

create policy "own profile" on public.users
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "own wishlists" on public.wishlists
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own items" on public.items
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own outfits" on public.outfits
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own outfit items" on public.outfit_items
  for all to authenticated
  using (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid()))
  with check (exists (select 1 from public.outfits o where o.id = outfit_id and o.user_id = auth.uid()));
