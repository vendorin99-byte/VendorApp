-- Enable extensions
create extension if not exists "uuid-ossp";
create extension if not exists "postgis";

-- USERS
create table users (
  id            uuid primary key default gen_random_uuid(),
  clerk_id      text unique,
  email         text unique not null,
  name          text not null,
  phone         text,
  role          text check(role in ('customer','vendor','admin')) default 'customer',
  avatar_url    text,
  is_active     boolean default true,
  is_verified   boolean default false,
  otp_code      text,
  otp_expires_at timestamptz,
  vendor_id     uuid,
  created_at    timestamptz default now()
);

-- VENDORS
create table vendors (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid references users(id) on delete cascade,
  business_name   text not null,
  category        text not null,
  sub_categories  text[],
  description     text,
  address         text,
  city            text,
  lat             decimal(10,7),
  lng             decimal(10,7),
  whatsapp        text,
  operating_hours jsonb,
  ktp_url         text,
  nib_url         text,
  verified        boolean default false,
  verified_at     timestamptz,
  verified_by     uuid references users(id),
  rejected_reason text,
  subscription    text default 'trial',
  trial_ends_at   timestamptz default (now() + interval '14 days'),
  sub_ends_at     timestamptz,
  wallet_balance  bigint default 0,
  wallet_pending  bigint default 0,
  avg_rating      decimal(3,2) default 0,
  total_reviews   integer default 0,
  is_active       boolean default true,
  created_at      timestamptz default now()
);

-- Add FK from users.vendor_id to vendors
alter table users add constraint fk_users_vendor foreign key (vendor_id) references vendors(id);

-- VENDOR BANK ACCOUNTS
create table vendor_bank_accounts (
  id             uuid primary key default gen_random_uuid(),
  vendor_id      uuid references vendors(id) on delete cascade,
  bank_code      text not null,
  account_number text not null,
  account_name   text not null,
  is_default     boolean default false,
  is_verified    boolean default false,
  verified_at    timestamptz,
  created_at     timestamptz default now(),
  unique(vendor_id, account_number)
);

-- SERVICES (paket layanan)
create table services (
  id           uuid primary key default gen_random_uuid(),
  vendor_id    uuid references vendors(id) on delete cascade,
  name         text not null,
  description  text,
  price        bigint not null,
  dp_percent   integer default 30,
  duration     text,
  is_active    boolean default true,
  created_at   timestamptz default now()
);

