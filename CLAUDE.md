# Shoes of Hope Registration Form

Public-facing registration form for LOTC Shoes of Hope. Caregivers and social workers register a child for shoes + underwear, with gender-conditional size pickers.

**Linear ticket:** LOTC-565. **Launch:** June 3, 2026.

## Architecture

Vanilla HTML/CSS/JS single-page form, served by Express in dev and Vercel serverless functions in prod. No framework.

| Layer | File | Purpose |
|-------|------|---------|
| Frontend | `index.html` | Complete form — HTML, CSS, JS in one file |
| Dev server | `server.js` | Express on port 3000 (validation + Supabase + email) |
| Prod handler | `api/submit.js` | Vercel serverless mirror of `server.js` |
| DB writer | `supabaseService.js` | camelCase → snake_case + `submissions` insert |
| Email | `api/sendConfirmation.js` | Resend REST call, LOTC-branded HTML |

### Submissions go to the shared `submissions` table

`request_type = 'Shoes of Hope'` (TEXT column — no DDL required). The DB columns for SOH already exist in the production schema (see LOTCFORM `supabaseService.js`):

- `shoe_gender`, `girl_shoe_size`, `boy_shoe_size`
- `underwear_gender`, `girls_underwear_size`, `boys_underwear_size`
- `shoes_of_hope_comments`
- `child_grade_fall`

## Conditional fields

| Trigger | Reveals |
|---------|---------|
| `shoeGender = Girl` | `girlShoeSize` (required) |
| `shoeGender = Boy` | `boyShoeSize` (required) |
| `underwearGender = Girl` | `girlsUnderwearSize` (required) |
| `underwearGender = Boy` | `boysUnderwearSize` (required) |
| `hasSocialWorker = Yes` | SW first/last/email/county (required) |

Each toggle clears the alternate branch on switch and removes `required` to avoid the shadcn-style silent-fallback bug noted in the LOTC-poc CLAUDE.md.

## Submission ID

Generated client-side as `SOH-YYYYMMDD-HHMMSS-xxxx` (4-char base36). The server re-validates the format and regenerates if missing/malformed.

## Field naming conventions

- HTML `id`/`name` and JS: camelCase
- Supabase columns: snake_case
- Mapping happens in `supabaseService.js`

## Adding a new field

1. Add input in `index.html`
2. If conditional, add show/hide logic in the `<script>` block
3. Add to `validate()` in **both** `server.js` and `api/submit.js`
4. Add camelCase → snake_case mapping in `supabaseService.js`

## Environment variables

```
SUPABASE_URL
SUPABASE_SERVICE_KEY      # service role key — server-only
RESEND_API_KEY            # confirmation email
```

See `.env.example`.

## Commands

```bash
npm install
npm run dev     # nodemon, port 3000
npm start       # production express
npm run build   # no-op (static + serverless)
```

## Deployment

Vercel. `vercel.json` serves `index.html` at `/` and routes `/api/submit` to the serverless function.

Recommended host: `shoes.lotcarolinas.com` (DNS managed by LOTC).

## TODOs before launch

- Confirm final shoe size + underwear size value lists with Michele (current values are best-guess from existing data + standard sizing).
- Confirm pickup location handling — currently `pickup_location` is `'TBD'` since SOH doesn't have a per-form pickup choice yet.
- Add a "Shoes of Hope" filter/card to `/request` in LOTC-poc so the Programs Hub queue surfaces submissions.
