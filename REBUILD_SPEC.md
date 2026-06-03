# The Pivot Model — Rebuild Specification (Phase 1 Audit)

> Audit of the existing application as of 2026-05-29. This document is the
> source of truth for the Next.js rebuild. **No code has been changed.**
> The goal of the rebuild is a visually modern, sleek, production-grade
> redesign that preserves **100% of the functionality and content** below.

---

## 0. What this product is

**The Pivot Model** is a marketing site + gated member community + a deep
**engineering-team maturity assessment tool**, built around a book/framework of
the same name. The framework helps engineering leaders evaluate and improve
**offshore product-engineering teams** across four/five "pivots" and three
maturity levels (L1 → L2 → L3), with a strong "Age of AI" angle.

Three surfaces:
1. **Public marketing landing page** (`/`) — sells the book/framework, drives
   community signups and consulting inquiries.
2. **Member community portal** (`/community`) — OTP login/registration gate,
   then a dashboard giving access to assessments, materials, blog, whitepapers,
   consulting, account, and an optional AI chat widget.
3. **Assessment tool** (`/assessment/[id]`) — a 10-module spreadsheet-style app
   for scoring a team, with auto-save, collaborators, and Excel export.
4. **Admin panel** (`/admin`) — manage users, blog, whitepapers, chat config, stats.

Current visual language: dark navy (`#0A0C17`) + gold (`#C9A84C`) + cream,
serif display type (Playfair Display) over Inter UI, with a light-theme toggle.

---

## 1. Sitemap & Routes

### Page routes (App Router)
| Route | File | Render | Purpose |
|---|---|---|---|
| `/` | `app/page.tsx` | **Server** (async, fetches DB) | Marketing landing page — 11 sections incl. hero with 3D book, blog/whitepaper previews from DB. |
| `/community` | `app/community/page.tsx` | **Client** (`'use client'`) | Auth gate → member portal with left sidebar + 7 panels. Renders `<ChatWidget>`. |
| `/community/layout.tsx` | — | pass-through wrapper (`return <>{children}</>`) — no shell of its own. |
| `/assessment/[id]` | `app/assessment/[id]/page.tsx` | **Client** | The assessment tool. 3 module groups, 10 modules, sidebar nav, header w/ export + collaborators. |
| `/admin` | `app/admin/page.tsx` | **Client** | Admin dashboard, 5 tabs. Client-side admin gate via `/api/auth/me`. |

There is **no** dedicated `/blog`, `/whitepapers`, `/about`, `/login`, or
per-post detail route. Blog/whitepapers are surfaced only as previews on `/`
and as lists inside the `/community` portal panels (no individual article pages —
they currently render title/excerpt/category only, body is not shown anywhere in
the UI even though `blog_posts.body` exists).

Landing-page in-page anchors used by nav/footer: `#about`, `#concepts`,
`#ai-age`, `#author`, `#insights`, `#consulting`, `#materials`, `#hero`.

