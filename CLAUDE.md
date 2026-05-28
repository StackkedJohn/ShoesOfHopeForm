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

`request_type = 'Shoes of Hope'` (TEXT column — no DDL required). All columns exist in the production schema (mirrors LOTCFORM `supabaseService.js`, verified by a live round-trip insert May 28 2026):

- SOH-specific: `shoe_gender`, `girl_shoe_size`, `boy_shoe_size`, `underwear_gender`, `girls_underwear_size`, `boys_underwear_size`, `shoes_of_hope_comments`, `child_grade_fall`
- Caregiver/SW/child/relationship fields reused from LOTCFORM: `relationship`, `relationship_other`, `person_completing_*`, `caregiver_middle_name`, `caregiver_no_mobile`, `alternative_phone`, `know_caregiver_email`, `licensing_agency`, `social_worker_middle_name`, `social_worker_no_mobile`, `alternative_social_worker_phone`, `social_worker_can_text`, `social_worker_county`, `social_worker_county_other`, `child_last_name` (full), `child_last_initial` (derived), `child_nickname`, `child_ethnicity`, `child_placement_type`

### Reused from LOTCFORM (the "Request Form")

Field markup, option lists, and JS were ported from `LOTCFORM/` to keep the public forms consistent (they write to the same table). Values match LOTCFORM exactly (gender `Male/Female`, ethnicity `African-American/Caucasian/…`, placement-type strings, relationship `Caregiver/DSS Social Worker/Other`). Address autocomplete uses `/api/mapbox-config` + `/api/county-lookup` (copied from LOTCFORM) — needs `MAPBOX_ACCESS_TOKEN` + `MAPBOX_ADDRESS_TOKEN` env vars on Vercel.

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
MAPBOX_ACCESS_TOKEN       # address geocoding (county lookup)
MAPBOX_ADDRESS_TOKEN      # address autocomplete search
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

Vercel. `vercel.json` serves `index.html` at `/` and routes `/api/submit`, `/api/mapbox-config`, `/api/county-lookup` to serverless functions.

Recommended host: `shoes.lotcarolinas.com` (DNS managed by LOTC).

## TODOs before launch

- **Add the two `MAPBOX_*` env vars to the SOH Vercel project** (reuse LOTCFORM's tokens) — address autocomplete is inert without them (manual entry still works).
- Confirm final shoe size + underwear size value lists with Michele (match `Shoe Sizes.xlsx` / `Underwear Sizes.xlsx`).
- `pickup_location` now stores the chosen event location (Gaston/Rutherford County).
- Internal/staff side (Request Center card, comm log, Not Served, Close Request, alerts, export) is built in LOTC-poc — see `Internal SOH Data.docx`.
