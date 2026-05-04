# Serene

> A social platform that gently asks you to put your phone down.

---

## What is Serene?

Serene looks like Instagram on the surface — photos, videos, stories, profiles, follows — but its entire business logic, feed algorithm, AI layer, and design system are built around one goal that no other social platform has ever committed to in code:

**Make users feel content, rested, and good about their lives. Not maximise time on app.**

This is not a tagline. It is an engineering constraint. Every feature decision is measured against it. If a feature increases engagement at the cost of user wellbeing, the feature is wrong — not the measurement.

---

## The Look & Feel

### Landing Page

Dark slate background (`#1A1A18`), animated mesh blobs, subtle grid lines, and a floating CSS phone mockup showing a real feed view. The Serene logo uses a sage-to-forest gradient in Cormorant Garamond.

```
┌─────────────────────────────────────────────────────────┐
│  Serene        Why Serene  Wellness  Companion  Join free│
├─────────────────────────────────────────────────────────┤
│                                                         │
│  Share freely.          ┌──────────────┐               │
│  Scroll less.           │  ☾  Serene   │  ┌──────────┐ │
│  Feel better.           │──────────────│  │Feed ended│ │
│                         │  ▓▓▓▓▓▓▓▓▓▓ │  │🌿 tmrw  │ │
│  Start for free  →      │  ● grateful  │  └──────────┘ │
│                         │  maya_k      │               │
│  30 · 0 · ∞             │  Golden hour…│               │
│  posts/day  counts  calm│  ✦ companion │               │
│                         └──────────────┘               │
└─────────────────────────────────────────────────────────┘
```

### Authenticated App (Dark Theme)

All app screens use the dark palette — glassmorphic cards, sage-green accents, Cormorant Garamond display headings, and DM Sans body text.

```
┌──────────┬──────────────────────────────────────────────┐
│  Serene  │  Good evening          Monday, May 4         │
│          │                                              │
│ ⌂  Feed  │  ┌──────────────────────────────────────┐    │
│ ✦  Disc  │  │  ◉  alex_w               ● peaceful  │    │
│ +  Create│  │  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓  │    │
│ ◯  Profile  │  Morning light through the kitchen...  │    │
│ 🍃  Comp │  │  ✦  The quiet in that light feels    │    │
│          │  │     like it belongs to you.           │    │
│  Sign out│  └──────────────────────────────────────┘    │
└──────────┴──────────────────────────────────────────────┘
```

---

## Core Features

### 🌿 The Wellness Engine

The app actively manages how long you spend on it.

| Time on app | What happens |
|-------------|--------------|
| 20 minutes | Soft top banner — dismiss with one tap, no guilt |
| 40 minutes | Full-screen rest screen with breathing exercise (5s minimum) |
| 60 minutes | Feed locked for 10 minutes |
| 30 posts seen | Daily feed cap reached — warm end screen, not an error |

The daily cap (30 posts) is enforced **server-side** — it cannot be bypassed by the client.

### 🧭 The Feed Algorithm

No likes. No follower counts. No viral velocity. The feed is scored by:

| Signal | Weight |
|--------|--------|
| Relationship depth (DMs, replies, saves) | 40% |
| Mood–time fit (your personality + time of day) | 30% |
| Recency (linear decay over 48 hours) | 20% |
| Serendipity (stable random seed, changes daily) | 10% |

Posts older than 48 hours are excluded entirely. Max 15 posts per page. Max 2 consecutive posts from the same creator.

### 🤍 Resonances (Not Likes)

- No public counts — ever
- Only the post author sees their own resonance count
- Never shown in the feed to other users

### 🍃 AI Companion

Powered by Anthropic Claude. The companion:

- Responds to the **actual content** of your post (not "Great photo!")
- Asks one gentle open-ended question
- Notices your mood across posts and checks in
- Gently redirects toward the present moment after long sessions
- Always surfaces crisis resources if distress signals are detected
- **Wants you to log off** — this is not a bug, it is the design

### ✦ Today's Discoveries

A daily-curated tab (not a feed) that shows 10 posts matched to your personality profile. It refreshes once at midnight and cannot be re-scrolled infinitely.

### 📣 Ethical Ads

Ads are served from a hardcoded whitelist. Nothing outside this list can appear:

`mental_health_apps · physical_wellness · healthy_food_cooking · nature_outdoor_activities · creativity_tools · education · sustainable_products · sleep_aids · local_community_events`

These categories are permanently blocked at the database level:

`fast_fashion · gambling · alcohol · tobacco · weight_loss · beauty_filters · go_viral products · FOMO promotions · cryptocurrency · financial_trading`

