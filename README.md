# The Pivot Model — v2.0

A Next.js 14 platform for engineering maturity assessment.

## Quick Start

```bash
cp .env.example .env.local
# Fill in DATABASE_URL, JWT_SECRET, RESEND_API_KEY
npm install
npm run dev
```

First request auto-initialises the database and seeds:
- Admin user: pivotrics@gmail.com
- Default blog posts and whitepapers
- All settings (chat disabled by default)

## Key Routes

| Route | Description |
|-------|-------------|
| `/` | Public marketing homepage |
| `/community` | Member portal — login/register + assessments |
| `/assessment/[id]` | 7-module tabbed assessment view |
| `/admin` | Admin dashboard (admin users only) |

## Environment Variables

```
DATABASE_URL=postgresql://...
DATABASE_SSL=true
JWT_SECRET=your-random-32-char-secret
RESEND_API_KEY=re_...
SMTP_FROM=The Pivot Model <noreply@thepivotmodel.com>
NODE_ENV=development  # prints OTP to console instead of sending email
```

## Architecture

- **Auth**: Email OTP only, no passwords. JWT session (30 days). LinkedIn URL required at registration.
- **Assessments**: 7 modules per assessment. All auto-save. Radar chart summary computed from Modules 1+4.
- **Chat**: Anthropic API, configurable via admin. Rolling-window rate limits (day/week/month).
- **Admin**: Users, blog, whitepapers, chat config. All via admin dashboard UI.

## Modules

1. **Maturity Assessment (EMB)** — 5 pillars, 21 capabilities, L1/L2/L3 + intelligence nudge
2. **Business Drivers** — Cost/Scale/Expansion/Risk rows
3. **Performance Benchmarks** — 27 pre-seeded KPIs across 4 pillars
4. **Scope of Engineering** — Per-activity required vs current level
5. **Competency Summary** — Auto-computed radar chart (no manual input)
6. **Roles & KRA** — VP/Director/Manager/Developer views
7. **Leadership Qualities** — 20 skills per leader, 0–10 scoring
