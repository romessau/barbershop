# Crown & Blade Barbershop

A React + Vite booking website for a barbershop with Supabase authentication,
protected booking inserts, Netlify deployment, and Supabase Edge Function email
notifications.

## Stack

- React 19 + Vite
- Supabase Auth and database
- Supabase Edge Functions for booking emails
- Resend for transactional email delivery
- Netlify for hosting

## Local Setup

Install dependencies:

```bash
npm install
```

Create a local environment file:

```bash
cp .env.example .env.local
```

Fill in the browser-safe Supabase values:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Only use Supabase public/publishable anon values with the `VITE_` prefix. Vite
exposes every `VITE_` variable to browser code, so never put service role keys,
Resend API keys, Google OAuth secrets, or passwords in frontend env variables.

Run the app locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

## Supabase Setup

Run the SQL in `supabase/sql/bookings_email_setup.sql` in the Supabase SQL
Editor to create the `bookings` table, row level security policies, email
tracking columns, and reminder cron job.

Deploy the email Edge Function and set its secrets using the instructions in
`supabase/README.md`.

## Required Environment Variables

Frontend `.env.local` and Netlify environment variables:

```bash
VITE_SUPABASE_URL=
VITE_SUPABASE_ANON_KEY=
```

Supabase Edge Function secrets:

```bash
RESEND_API_KEY=
RESEND_FROM_EMAIL=
CRON_SECRET=
SUPABASE_SERVICE_ROLE_KEY=
```

`SUPABASE_URL` and `SUPABASE_ANON_KEY` are usually provided by Supabase Edge
Functions. Add them as function secrets only if your project does not provide
them automatically.

## Deployment

This repo includes `netlify.toml`:

```toml
[build]
  command = "npm run build"
  publish = "dist"
```

In Netlify, set the same frontend env vars listed above, then deploy from the
`main` branch or run:

```bash
netlify deploy --prod --dir=dist
```

For Google sign-in, add the production Netlify URL to Supabase Auth redirect
URLs and configure Google OAuth in the Supabase dashboard.

## Development Checks

```bash
npm run lint
npm test
npm run build
```