Targeting uses only your personality type and time of day — never your behaviour outside Serene, never demographic data.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Web app | Next.js 14 (App Router) · TypeScript strict |
| Styling | Tailwind CSS · shadcn/ui · Framer Motion |
| State | Zustand · React Hook Form + Zod |
| Backend | Supabase (PostgreSQL + Auth + Storage) |
| Edge functions | Supabase Edge Functions (Deno/TypeScript) |
| Media | Cloudflare R2 (images) · Cloudflare Stream (video) |
| AI | Anthropic Claude (`claude-sonnet-4-20250514`) |
| Analytics | Plausible (privacy-first, no fingerprinting) |
| Errors | Sentry |
| Deployment | Vercel (web) · Supabase hosted (backend) |

---

## Project Structure

```
serene/
├── serene-web/              # Next.js 14 web application
│   ├── app/
│   │   ├── (auth)/          # Login, signup, onboarding
│   │   ├── (app)/           # Authenticated app routes
│   │   │   ├── feed/        # Main feed (capped at 30 posts/day)
│   │   │   ├── discover/    # Daily curated picks (10 posts, midnight refresh)
│   │   │   ├── create/      # Post creation wizard
│   │   │   ├── profile/     # User profiles (no public counts)
│   │   │   └── companion/   # AI companion chat
│   │   └── api/             # API route handlers
│   ├── components/
│   │   ├── feed/            # PostCard, FeedSkeleton
│   │   ├── wellness/        # SessionBanner, RestScreen, BreathingCircle
│   │   ├── companion/       # CompanionMessage, CrisisCard
│   │   ├── ads/             # EthicalAdCard
│   │   └── layout/          # Navbar
│   ├── context/
│   │   ├── WellnessContext  # Session tracking, phase management
│   │   └── UserContext      # Auth state, profile
│   ├── lib/
│   │   ├── feed/            # Scoring algorithm
│   │   ├── ai/              # Anthropic wrapper, prompts, crisis detection
│   │   ├── ads/             # Category whitelist/blacklist enforcement
│   │   └── wellness/        # Session nudge logic
│   └── types/               # TypeScript types (database, feed, AI, ads)
└── supabase/
    ├── migrations/          # All schema + RLS policy SQL
    └── functions/           # Edge functions (feed scoring, personality update)
```

---

## Design System

### Colours

| Token | Value | Used for |
|-------|-------|----------|
| `#1A1A18` | Dark slate | App background |
| `#F5F0E8` | Warm cream | Primary text, light sections |
| `#8ABD80` | Sage 300 | Active states, accents |
| `#4E7A44` | Sage 500 | Buttons, gradients |
| `#D4883A` | Amber | Hero gradient endpoint |
| `rgba(255,255,255,0.03)` | Glass card bg | Card backgrounds |

### Typography

- **Display / headings** — Cormorant Garamond (300–500 weight, italic for AI and companion text)
- **UI / body** — DM Sans (300–500 weight)
- **Minimum body size** — 16px. Always. Non-negotiable per design spec.
- **Heading weight** — 500 maximum. Never 700 (too aggressive).

### What is Never Allowed in the UI

- Red notification badges or dot counts
- Countdown timers or urgency indicators
- "X people are watching this" social proof
- Public follower/following counts anywhere except your own settings
- Like/resonance counts in the feed
- "Trending" labels
- Autoplay video with sound
- Push notifications for like counts, follower milestones, or "you haven't posted in X days"

---

## Database

All tables use UUID primary keys, `timestamptz` timestamps, and Row Level Security on every table.

Key tables: `users` · `posts` · `follows` · `resonances` · `comments` · `wellness_events` · `personality_profiles` · `ads` · `ad_impressions` · `discovery_cache`

`personality_profiles` is **private by RLS policy** — it is never exposed via any public API. It stores mood history (last 30 days only, auto-pruned), inferred values, time preferences, and interaction graph scores.

---

## Local Development

```bash
# Clone and install
git clone git@github.com:Prabdeepsinghbajajj/Serene.git
cd Serene/serene-web
npm install

# Copy environment variables
cp .env.local.example .env.local
# Fill in: SERENE_SUPABASE_URL, SERENE_SUPABASE_ANON_KEY,
#          SERENE_SUPABASE_SERVICE_KEY, SERENE_ANTHROPIC_API_KEY,
#          SERENE_R2_BUCKET_URL, SERENE_CLOUDFLARE_STREAM_TOKEN

# Run database migrations (in Supabase SQL editor or CLI)
# supabase/migrations/001_initial_schema.sql
# supabase/migrations/002_rls_policies.sql
# supabase/migrations/003_auth_trigger.sql
# supabase/migrations/004_storage.sql
# supabase/migrations/005_discovery_cache.sql

# Start dev server
npm run dev
```

---

## Philosophy

> "If a feature would increase engagement at the cost of user wellbeing, the feature is wrong — not the measurement."

Serene is not an engagement-maximising platform. It is not ad-revenue driven in a traditional sense. It is not designed around follower counts, viral metrics, or social comparison. It does not have infinite scroll by default. It is not a mental health app — it doesn't provide therapy or clinical support.

It is a social platform that respects your attention, your mood, and your time.

---

*Built with care. Designed to be put down.*