### API routes (`app/api/**/route.ts`)
| Endpoint | Methods | Auth | Purpose |
|---|---|---|---|
| `/api/auth/login` | POST, DELETE | public / cookie | OTP request+verify (login); DELETE = logout. |
| `/api/auth/register` | POST | public | OTP request+verify, creates user (LinkedIn required). |
| `/api/auth/me` | GET | cookie | Returns `{ user }` from JWT (or null). |
| `/api/assessments` | GET, POST | session | List owned+shared; create (seeds templates) or duplicate. |
| `/api/assessments/[id]/emb` | GET, PUT, POST, DELETE | owner/collaborator | EMB rows + "intelligence nudge" on PUT. |
| `/api/assessments/[id]/drivers` | GET/PUT/POST/DELETE | owner/collab | Business drivers. |
| `/api/assessments/[id]/scope` | GET/PUT/POST/DELETE | owner/collab | Scope activities. |
| `/api/assessments/[id]/benchmarks` | GET/PUT/POST/DELETE | owner/collab | KPI benchmarks. |
| `/api/assessments/[id]/maturity` | GET/PUT/POST/DELETE | owner/collab | Competency maturity factors. |
| `/api/assessments/[id]/kra` | GET/PUT/POST/DELETE | owner/collab | Role KRAs. |
| `/api/assessments/[id]/leadership` | GET/PUT/POST/DELETE | owner/collab | Leadership skill scoring. |
| `/api/assessments/[id]/talent` | GET/PUT/POST/DELETE | owner/collab | Engineers + their skills. |
| `/api/assessments/[id]/skillset` | GET/PUT/POST/DELETE | owner/collab | Product context + skill requirements. |
| `/api/assessments/[id]/collaborators` | POST | session | Invite collaborator by email. |
| `/api/assessments/[id]/export` | GET | owner/collab | Streams an 11-sheet `.xlsx`. |
| `/api/chat` | GET, POST | session | Chat enabled/usage; proxy to Anthropic API w/ rate limits. |
| `/api/leads` | POST, GET, PATCH | public POST / admin GET+PATCH | Consulting inquiries. |
| `/api/blog` | GET, POST, PATCH, DELETE | public GET / admin writes | Blog CRUD (`?all=1` for drafts, admin). |
| `/api/whitepapers` | GET, POST, PATCH, DELETE | public GET / admin writes | Whitepaper CRUD. |
| `/api/admin/users` | GET, PATCH | admin | List users, activate/deactivate/promote/demote. |
| `/api/admin/config` | GET, POST | admin | Read/write chat settings + platform stats. |
| `/api/members` | GET, PATCH | session | **LEGACY** — profile update / admin user mgmt; not called by current UI. |
| `/api/settings` | GET, POST | public GET / admin POST | **LEGACY** — forum/otp/corp-email flags; not used by current UI. |
| `/api/emb` | GET/POST/PUT/DELETE/PATCH | session | **LEGACY** — old single-module EMB tool on `emb_assessments`/`emb_rows` tables. Superseded by `/api/assessments/*`. |

---

## 2. Features & Functionality

### Authentication (passwordless OTP)
- **No passwords.** Login & registration both use a 6-digit OTP emailed via
  **Resend**. Two steps: `step:'request'` then `step:'verify'`.
- OTP: 6 digits, 10-min expiry (`OTP_EXPIRY_MINUTES`), single-use, stored in
  `otp_codes` with `purpose` (`login`|`register`). Old codes for the
  email+purpose are deleted before issuing a new one.
- **Dev mode** (`NODE_ENV==='development'`): OTP is `console.log`'d, **not**
  emailed. (Must preserve for local testing.)
- Session: **JWT (HS256, `jose`)**, 30-day expiry, stored in `pm_session`
  httpOnly cookie (`secure` in prod, `sameSite:lax`). Payload: `{id,email,name,isAdmin}`.
- **Registration requires a LinkedIn URL** (server-enforced) and a name; email
  must be unique. Login requires an `active` account to exist.
- Helpers in `lib/auth.ts`: `isFreeEmail()` (free-domain blocklist) and
  `generateOtp()` — **defined but currently UNUSED** in the routes (each route
  re-declares its own `generateOtp`).
- Logout = `DELETE /api/auth/login` clears cookie; client also redirects.

### Landing page
- Sticky translucent nav with blur; "scrolled" state after 40px; mobile hamburger.
- Theme toggle (dark/light) in nav, persisted to `localStorage('theme')`.
- Nav shows **Join Community** CTA when logged out; an avatar dropdown
  (Community & Tools / Admin Panel / Sign Out) when logged in (fetches `/api/auth/me`).
- Scroll-reveal animation: `.reveal` elements fade/slide in via a shared
  `IntersectionObserver` (`RevealObserver`, mounted in root layout).
- 3D CSS book graphic in hero (rotateY transform, hover tilt).
- Animated "AI era" pulse badge; scroll hint.
- Blog (3) + whitepaper (4) previews pulled **server-side** from DB; gracefully
  degrades to empty if DB is unreachable.
