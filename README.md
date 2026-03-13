# The Pivot Model — Next.js Website

A full-stack Next.js 14 application for The Pivot Model community platform.

## Tech Stack

| Layer | Technology | Notes |
|---|---|---|
| Framework | Next.js 14 (App Router) | TypeScript, server components |
| Styling | Tailwind CSS + custom CSS | Matches original design exactly |
| Database | SQLite via `better-sqlite3` | Single `.db` file, zero-config |
| Auth | JWT sessions via `jose` | Passwordless (OTP via email) |
| Email | Nodemailer | Any SMTP provider |
| Hosting | Any Node.js VPS | e.g. NettiGritty VPS, DigitalOcean, Hostinger |

## Why SQLite?

SQLite is a single-file database — no separate database server needed.
It works perfectly on shared/VPS hosting with Node.js. If you later need
to scale to MySQL or PostgreSQL, only `lib/db.ts` needs to change.

---

## Quick Start (Local Development)

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.local.example .env.local
# Edit .env.local with your SMTP credentials and JWT secret

# 3. Start development server
npm run dev
# → http://localhost:3000
```

The SQLite database is created automatically at `./data/pivot.db` on first run.

In development mode, OTP codes are printed to the terminal console — no SMTP needed.

---

## Deployment on NettiGritty VPS (or similar Node.js hosting)

### Requirements
- Node.js 18+ 
- npm
- Ability to run a persistent process (PM2 recommended)

### Steps

```bash
# 1. Upload the project files to your VPS
scp -r pivot-nextjs/ user@your-server:/var/www/pivot-model/

# 2. SSH into server
ssh user@your-server
cd /var/www/pivot-model

# 3. Install dependencies
npm install

# 4. Set up environment
cp .env.local.example .env.local
nano .env.local
# Fill in: JWT_SECRET, SMTP_*, ADMIN_EMAIL, NEXT_PUBLIC_SITE_URL

# 5. Build the app
npm run build

# 6. Start with PM2 (keeps running after logout)
npm install -g pm2
pm2 start npm --name "pivot-model" -- start
pm2 startup  # Auto-restart on server reboot
pm2 save

# 7. Set up Nginx reverse proxy (point your domain to port 3000)
```

### Nginx config example

```nginx
server {
    listen 80;
    server_name thepivotmodel.com www.thepivotmodel.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

Then use Certbot for SSL: `certbot --nginx -d thepivotmodel.com`

---

## Project Structure

```
pivot-nextjs/
├── app/
│   ├── layout.tsx          # Root HTML layout
│   ├── page.tsx            # Landing page (home)
│   ├── globals.css         # All styles (design tokens, components)
│   ├── community/
│   │   └── page.tsx        # Community portal (login, EMB, blog, etc.)
│   ├── admin/
│   │   └── page.tsx        # Admin panel (members, leads, blog)
│   └── api/
│       ├── auth/
│       │   ├── login/      # Login + session management
│       │   └── register/   # Registration + OTP
│       ├── emb/            # EMB assessment CRUD
│       ├── leads/          # Consulting inquiries
│       ├── members/        # Member profile management
│       ├── blog/           # Blog post management
│       ├── whitepapers/    # Whitepaper management
│       └── settings/       # Site settings
├── components/
│   ├── Nav.tsx             # Navigation bar
│   ├── HeroSection.tsx     # Landing hero
│   ├── StatsBand.tsx       # Stats numbers
│   ├── ConsultingSection.tsx # Consulting CTA
│   ├── ConsultModal.tsx    # 4-step consulting inquiry modal
│   ├── EMBSpreadsheet.tsx  # Interactive EMB assessment grid
│   ├── Footer.tsx          # Footer
│   └── RevealObserver.tsx  # Scroll reveal animations
├── lib/
│   ├── db.ts               # SQLite database + schema + seed data
│   ├── auth.ts             # JWT sessions + OTP generation
│   └── email.ts            # SMTP email for OTP codes
├── scripts/
│   └── init-db.js          # First-run setup helper
├── data/                   # SQLite database file (auto-created)
│   └── pivot.db            # ← back this up regularly!
├── .env.local.example      # Environment variable template
├── next.config.js
├── tailwind.config.js
└── package.json
```

---

## Database Tables

| Table | Purpose |
|---|---|
| `users` | Registered members |
| `otp_codes` | One-time password codes for login/register |
| `leads` | Consulting inquiry submissions |
| `emb_assessments` | EMB assessment instances (per user) |
| `emb_rows` | Individual capability scores within an assessment |
| `blog_posts` | Blog articles |
| `whitepapers` | Whitepaper listings |
| `settings` | Key-value site configuration |

### Backing up the database

```bash
# Simple backup
cp data/pivot.db data/pivot-backup-$(date +%Y%m%d).db

# Automated daily backup (add to crontab)
0 2 * * * cp /var/www/pivot-model/data/pivot.db /backups/pivot-$(date +\%Y\%m\%d).db
```

---

## Key Features

### 1. EMB Spreadsheet
- Interactive Excel-like grid pre-loaded with all 17 EMB capabilities
- Score each capability L1/L2/L3 + numeric score (1-10)
- Evidence and notes fields per capability
- Expandable criteria panel (click 🔍) showing L1/L2/L3 benchmarks
- Summary dashboard showing overall level and per-pivot averages
- Export to CSV
- Multiple saved assessments per user

### 2. Passwordless Login (OTP)
- Members register with corporate email (free email domains blocked)
- Login/registration via 6-digit OTP sent by email
- No passwords stored
- In development mode, OTP codes print to console

### 3. Consulting Inquiry Modal
- 4-step form (About You / Your Operation / Your Goals / Logistics)
- Saved to SQLite, visible in Admin panel
- Available on landing page and community portal

### 4. Admin Panel (`/admin`)
- Requires admin account (log in via /community first)
- Members management (activate/suspend)
- Consulting leads with status tracking
- Blog post management (create/edit/publish/delete)

### 5. Blog & Whitepapers
- Admin-managed via admin panel
- Members see all posts; public page shows published only

---

## Making a User an Admin

```bash
# Via sqlite3 command line
sqlite3 data/pivot.db "UPDATE users SET is_admin = 1 WHERE email = 'your@email.com';"

# Or in the admin panel once you're already admin
```

---

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `DATABASE_PATH` | No | Path to SQLite file (default: `./data/pivot.db`) |
| `JWT_SECRET` | **Yes** | Long random string for session signing |
| `SMTP_HOST` | **Yes** | SMTP server hostname |
| `SMTP_PORT` | No | SMTP port (default: 587) |
| `SMTP_USER` | **Yes** | SMTP username |
| `SMTP_PASS` | **Yes** | SMTP password |
| `SMTP_FROM` | No | From address for OTP emails |
| `NEXT_PUBLIC_SITE_URL` | No | Your site URL |
| `OTP_EXPIRY_MINUTES` | No | OTP validity (default: 10) |

Generate a JWT secret: `openssl rand -base64 32`

---

## Switching to MySQL (future)

If you outgrow SQLite, only `lib/db.ts` needs to change:

1. Install `mysql2` instead of `better-sqlite3`
2. Rewrite the adapter functions in `lib/db.ts`  
3. All API routes and components remain unchanged

The schema SQL in `lib/db.ts` is standard SQL — easy to port.
