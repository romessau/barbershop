create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  service text not null,
  barber text not null,
  appointment_day text not null,
  appointment_time text not null,
  customer_name text,
  customer_email text,
  notes text,
  confirmation_email_sent_at timestamptz,
  confirmation_email_error text,
  reminder_sent_at timestamptz,
  reminder_email_error text,
  created_at timestamptz not null default now()
);

alter table public.bookings
  add column if not exists barber text,
  add column if not exists appointment_day text,
  add column if not exists appointment_time text,
  add column if not exists customer_name text,
  add column if not exists customer_email text,
  add column if not exists confirmation_email_sent_at timestamptz,
  add column if not exists confirmation_email_error text,
  add column if not exists reminder_sent_at timestamptz,
  add column if not exists reminder_email_error text;

do $$
begin
  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'date'
  ) then
    alter table public.bookings alter column date drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'time'
  ) then
    alter table public.bookings alter column time drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'name'
  ) then
    alter table public.bookings alter column name drop not null;
  end if;

  if exists (
    select 1 from information_schema.columns
    where table_schema = 'public' and table_name = 'bookings' and column_name = 'phone'
  ) then
    alter table public.bookings alter column phone drop not null;
  end if;
end $$;

alter table public.bookings enable row level security;

drop policy if exists "Users can insert own bookings" on public.bookings;
drop policy if exists "Users can read own bookings" on public.bookings;

create policy "Users can insert own bookings"
  on public.bookings
  for insert
  to authenticated
  with check ((select auth.uid()) = user_id);

create policy "Users can read own bookings"
  on public.bookings
  for select
  to authenticated
  using ((select auth.uid()) = user_id);

create index if not exists bookings_user_id_idx
  on public.bookings(user_id);

create index if not exists bookings_created_at_idx
  on public.bookings(created_at desc);

create index if not exists bookings_reminder_due_idx
  on public.bookings(created_at)
  where reminder_sent_at is null;

create extension if not exists pg_cron with schema extensions;
create extension if not exists pg_net with schema extensions;
create extension if not exists supabase_vault with schema vault;

-- Run these once with your real values before enabling the cron job.
-- select vault.create_secret('YOUR_SUPABASE_PROJECT_URL', 'project_url');
-- select vault.create_secret('YOUR_LEGACY_ANON_JWT_OR_FUNCTION_BEARER', 'function_bearer_token');
-- select vault.create_secret('A_LONG_RANDOM_CRON_SECRET', 'booking_email_cron_secret');

select cron.schedule(
  'send-booking-reminder-emails',
  '0 * * * *',
  $$
  select
    net.http_post(
      url := (select decrypted_secret from vault.decrypted_secrets where name = 'project_url') || '/functions/v1/send-booking-email',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || (select decrypted_secret from vault.decrypted_secrets where name = 'function_bearer_token'),
        'x-cron-secret', (select decrypted_secret from vault.decrypted_secrets where name = 'booking_email_cron_secret')
      ),
      body := jsonb_build_object('type', 'reminders'),
      timeout_milliseconds := 5000
    ) as request_id;
  $$
);