- Consulting section button opens a 4-step **consulting inquiry modal**
  (`ConsultModal`) → `POST /api/leads`.

### Consulting inquiry modal (`ConsultModal`)
- 4 steps: **About You / Your Operation / Your Goals / Logistics**, with a
  step indicator, per-step validation, and a service picker grid (6 services).
- Fields: name, email, company, role, industry, linkedin, teamSize,
  offshoreModel, maturityLevel, currentOperation, challenges, expectations,
  service, preferredContact, timezone, availability, timeline, howHeard, extraNotes.
- Success state with confirmation. `source` defaults to `'landing_page'`.
- **Open mechanism (quirk):** `ConsultingSection` sets `display:flex` on a hidden
  `#consultModalOverlay` div; `ConsultModal` watches it with a `MutationObserver`
  and opens itself. (Cross-component DOM-signal hack — see Quirks.)

### Community portal (`/community`)
- If not logged in → **AuthScreen** (login/register tabs + OTP entry).
- If logged in → Nav + left **Sidebar** (Signed-in-as block, 7 nav items, Admin
  link if admin, Sign out) + main panel area.
- Panels:
  - **Home** — welcome + 3 quick-action cards (Assessments/Materials/Consulting).
  - **Assessments** — list owned + shared; "New Assessment" inline form
    (team_name, industry, date); each card → Open / Duplicate.
  - **Materials** — placeholder (heading + sentence only).
  - **Blog** — fetches `/api/blog`, renders cards (emoji, title, excerpt, category, read time).
  - **Whitepapers** — fetches `/api/whitepapers`, 2-col cards w/ optional download link.
  - **Consulting** — placeholder (heading + sentence only).
  - **Account** — name/email/LinkedIn + sign out.
- **ChatWidget** (floating, bottom-right) — only renders if `chat_enabled`; shows
  usage counters; sends to `/api/chat`.

### Assessment tool (`/assessment/[id]`) — the core feature
Header: back-to-community, team name/industry/date, autosave indicator,
**Collaborators** toggle (invite by email), **Export Excel**.
Left sidebar: a **progress bar** (modules-with-data / 10) + 3 grouped sections;
each module item shows a green/grey "has data" dot. Mobile: off-canvas drawer
with a floating menu button + overlay.

**3 groups, 10 modules:**

*Group A — Eng. Maturity (gold accent)*
1. **EMB Maturity** — capabilities grouped by 5 pillars; per row: expandable
   L1/L2/L3 criteria, current-level select (L1/L2/L3 with ◆/⚙/🚀), evidence,
   improvement notes, delete (inline 2-click confirm). Autosave (1.5s debounce).
   Server returns an **"intelligence nudge"** (avg score → suggested level).
   "+ Add Row" per pillar.
2. **Business Drivers** — grouped by category (Engineering Cost / Scale /
   Strategic Expansion); per row: driver name, description, mandatory toggle,
   considerations, notes. "+ Add Driver" per category. Empty state.
3. **Scope** — activities grouped by pillar; target level + current level
   (1/2/3) selects, **auto-computed gap** (`max(0, required-current)`),
   expandable L1/L2/L3 guidance, action notes.
4. **Benchmarks** — KPIs grouped by pillar → sub-category; per row: weight (%),
   unit, target (read-only from template), actual (editable), status select
   (pending/on-track/at-risk/off-track), notes, expandable definition.
5. **Competency Maturity** — free-form factor rows: factor name, maturity level
   (1/2/3), ownership, skill capability, business impact, notes. Empty state.
6. **Summary** — auto-generated: **SVG radar chart** overlaying EMB vs Scope
   pillar averages + per-pillar progress bars. Read-only.

*Group B — Roles & Leaders (blue accent `#63acff`)*
7. **Roles & KRA** — KRAs grouped by role level → pillar; role filter chips;
   per row: KRA name, description, target, current, status, notes.
