# Serene

> A wellness-first social media platform. Share freely. Scroll less. Feel better.

Serene looks like Instagram on the surface — photos, videos, stories, profiles, follows — but its entire feed algorithm, AI layer, and design system are built around a completely different goal: **make users feel content, rested, and good about their lives**, not maximise time on app.

---

## What makes Serene different

| Feature | Other platforms | Serene |
|---|---|---|
| Feed | Infinite scroll | Ends after 30 posts, then warmly closes |
| Counts | Public likes & followers | No public counts anywhere |
| Algorithm | Viral velocity, watch time | Relationship depth + mood-time fit |
| AI | Engagement recommendations | A companion that wants you to rest |
| Ads | Fear-based targeting | Health, nature & creativity brands only |
| Discovery | Trending / algorithmic | 10 curated posts, refreshes at midnight |
| Sessions | Designed to trap | Rest nudges at 20 / 40 / 60 minutes |

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router) |
| Language | TypeScript (strict) |
| Styling | Tailwind CSS + shadcn/ui |
| Animations | Framer Motion |
| State | Zustand |
| Forms | React Hook Form + Zod |
| Auth + DB + Storage | Supabase (PostgreSQL + RLS) |
| Media | Cloudflare R2 + Cloudflare Stream |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Analytics | Plausible (privacy-first) |
| Errors | Sentry |
| Deployment | Vercel |

**Fonts:** Cormorant Garamond (display headings on landing) · Instrument Serif (in-app headings) · DM Sans (UI body)

---

## Project structure

```
serene-web/
├── app/
│   ├── page.tsx                    # Marketing landing page
│   ├── layout.tsx                  # Root layout + fonts
│   ├── globals.css
│   ├── (auth)/
│   │   ├── login/
│   │   ├── signup/
│   │   └── onboarding/             # Personality + time preference setup
│   ├── (app)/                      # Authenticated routes
│   │   ├── feed/                   # Main feed (30-post daily cap)
│   │   ├── discover/               # Daily curated discovery (10 posts)
│   │   ├── create/                 # Post creation
│   │   ├── profile/[username]/     # Public profile + edit
│   │   ├── companion/              # AI wellness chat
│   │   └── settings/
│   └── api/
│       ├── feed/                   # Feed scoring + pagination
│       ├── discover/               # Discovery algorithm
│       ├── resonance/              # Resonance (no public counts)
│       ├── follow/
│       ├── profile/
│       ├── ai/
│       │   ├── post-companion/     # AI note on post upload
│       │   └── wellness-chat/      # Streaming companion chat
│       ├── ads/
│       │   ├── next/               # Ethical ad serving
│       │   ├── dismiss/            # Permanent category blocking
│       │   └── click/
│       └── creator/
├── components/
│   ├── feed/                       # PostCard, FeedSkeleton
│   ├── layout/                     # Navbar (desktop sidebar + mobile tabs)
│   ├── companion/                  # CompanionMessage, CrisisCard
│   ├── ads/                        # EthicalAdCard
│   ├── profile/                    # FollowButton, PostGrid
│   ├── wellness/                   # RestScreen, BreathingCircle, SessionBanner
│   └── ui/                         # shadcn/ui components
├── context/
│   ├── UserContext.tsx
│   └── WellnessContext.tsx         # Session timer + daily impression cap
├── hooks/
│   ├── use-feed.ts
│   ├── use-wellness.ts
│   ├── use-session.ts
│   └── use-ai-companion.ts
├── lib/
│   ├── supabase/                   # browser / server / admin clients
│   ├── ai/                         # Anthropic wrapper + crisis detection
│   ├── feed/                       # Scoring algorithm + discovery
│   └── ads/                        # Category whitelist / blacklist
├── types/
│   ├── database.ts                 # Generated Supabase types
│   ├── feed.ts
│   ├── wellness.ts
│   ├── ai.ts
│   └── ads.ts
└── supabase/
    ├── migrations/                 # 001 – 006 SQL migrations
    └── seed/
```

---

## Features built

### Phase 1 — Foundation ✅
- Full database schema with UUID PKs, RLS on every table
- Supabase Auth (email + Google OAuth, PKCE)
- `WellnessContext` — session timer, 3-tier rest intervention (20 / 40 / 60 min), daily 30-post cap
- User profiles — create, edit, avatar upload

