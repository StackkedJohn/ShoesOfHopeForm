# Shoes of Hope Registration Form

Public registration form for **Shoes of Hope** — a program from Least of These Carolinas (LOTC). Caregivers and social workers register children for shoes and underwear, with sizing pickers that adapt to the child's gender.

**Linear ticket:** [LOTC-565](https://linear.app/stackked/issue/LOTC-565)
**Launch deadline:** June 3, 2026
**Sister projects:** `LOTCFORM` (BoH, request.lotcarolinas.com), `BridgeCampForm`

## Quick start

```bash
npm install
cp .env.example .env
# fill in SUPABASE_URL, SUPABASE_SERVICE_KEY, RESEND_API_KEY
npm run dev
# open http://localhost:3000
```

## What it does

- Public form (no auth) — caregiver info, child info, shoe choice, underwear choice, social worker (conditional), consent.
- Writes to the existing `submissions` table in the LOTC-poc Supabase project with `request_type = 'Shoes of Hope'`.
- Generates a client-side submission ID (`SOH-YYYYMMDD-HHMMSS-xxxx`) that's validated server-side.
- Sends a Resend-powered confirmation email to the caregiver on submit.
- Gender-conditional sizes: pick "Girl" or "Boy" for shoes, get the matching size dropdown. Same for underwear.

## Tech

- Vanilla HTML + CSS + JS — no framework, no build step.
- Express dev server for local; Vercel serverless functions in prod (mirror logic).
- `@supabase/supabase-js` server-side only.
- Resend for transactional email.

## File map

```
index.html               single-page form
server.js                local Express server
api/submit.js            Vercel serverless mirror of /api/submit
api/sendConfirmation.js  Resend HTML email
supabaseService.js       camelCase -> snake_case + submissions insert
vercel.json              build + routes
```

## Deploy

This repo deploys to Vercel. Recommended hostname: `shoes.lotcarolinas.com`.

After the first Vercel link:

```bash
vercel env add SUPABASE_URL
vercel env add SUPABASE_SERVICE_KEY
vercel env add RESEND_API_KEY
vercel --prod
```

See `CLAUDE.md` for the architecture notes and TODOs before launch.

## Accessibility & branding

- LOTC brand colors (red `#c22035`, blue `#86b2d3`, grey `#a7a8a3`, black `#060511`) only.
- Semantic landmarks (`header`, `main`, `footer`), labelled fieldsets, `aria-live` status region, visible focus rings, 44px+ tap targets.
- Mobile-first responsive layout (1 / 2 / 3 column grids at >=640px).