8. **Leadership Qualities** — add named leaders (name + role); each leader gets
   the full standard skill set (33 skills across 6 categories); per skill: 0–10
   range slider, mandatory ★, notes, expandable detailed-skills. Per-leader score
   summary (total + mandatory). Remove leader / remove skill.

*Group C — Talent & Skills (green accent `#22c55e`)*
9. **Talent Map** — per-engineer profiles. Engineer tabs (add/delete). 6 sub-tabs:
   **Profile** (17 fields), **Technical Skills**, **Product Mindset**,
   **Knowledge Mgmt**, **AI Readiness** (each = skills grouped by category with
   self/manager/target scores 0–10 + gap indicator + expandable description), and
   **Team Tracker** (per-engineer section averages + overall bar). Autosave.
10. **Skillset Requirements** — "Product Context" (12 fields in 3 groups) +
    skill requirements grouped by section→category (importance, required level,
    current level, auto-gap, notes) + a **Gap Analysis Summary** (totals + a
    "Critical Gaps" callout). Autosave.

**Cross-cutting module behaviours:**
- Auto-save on every module via a 1.5s debounce (`PUT .../{module}`), with
  "Saving…/Saved" indicators.
- Add row → `POST` returns new id, appended optimistically. Delete → 2-click
  inline confirm (✕ → ✓/✗, 3s auto-cancel) then `DELETE`.
- Each new assessment is **seeded from templates** in `lib/db.ts` (see §6) so
  modules arrive pre-populated; Talent Map & Leadership start empty (added per person).

### Excel export (`/api/assessments/[id]/export`)
- Server builds an `xlsx` workbook with **11 sheets**: Maturity, Business Drivers,
  Benchmarks, Scope, Competency Maturity, Roles & KRA, Leadership, Talent Profiles,
  Talent Skills, Skillset Context, Skillset Requirements. Streams as attachment.

### AI chat (optional)
- Disabled by default (`chat_enabled='false'`). Admin sets enabled, API key,
  system prompt, and per-user day/week/month limits.
- `POST /api/chat` enforces rolling-window limits (24h/7d/30d via `chat_usage`),
  then proxies to `https://api.anthropic.com/v1/messages`
  (model `claude-sonnet-4-20250514`, max_tokens 1024). Logs one `chat_usage` row per message.
- API key is **DB-stored**, never exposed client-side.

### Admin panel (`/admin`)
- Client-side gate (`/api/auth/me` → `isAdmin`).
- **Users** — search; per user: assessment count, status, admin flag, 30-day
  chat count; activate/deactivate, promote/demote. (Seed admin protected from demote.)
- **Blog** — list + create/edit (title, category, excerpt, body, emoji, read_time,
  status draft/published) + delete (`window.confirm`).
- **Whitepapers** — list + create/edit (title, category, description, icon, pages,
  access public/members, file_url) + delete.
- **Chat Config** — enable toggle, API key (password field), system prompt,
  day/week/month limits.
- **Stats** — total users, assessments, chat messages.

---

## 3. Content Inventory (key copy & data — must carry over verbatim)

### Brand & meta
- Name: **The Pivot Model**. Tagline: *"Engineering Excellence, Offshore."*
- Hero badge: *"Essential reading for the Age of AI"*; eyebrow: *"The Framework
  for Offshore Engineering Excellence"*; title: **The / Pivot / Model**;
  sub: *"AI is reshaping every engineering team on earth. The teams that thrive
  will be those built on engineering maturity — not just headcount or tools."*

### Landing sections (in order)
1. **Hero** — badge, title, sub, CTAs ("Get Access + Join Community",
   "Why AI Makes This Urgent ↓"), 3D book ("THE FRAMEWORK / THE PIVOT MODEL /
   Engineering Excellence for Offshore Teams").
2. **Stats band** — `25+` years · `4` pivot pillars · `3` maturity levels · `∞` potential.
3. **About** ("What This Book Is About") — *"Offshore teams fail for predictable
   reasons."* + 2 paragraphs + 3 callouts (For Engineering Leaders / For Product
   Companies / For Growth-Stage Orgs) + CTA "Register & Access Materials →".