### Phase 2 — Core Social ✅
- Post creation — photo, text, mood tag, multi-image carousel
- Feed algorithm — relationship depth (40%) + mood-time fit (30%) + recency (20%) + serendipity (10%)
- Follow system with interaction graph scoring
- Resonance (no public counts — leaf icon, not a heart counter)

### Phase 3 — AI Layer ✅
- Post companion — AI reads your post and responds with something specific (stubbed, ready for Anthropic key)
- Passive personality profiling from post content and interactions
- Wellness chat companion — streaming, `sessionStorage` persistence, crisis detection with immutable crisis card

### Phase 4 — Wellness Features ✅
- Rest screen — full-screen nature image + animated breathing circle (4s in / 4s hold / 4s out)
- Daily cap end screen — warm, never guilt-inducing
- Discovery tab — daily-cached 10 posts, personality-matched, resets at midnight

### Phase 5 — Ethical Ads ✅
- Hardcoded category whitelist (health, nature, creativity) and blacklist (fashion, gambling, weight loss, etc.)
- Server-side targeting by personality type and time of day — client never receives targeting reason
- Permanent ad category blocking on dismiss
- "Partner" label, no third-party pixels

---

## Wellness engine

The `WellnessContext` wraps the entire app and enforces:

| Threshold | Behaviour |
|---|---|
| 20 min | Soft dismissable banner at top |
| 40 min | Full-screen rest screen — 5s minimum before "Keep browsing" appears |
| 60 min | Feed locked for 10 min, breathing exercise shown |
| 30 posts/day | Feed ends — warm affirmation screen, not an error |

---

## Feed algorithm

```
Final score = (relationship_depth × 0.40)
            + (mood_time_fit    × 0.30)
            + (recency_decay    × 0.20)
            + (serendipity      × 0.10)
```

**Hard constraints (never overridden):**
- Never order by: likes, comments, shares, follower count, watch time, viral velocity
- Max 2 consecutive posts from the same creator
- Posts older than 48 hours excluded from main feed
- Max 15 posts per page request
- 30-post daily cap enforced server-side

---

## Getting started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project
- A [Cloudflare R2](https://www.cloudflare.com/developer-platform/r2/) bucket (optional for media)
- An [Anthropic API key](https://console.anthropic.com) (optional — companion runs with placeholder responses without it)

### 1. Install dependencies

```bash
cd serene-web
npm install
```

### 2. Configure environment variables

Copy the example file and fill in your credentials:

```bash
cp .env.local.example .env.local
```

```env
NEXT_PUBLIC_SERENE_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SERENE_SUPABASE_ANON_KEY=your-anon-key
SERENE_SUPABASE_SERVICE_KEY=your-service-key
SERENE_ANTHROPIC_API_KEY=sk-ant-...         # optional
SERENE_R2_BUCKET_URL=https://...            # optional
SERENE_CLOUDFLARE_STREAM_TOKEN=...          # optional
```

### 3. Run database migrations

In your Supabase dashboard SQL editor, run the migration files in order:

```
supabase/migrations/001_initial_schema.sql
supabase/migrations/002_rls_policies.sql
supabase/migrations/003_auth_trigger.sql
supabase/migrations/004_storage_buckets.sql
supabase/migrations/005_discovery_cache.sql
supabase/migrations/006_wellness_event_types.sql
```

### 4. Start the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

---

## Connecting the Anthropic AI

The companion and post-analysis routes are fully built but return placeholder responses until an API key is configured. Search for `// TODO: Replace with Anthropic API call` to find every stub.

Once you add `SERENE_ANTHROPIC_API_KEY` to `.env.local`, the routes use `claude-sonnet-4-20250514` with:
- `max_tokens: 1024` for companion chat
- `max_tokens: 256` for post analysis
- Streaming responses

---

## Design principles

- **No pure black or white** — `cream-50` and `slate-warm` only
- **Body text minimum 16px**, line-height 1.7
- **Headings weight 500** — never 700 (too aggressive)
- **Generous padding** — minimum `p-6` on cards, `p-8` on screens
- **No red badges, countdown timers, or urgency indicators** — ever
- **No follower / resonance counts shown publicly** — only the post author sees their own counts, privately

---

## Deployment

Deploy to Vercel with zero configuration:

```bash
vercel deploy
```

Set all environment variables in the Vercel dashboard under **Project → Settings → Environment Variables**.

---

## License

Private. All rights reserved.
