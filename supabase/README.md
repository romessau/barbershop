# Supabase Email Setup

This app uses one Edge Function for booking emails:

- `confirmation`: called by the React app after a successful booking insert.
- `reminders`: called by `pg_cron`; for now it sends reminders for bookings created at least 48 hours ago.

## Required Supabase Function Secrets

Set these in Supabase Dashboard under Edge Functions secrets, or with the Supabase CLI:

Use `supabase/.env.example` as the template for a local `supabase/.env.local`
file. Keep that local file out of git.

```bash
supabase secrets set --env-file supabase/.env.local
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are usually provided automatically by Supabase Edge Functions. If not, set them too.

## Deploy Function

This function validates client JWTs itself for booking confirmations and validates `x-cron-secret` for reminders, so deploy it without Supabase's built-in JWT verification:

```bash
supabase functions deploy send-booking-email --no-verify-jwt
```

## Database and Cron

Paste `supabase/sql/bookings_email_setup.sql` in the Supabase SQL Editor.

Before enabling the cron job, create these Vault secrets in SQL with real values:

```sql
select vault.create_secret('YOUR_SUPABASE_PROJECT_URL', 'project_url');
select vault.create_secret('YOUR_LEGACY_ANON_JWT_OR_FUNCTION_BEARER', 'function_bearer_token');
select vault.create_secret('THE_SAME_CRON_SECRET_FROM_EDGE_FUNCTION_SECRETS', 'booking_email_cron_secret');
```

Use the legacy `anon` JWT key for `function_bearer_token` if your Edge Function deployment requires JWT-like authorization headers. The cron request is also protected by `x-cron-secret`.