4. **AI Age** ("Why This Book Is Urgent Now") — *"AI doesn't replace engineering
   maturity. It demands it."* + 3 phase cards (Phase 1 AI-Augmented Traditional
   Development / Phase 2 Traditional Products with AI Features / Phase 3 AI-Native
   Applications) + truth banner quote.
5. **Four Pivots** ("The Framework") — 4 cards: 01 Operational Excellence
   (FOUNDATION), 02 Pace of Product Evolution (VELOCITY), 03 Collaboration &
   Alignment (ALIGNMENT), 04 Business Results (IMPACT).
6. **Maturity ladder** — L1 Execution Layer / L2 Engineering Ownership /
   L3 Strategic Partnership (L3 active).
7. **Materials preview** ("Community + Materials") — 6 items (EMB Schema Templates,
   KRA & Performance Frameworks, Offshore Setup Playbooks, Self-Assessment Tools,
   AI Impact Guides, Whitepapers & Research) all "🔒 Members only" + CTA
   "Register Free & Unlock Everything".
8. **Author** ("About the Author") — *"25+ Years Building World-Class Teams"*,
   Verifone/Vista Equity Partners references, quote *"Intuition-based engineering
   is injurious to software quality."* Portrait = "PM" initials (no real photo).
9. **Final CTA** — *"Your team's AI future starts with maturity."*
10. **Insights** — "From the Blog" + "Whitepapers" lists (DB-driven).
11. **Consulting** ("Direct Access") — *"Work directly with the author."* 5 services
    + a card (25+ yrs / 50+ teams / L1→L3) + "Book a Consulting Session" button.

### Seeded data (defaults in `lib/db.ts` / `scripts/init-db.js`)
- **3 blog posts:** "Why Most Offshore Engineering Teams Stay at L1",
  "The AI Readiness Paradox for Offshore Teams",
  "Captive vs Third-Party Offshore: The Decision Framework".
- **3 whitepapers:** "The EMB Framework" (members, 24pp), "AI Readiness for
  Offshore Teams" (members, 18pp), "The Offshore Team Scorecard" (public, 8pp).
- **Seed admin user:** `pivotrics@gmail.com`.
- **Default settings:** site_name, chat_* (disabled), otp_enabled, limits 20/80/200.

### Assessment template data (large, in `lib/db.ts`) — must be preserved exactly
- `EMB_TEMPLATE` — 21 capabilities across **5 pivots** (Operational Excellence,
  Pace of Product Evolution, Collaboration & Alignment, Business Results,
  **People & Talent**), each with L1/L2/L3 criteria.
- `DRIVER_TEMPLATE` — 9 business drivers (3 categories) w/ considerations.
- `BENCHMARK_TEMPLATE` — 52 KPIs across 4 pillars + sub-categories, w/ weights,
  units, targets, definitions.
- `SCOPE_TEMPLATE` — 17 activities across 5 pillars w/ L1/L2/L3 guidance.
- `LEADERSHIP_SKILLS` — 33 skills across 6 categories (Technology & Domain,
  Project Execution, Resourcefulness, Business Maturity, Collaborative) w/
  mandatory flags + detailed skills. (Applied per leader.)
- `KRA_TEMPLATE` — 32 KRAs across 4 role levels × 4 pillars.
- `MATURITY_TEMPLATE` — 5 factors.
- `TALENT_SKILLS_TEMPLATE` — 70 skills across 4 sections (Technical / Product
  Mindset / Knowledge Management / AI Readiness). (Applied per engineer.)
- `SKILLSET_CONTEXT_TEMPLATE` — 12 product-context fields (3 groups).
- `SKILLSET_ITEMS_TEMPLATE` — 30 skill requirements across 5 sections.

