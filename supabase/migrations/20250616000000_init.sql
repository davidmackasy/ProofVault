-- ProofVault MVP schema (Supabase Postgres + RLS)

create extension if not exists "pgcrypto";

-- Purchases
create table if not exists public.purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users (id) on delete cascade,
  item_name text not null,
  item_description text,
  store_name text,
  category text,
  purchase_date date,
  purchase_time time,
  total_amount numeric(12, 2),
  currency text not null default 'USD',
  receipt_number text,
  order_number text,
  return_deadline date,
  warranty_expiry date,
  status text not null default 'needs_proof',
  proof_complete boolean not null default false,
  notes text,
  return_policy_text text,
  warranty_text text,
  source_type text not null default 'unknown',
  extraction_result jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists purchases_user_id_idx on public.purchases (user_id);
create index if not exists purchases_status_idx on public.purchases (status);

-- Proof files (receipt images, etc.)
create table if not exists public.proof_files (
  id uuid primary key default gen_random_uuid(),
  purchase_id uuid not null references public.purchases (id) on delete cascade,
  user_id uuid not null references auth.users (id) on delete cascade,
  type text not null,
  storage_path text,
  file_url text,
  text_value text,
  created_at timestamptz not null default now()
);

create index if not exists proof_files_purchase_id_idx on public.proof_files (purchase_id);
create index if not exists proof_files_user_id_idx on public.proof_files (user_id);

-- Updated_at trigger
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists purchases_set_updated_at on public.purchases;
create trigger purchases_set_updated_at
before update on public.purchases
for each row execute function public.set_updated_at();

-- RLS
alter table public.purchases enable row level security;
alter table public.proof_files enable row level security;

create policy "Users read own purchases"
  on public.purchases for select
  using (auth.uid() = user_id);

create policy "Users insert own purchases"
  on public.purchases for insert
  with check (auth.uid() = user_id);

create policy "Users update own purchases"
  on public.purchases for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own purchases"
  on public.purchases for delete
  using (auth.uid() = user_id);

create policy "Users read own proof files"
  on public.proof_files for select
  using (auth.uid() = user_id);

create policy "Users insert own proof files"
  on public.proof_files for insert
  with check (auth.uid() = user_id);

create policy "Users update own proof files"
  on public.proof_files for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Users delete own proof files"
  on public.proof_files for delete
  using (auth.uid() = user_id);

-- Storage bucket for receipt/proof images (private)
insert into storage.buckets (id, name, public)
values ('proof-images', 'proof-images', false)
on conflict (id) do nothing;

create policy "Users upload own proof images"
  on storage.objects for insert
  to authenticated
  with check (
    bucket_id = 'proof-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users read own proof images"
  on storage.objects for select
  to authenticated
  using (
    bucket_id = 'proof-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users update own proof images"
  on storage.objects for update
  to authenticated
  using (
    bucket_id = 'proof-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

create policy "Users delete own proof images"
  on storage.objects for delete
  to authenticated
  using (
    bucket_id = 'proof-images'
    and (storage.foldername(name))[1] = auth.uid()::text
  );