-- PORTFOLIOS
create table portfolios (
  id         uuid primary key default gen_random_uuid(),
  vendor_id  uuid references vendors(id) on delete cascade,
  image_url  text not null,
  caption    text,
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- BOOKINGS
create table bookings (
  id               uuid primary key default gen_random_uuid(),
  customer_id      uuid references users(id),
  vendor_id        uuid references vendors(id),
  service_id       uuid references services(id),
  event_date       date not null,
  event_time       time,
  notes            text,
  rejected_reason  text,
  status           text default 'pending_dp',
  total_amount     bigint not null,
  dp_amount        bigint not null,
  platform_fee     bigint default 0,
  vendor_received  bigint default 0,
  created_at       timestamptz default now()
);

-- TRANSACTIONS
create table transactions (
  id                uuid primary key default gen_random_uuid(),
  booking_id        uuid references bookings(id),
  amount            bigint not null,
  type              text,
  status            text default 'pending',
  payment_method    text,
  xendit_invoice_id text unique,
  paid_at           timestamptz,
  created_at        timestamptz default now()
);

-- WITHDRAWALS
create table withdrawals (
  id                 uuid primary key default gen_random_uuid(),
  vendor_id          uuid references vendors(id),
  bank_account_id    uuid references vendor_bank_accounts(id),
  amount             bigint not null,
  admin_fee          bigint default 5000,
  amount_received    bigint,
  status             text default 'pending',
  xendit_disburse_id text,
  failure_reason     text,
  approved_by        uuid references users(id),
  approved_at        timestamptz,
  success_at         timestamptz,
  notes              text,
  created_at         timestamptz default now()
);

-- WALLET LEDGER
create table wallet_ledger (
  id            uuid primary key default gen_random_uuid(),
  vendor_id     uuid references vendors(id),
  type          text,
  amount        bigint not null,
  balance_after bigint not null,
  reference_id  text,
  description   text,
  created_at    timestamptz default now()
);

-- CHAT ROOMS
create table chat_rooms (
  id           uuid primary key default gen_random_uuid(),
  customer_id  uuid references users(id),
  vendor_id    uuid references vendors(id),
  booking_id   uuid references bookings(id),
  created_at   timestamptz default now(),
  unique(customer_id, vendor_id)
);

-- MESSAGES
create table messages (
  id         uuid primary key default gen_random_uuid(),
  room_id    uuid references chat_rooms(id) on delete cascade,
  sender_id  uuid references users(id),
  content    text,
  type       text default 'text',
  is_read    boolean default false,
  created_at timestamptz default now()
);

-- REVIEWS
create table reviews (
  id          uuid primary key default gen_random_uuid(),
  booking_id  uuid references bookings(id) unique,
  customer_id uuid references users(id),
  vendor_id   uuid references vendors(id),
  rating      integer check(rating between 1 and 5),
  comment     text,
  created_at  timestamptz default now()
);

-- ADVERTISEMENTS
create table advertisements (
  id          uuid primary key default gen_random_uuid(),
  vendor_id   uuid references vendors(id),
  type        text,
  area_target text,
  start_date  date,
  end_date    date,
  is_active   boolean default true,
  is_approved boolean default false,
  created_at  timestamptz default now()
);

-- ADMIN LOGS
create table admin_logs (
  id          uuid primary key default gen_random_uuid(),
  admin_id    uuid references users(id),
  action      text not null,
  target_type text,
  target_id   text,
  ip_address  text,
  notes       text,
  created_at  timestamptz default now()
);

-- INDEXES
create index idx_vendors_city on vendors(city);
create index idx_vendors_category on vendors(category);
create index idx_vendors_verified on vendors(verified);
create index idx_bookings_customer on bookings(customer_id);
create index idx_bookings_vendor on bookings(vendor_id);
create index idx_bookings_status on bookings(status);
create index idx_messages_room on messages(room_id);
create index idx_wallet_ledger_vendor on wallet_ledger(vendor_id);
create index idx_withdrawals_vendor on withdrawals(vendor_id);
create index idx_withdrawals_status on withdrawals(status);

-- FUNCTION: update vendor avg_rating after review insert
create or replace function update_vendor_rating()
returns trigger as $$
begin
  update vendors set
    avg_rating = (select avg(rating) from reviews where vendor_id = new.vendor_id),
    total_reviews = (select count(*) from reviews where vendor_id = new.vendor_id)
  where id = new.vendor_id;
  return new;
end;
$$ language plpgsql;

create trigger after_review_insert
  after insert on reviews
  for each row execute function update_vendor_rating();

-- FUNCTION: vendors within radius (requires postgis)
create or replace function vendors_within_radius(
  p_lat float,
  p_lng float,
  p_radius_km float,
  p_category text default null
)
returns table (
  id uuid, business_name text, category text, city text,
  lat decimal, lng decimal, avg_rating decimal, total_reviews int,
  distance_km float
)
language sql stable as $$
  select
    v.id, v.business_name, v.category, v.city, v.lat, v.lng,
    v.avg_rating, v.total_reviews,
    ST_Distance(
      ST_MakePoint(v.lng, v.lat)::geography,
      ST_MakePoint(p_lng, p_lat)::geography
    ) / 1000 as distance_km
  from vendors v
  where v.verified = true
    and v.is_active = true
    and (p_category is null or v.category = p_category)
    and ST_DWithin(
      ST_MakePoint(v.lng, v.lat)::geography,
      ST_MakePoint(p_lng, p_lat)::geography,
      p_radius_km * 1000
    )
  order by distance_km;
$$;

-- FUNCTION: revenue by period
create or replace function revenue_by_period(p_trunc text)
returns table (period text, total_revenue bigint, transaction_count bigint)
language sql stable as $$
  select
    date_trunc(p_trunc, paid_at)::text as period,
    sum(amount * 0.01)::bigint as total_revenue,
    count(*) as transaction_count
  from transactions
  where status = 'paid' and paid_at is not null
  group by 1
  order by 1 desc
  limit 12;
$$;

-- ROW LEVEL SECURITY
alter table users enable row level security;
alter table vendors enable row level security;
alter table bookings enable row level security;
alter table messages enable row level security;
alter table wallet_ledger enable row level security;

-- Service role bypasses all RLS (used by backend)
create policy "service_role_all" on users for all using (auth.role() = 'service_role');
create policy "service_role_all" on vendors for all using (auth.role() = 'service_role');
create policy "service_role_all" on bookings for all using (auth.role() = 'service_role');
create policy "service_role_all" on messages for all using (auth.role() = 'service_role');
create policy "service_role_all" on wallet_ledger for all using (auth.role() = 'service_role');