### Media
- **No image assets** anywhere (`public/` only has the implicit Next defaults;
  no logos/photos). All "imagery" is CSS (3D book, gradients, grid, SVG noise,
  SVG radar) and **emoji used as icons** throughout.

---

## 4. User Flows

1. **Visitor → community member**
   Landing `/` → "Join Community" → `/community` AuthScreen → Register tab
   (name, company, role, industry, team size, **LinkedIn**, email) → OTP emailed →
   enter 6-digit code → JWT cookie set → portal Home.

2. **Returning member login**
   `/community` → Sign in tab → email → OTP → verify → portal.

3. **Run an assessment**
   Portal → Assessments → "+ New Assessment" (team/industry/date) → POST seeds all
   templates → redirect to `/assessment/[id]` → fill modules (autosave) → Summary
   radar → Export Excel. Optionally invite collaborators by email.

4. **Collaboration**
   Owner invites by email → invitee (must be an active user) sees it under
   "Shared with me" → can open & edit (owner-or-collaborator access check).

5. **Consulting inquiry**
   Landing → Consulting section → "Book a Consulting Session" → 4-step modal →
   `POST /api/leads` → admin reviews via `/api/leads` (GET/PATCH status).

6. **Admin content/ops**
   Login (admin) → nav/footer Admin link → `/admin` → manage users / publish blog
   & whitepapers / configure & enable chat / view stats.

7. **AI chat (when enabled)**
   Member in portal → floating widget → ask question → rate-limited proxy to
   Anthropic → reply.

---

## 5. Tech & Dependencies

- **Framework:** Next.js **14.2.x**, App Router. `output: 'standalone'`,
  `images.unoptimized: true` (VPS deploy). React **18.3**, TypeScript **5**.
- **Styling:** Tailwind **3.4** is configured but **barely used** — virtually all
  styling lives in `app/globals.css` (CSS custom properties + component classes)
  plus **heavy inline `style={{}}`** in client components. Design tokens are CSS
  vars (`--ink`, `--gold`, `--cream`, `--muted`, fonts, spacing) with a
  `[data-theme="light"]` override block.
- **Fonts (Google Fonts):** Playfair Display (display/serif), Lora (body serif),
  Inter (UI). *(Tailwind config also names "DM Sans" for `ui` and the OTP email
  uses DM Sans — minor inconsistency.)* Loaded via `<link>` in `app/layout.tsx`
  **and** `@import` in globals.css (duplicated).
- **DB:** PostgreSQL via `pg` (connection pool, optional SSL). Auto-creates schema
  + runs idempotent `ALTER TABLE … IF NOT EXISTS` migrations + seeds on first query.
- **Auth:** `jose` (JWT). `bcryptjs` is in dependencies but **unused** (no passwords).
- **Email:** `resend` (OTP delivery). `cookie` types present.
- **Export:** `xlsx` (SheetJS) for the workbook.
- **AI:** direct `fetch` to Anthropic Messages API (no SDK).
- **Scripts:** `dev`, `build`, `start`, `lint` (next lint), `db:init`
  (`node scripts/init-db.js`).
- **Env vars** (`.env.local`): `DATABASE_URL`, `DATABASE_SSL`, `JWT_SECRET`,
  `RESEND_API_KEY`, `SMTP_FROM`, `OTP_EXPIRY_MINUTES`, `NEXT_PUBLIC_SITE_URL`.
- **Path alias:** `@/*` → repo root.

---

## 6. Data & State

### Persistence: PostgreSQL (schema auto-initialized in `lib/db.ts`)
Tables (current/active):
- `users` (id, name, email unique, company, role, industry, team_size, linkedin,
  bio, status, is_admin, joined_at, last_login)
