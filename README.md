# 🍁 Maple — Campus Dating, Reimagined

> *Dating with intention, built for people with big goals who still deserve a real connection.*

---

When's the last time you shot your shot?

Let's be real — everyone here is built different. We're all overachievers. And somewhere between grinding for all of it, love got deprioritized.

The hard part isn't wanting it. It's building something real with a complete stranger, only to find out you weren't even their type. Or worse — never shooting your shot because the fear of public failure hits different when everyone knows everyone.

**That's exactly what Maple is built for.**

---

## What Maple Does

No endless swiping. No performing for an algorithm. Maple helps you build genuine relationships within your campus — with people already in your orbit.

- Your lecture-hall crush.
- The one who's always at the gym when you are.
- The person at the end of your floor you keep almost talking to.

Maple uses **geo-matching** — you mark the spots you frequent on a campus map, and Maple surfaces people already moving through campus the way you do. Match mutually, and an **AI agent plans the actual date** for you.

> Currently centered on **Tsinghua University (清华大学)**. Fully bilingual — **English / 中文**, switchable on every page.

---

## How It Works

- **Sign up in one flow** — verify your email with a 6-digit code, then a quick wizard (name → gender → year → who you're into → your campus spots → password).
- **Geo-matching** — drop pins on the places you hang out; matches are weighted by where you both keep showing up.
- **Mutual matches only** — you only connect if both of you are interested. No awkwardness, no guessing.
- **AI plans the date** — when you match, Maple suggests a venue, a time, and an icebreaker tuned to both of you.
- **Blind Box** — feeling bold? Opt in for one curated match outside your immediate circle.
- **Safety first** — one account per person (email + phone are unique), report & block built in.

---

## Tech Stack

- **Frontend:** Next.js (App Router) + TypeScript, Tailwind CSS
- **Backend:** Supabase (Postgres, Row-Level Security, Realtime, Storage)
- **AI:** Anthropic Claude (date planning, icebreakers)
- **Email:** Resend (email verification codes + invites)
- **Maps:** AMap / 高德地图 (campus location picker)
- **Auth:** email verification code + password (scrypt-hashed)
- **i18n:** English / 中文 toggle, shared dictionary
- **Deployment:** Vercel

---

## Getting Started

```bash
npm install
cp .env.example .env.local
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) to see it running.

### Environment variables

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=        # server-only; used for OTP storage

# Email (verification codes + invites)
RESEND_API_KEY=

# AI
ANTHROPIC_API_KEY=

# Maps (高德 / AMap, Web JS API)
NEXT_PUBLIC_AMAP_KEY=
NEXT_PUBLIC_AMAP_SECURITY=
```

> Database setup is applied in Supabase: the core tables (`users`, `swipes`,
> `matches`), an `email_otps` table for verification codes, and unique indexes
> on `lower(email)` and `phone` to enforce one account per person.

---

*Maple isn't dating with more steps — it's dating with intention.*