- `otp_codes` (email, code, purpose, expires_at, used, created_at)
- `assessments` (user_id, team_name, industry, assessment_date, notes, timestamps)
- `assessment_collaborators` (assessment_id, user_id, invited_by; unique pair)
- `assessment_emb`, `assessment_business_drivers`, `assessment_benchmarks`,
  `assessment_scope`, `assessment_kra`, `assessment_leadership`,
  `assessment_maturity_levels` (all cascade-delete with the assessment)
- `talent_engineers` + `talent_skills` (skills cascade from engineer)
- `skillset_context` + `skillset_items`
- `chat_usage` (user_id, message_at; indexed)
- `blog_posts`, `whitepapers`, `leads`, `settings`

Legacy tables (only in `scripts/init-db.js`, **not** in `lib/db.ts` initSchema):
`emb_assessments`, `emb_rows` (used only by legacy `/api/emb`).

### Client state
- All portal/assessment/admin UIs are **client components** using `useState` +
  `fetch`. No global store, no React Query — each module fetches its own data on
  mount and **auto-saves on a 1.5s debounce**.
- Theme persisted in `localStorage('theme')`; applied to `<html data-theme>` via
  an inline script in `<head>` (anti-FOUC) and toggled in `Nav`.
- Session is server-side (JWT cookie); client reads identity via `/api/auth/me`.
- Module "has-data" status computed by probing each module endpoint on load.

---

## 7. SEO & Metadata

- **Only** root metadata exists (`app/layout.tsx`): title *"The Pivot Model —
  Engineering Excellence for the Age of AI"*, description, and OpenGraph
  (title/description/type=website). `<html lang="en">`.
- **No** per-route `metadata` exports; `/community`, `/admin`, `/assessment/[id]`
  are client components with **no SSR metadata** and effectively
  noindex-by-default content (gated).
- **No** `sitemap.(xml|ts)`, **no** `robots.(txt|ts)`, **no** structured data
  (JSON-LD), **no** canonical tags, **no** favicon/OG image asset, **no** redirects.
- No analytics or third-party tracking scripts.
- Slugs: assessments addressed by numeric `id`; blog/whitepapers have **no slugs
  or detail pages**.

**Rebuild opportunity (to confirm):** add per-page metadata, a sitemap/robots,
JSON-LD (Organization/Book/Article), OG image, and favicon.

---

## 8. Quirks & Edge Cases (MUST be understood before rebuild)

1. **`leads` table schema drift (functional risk).** `lib/db.ts` auto-creates a
   *minimal* `leads` table (no `offshore_model`, `maturity_level`,
   `current_operation`, `expectations`, `preferred_contact`, `timezone`,
   `availability`, `timeline`, `how_heard`, `extra_notes`). But `POST /api/leads`
   **inserts into all of those columns**. The full table is only created by
   `scripts/init-db.js`. → On a DB initialized purely by the app's auto-init,
   lead submission **fails**. The rebuild must reconcile this (single source of
   truth for the schema; ensure `leads` has all columns the API writes).
2. **Two parallel assessment systems.** The live tool uses `assessments` +
   `assessment_*`. A **legacy** EMB-only tool (`/api/emb`, `emb_assessments`,
   `emb_rows`) still exists and is unreferenced by the UI. Decide: drop legacy.
3. **Legacy/unused code:** `/api/members`, `/api/settings`, `/api/emb` routes; and
   three unused components `components/EMBSpreadsheet.tsx`,
   `TalentMapSpreadsheet.tsx`, `SkillRequirementsSpreadsheet.tsx` (imported nowhere).
4. **`bcryptjs` unused** (auth is OTP-only). `isFreeEmail()`/`generateOtp()` in
   `lib/auth.ts` are unused (routes inline their own OTP gen; free-email blocklist
   never enforced even though registration messaging implies "corporate email").
5. **Cross-component modal trigger via DOM mutation.** `ConsultingSection`
   sets `display:flex` on `#consultModalOverlay`; `ConsultModal` opens via a
   `MutationObserver`. Fragile; the rebuild should use proper state/context.
6. **`data/pivot.db*` (SQLite files) present but unused** — the app runs on
   Postgres. Leftover from an earlier iteration.
7. **Emoji-as-iconography everywhere** (nav, callouts, pivots, materials, modules,
   sidebar, buttons). The redesign brief explicitly bans the "generic AI look"
   incl. emoji bullets → these need to be replaced with a real icon system while
   preserving meaning.
8. **Inconsistent pillar taxonomy across modules.** Marketing shows **4** pivots;
   EMB has **5** (adds "People & Talent"); Benchmarks/KRA use variant names
   ("Alignment", "Business Results Focused"); Scope uses a different 5-pillar set.
   The Summary radar hard-codes EMB & Scope pillar name lists. Preserve as-is
   (data integrity) unless told otherwise.
9. **Auto-init on first query.** Schema creation + migrations + seeding run lazily
   via `ensureInit()`. Homepage `getInsights()` is wrapped in try/catch and renders
   empty lists if the DB is down (so `/` never hard-fails without a DB).
10. **Dev OTP bypass:** OTPs are console-logged (not emailed) when
    `NODE_ENV==='development'`. Keep for local dev.
11. **British/Indian English spellings** throughout content ("optimise",
    "organisation", "rigour", "specialisation", "prioritise"). Keep consistent.
12. **Scope `gap` column may be stale:** gap is recomputed client-side
    (`max(0, required-current)`); the stored `gap` column isn't always updated.
13. **Admin protection:** the seed admin `pivotrics@gmail.com` cannot be demoted.
14. **`theme-preview.html`** at repo root is an untracked design experiment (not
    part of the app); safe to ignore/remove in the rebuild.
15. **Light theme is fully specified** (a large `[data-theme="light"]` override
    block) — the rebuild should preserve a polished dark **and** light mode.

---

## Confirmed decisions (2026-05-29)

These were confirmed by the owner and are binding for Phases 2 & 3:

- **Design direction = explore fully fresh.** All 6 Phase-2 directions are new
  territory (editorial/minimal, bold/brutalist, premium dark/tech, warm/organic,
  clean corporate/trust, vibrant modern). **Do NOT anchor to the current
  navy + gold, serif-led identity** — it can be let go.
- **Assessment tool = full reskin now.** The entire 10-module tool is brought
  into the new design language as part of the main build (not deferred).
- **Cleanup = KEEP EVERYTHING.** This is a **purely visual reskin over what
  exists** — do **not** remove legacy/dead code and do **not** change backend
  behavior. Specifically: keep `/api/emb`, `/api/members`, `/api/settings`,
  `emb_assessments`/`emb_rows`, the 3 unused spreadsheet components, and
  `data/pivot.db*` in place. ⚠️ This means the pre-existing **`leads` schema-drift
  bug (Quirk #1) is left as-is** — do not "fix" it unless explicitly asked.
- **Content pages = add detail pages.** Build real `/blog`, `/blog/[slug]`, and
  whitepaper pages with proper metadata/SEO, surfacing the `blog_posts.body`
  content that already exists in the DB but is currently never shown. (Additive
  frontend only — reads existing data, no backend behavior change.)

**Standing implications carried into the build:**
- Replace emoji-as-icons with a cohesive icon system; keep all copy/data verbatim.
- Keep passwordless OTP auth and all existing functionality intact.
- Centralize design tokens; the new design must avoid the generic AI look
  (no default purple gradients, no everything-centered layouts, no hero+3-card
  cliché, no emoji bullets) per the brief.

**Still to confirm at Phase 3 kickoff (not blocking Phase 2):**
- Whether real brand assets exist (logo/wordmark, author headshot) or I design a
  typographic monogram + tasteful placeholder.
- Whether to keep dark as the default theme (both dark + light to be supported).
- Whether to build out the "Materials"/"Consulting" portal panels (placeholders
  today) or keep them as polished placeholders.

---

*End of Phase 1 spec. Decisions above are locked. Awaiting explicit approval of
this spec before starting Phase 2 (design previews).*
