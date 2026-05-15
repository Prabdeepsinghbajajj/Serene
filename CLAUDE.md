# Serene — Project State & Claude Code Instructions

> This file is read automatically by Claude Code at the start of every session.
> It is also shared with Claude (claude.ai) for validation and planning.
> Update this file after every significant change.
> Last updated: May 2026

---

## What is Serene

Serene is a wellness-first social media platform live at **serene.network**.
It looks like Instagram but its entire business logic, feed algorithm, AI layer,
and design system are built around one goal:

> Make users feel content, rested, and good about their lives — NOT maximise time on app.

Core philosophy: **Every other platform uses AI against you. Serene uses it for you.**

Three pillars:
1. AI that works FOR the user (companion, post notes, mood understanding)
2. Genuine care for mental & physical health (rest screens, session limits, move reminders)
3. Ethical advertising (AI vets every ad — only health/nature/creativity brands allowed)

**Read .cursorrules for the complete project bible before writing any code.**

---

## Live URLs

- Web app: https://www.serene.network
- Vercel dashboard: https://vercel.com (auto-deploys on git push to main)
- Supabase project: https://fjfdundcziicyxbrsvgs.supabase.co
- GitHub: https://github.com/Prabdeepsinghbajajj/serene

---

## Project Structure

```
serene/                          ← repo root
├── .cursorrules                 ← COMPLETE PROJECT BIBLE — read this first
├── CLAUDE.md                    ← this file
├── serene-web/                  ← Next.js web app (deployed on Vercel)
└── serene-mobile/               ← Expo React Native app (iOS)
└── supabase/                    ← migrations and edge functions
```

---

## Tech Stack

### Web (serene-web)
- Framework: Next.js 14 App Router, TypeScript strict mode
- Styling: Tailwind CSS + shadcn/ui + Framer Motion
- State: Zustand + React Context
- Forms: React Hook Form + Zod
- Database: Supabase (PostgreSQL + RLS)
- AI: Anthropic claude-sonnet-4-20250514
- Media: Supabase Storage (avatars, posts buckets)
- Deploy: Vercel (auto-deploy on push to main)

### Mobile (serene-mobile)
- Framework: Expo SDK 54 + Expo Router (file-based navigation)
- Language: TypeScript
- Styling: NativeWind (Tailwind for React Native)
- Animations: React Native Reanimated 3
- Navigation: Bottom tab bar (5 tabs)
- Auth: Supabase Auth with AsyncStorage persistence

### Shared
- Database: Supabase (same project for both web and mobile)
- AI: Anthropic claude-sonnet-4-20250514
- All mobile API calls go to: https://www.serene.network/api/...

---

## Environment Variables

### serene-web/.env.local (gitignored — must recreate on new machine)
```
NEXT_PUBLIC_SERENE_SUPABASE_URL=https://fjfdundcziicyxbrsvgs.supabase.co
NEXT_PUBLIC_SERENE_SUPABASE_ANON_KEY=eyJ...
SERENE_SUPABASE_SERVICE_KEY=eyJ...
SERENE_ANTHROPIC_API_KEY=sk-ant-...
NEXT_PUBLIC_SITE_URL=https://www.serene.network
```

### serene-mobile/.env (gitignored — must recreate on new machine)
```
EXPO_PUBLIC_SUPABASE_URL=https://fjfdundcziicyxbrsvgs.supabase.co
EXPO_PUBLIC_SUPABASE_ANON_KEY=eyJ...
EXPO_PUBLIC_API_URL=https://www.serene.network
```

---

## Database Schema (Supabase)

All tables have RLS enabled. Key tables:

| Table | Purpose |
|-------|---------|
| users | Profiles, personality_type, wellness_score |
| posts | content_type, mood_tag, ai_companion_message, media_urls |
| follows | follower_id, following_id |
| resonances | No public counts — leaf icon only |
| comments | Post comments |
| wellness_events | Session tracking, impressions, companion messages |
| personality_profiles | PRIVATE — interaction_graph, mood_history, time_preferences |
| ads | Ethical ads with whitelist enforcement |
| ad_impressions | Click/dismiss tracking |
| discovery_cache | Daily discovery posts per user |

### Critical RLS rules
- `personality_profiles`: owner only, NEVER relax this
- `wellness_events`: owner only
- `posts`: any authenticated user can read published posts (was fixed from follower-only)

### Storage buckets
- `avatars` — profile photos (public)
- `posts` — post media (public)
- File path format: `{user_id}/{timestamp}.{ext}`

---

## What is Built and Working

### Web App ✅
- Full auth (email signup/login + Google OAuth)
- Landing page with dark design at serene.network
- Feed with wellness-first scoring algorithm:
  - Relationship depth 40%, mood-time 30%, recency 20%, serendipity 10%
  - Max 15 posts/page, 30 posts/day cap, 48h recency window
  - No engagement metrics ever used
- PostCard with media carousel, resonance (leaf, no counts), comments, AI companion note
- Post edit and delete (··· button on hover for own posts)
- Post detail sheet (click thumbnail opens slide-in panel)
- WellnessContext: 20/40/60 min thresholds, rest screen, breathing exercise
- Profile pages with post grid, followers/following pages
- Follow/unfollow system
- User search (in sidebar)
- Create post (photo, text, slow post, mood tags)
- Discover tab (daily cache, midnight refresh)
- Ethical ads (whitelist enforced server-side)
- AI Wellness Companion (streaming, Claude API, crisis detection)
- AI Post Companion (vision-capable, specific responses)
- Dark theme design system (Cormorant Garamond + Inter)
- Footer pages: /privacy, /about, /contact

### Mobile App ✅ (Expo Go testing)
- Feed with real PostCards from live API
- Comments (tap icon to expand, type and send)
- Long press own post → delete
- Profile with post grid, stats
- Companion chat (non-streaming, real Claude API)
- Create post with photo upload to Supabase Storage
- Tab bar: Home, Discover, Create (green circle), Profile, Companion
- Sign out via settings gear → Alert
- Edit profile screen (display name, bio, avatar)
- Auth: login + signup screens with dark glass design

---

## Known Bugs & In Progress

### Mobile — High Priority 🔴
- [ ] Profile avatar showing empty circle (no photo, no initials)
      → avatar_url loads but Image fails silently, fallback not rendering
      → Check: console.log('Profile avatar_url:', profile?.avatar_url)
- [ ] Sign in error not yet fully diagnosed
      → May be email not confirmed or network issue
- [ ] Haptics not confirmed working on iPhone
      → expo-haptics installed but ImpactFeedbackStyle.Light may need testing
      → Added test button to profile to isolate the issue

### Mobile — Medium Priority 🟡
- [ ] Discover screen sometimes empty
      → Discovery cache may be empty for this user
      → Refresh button added but root cause unclear
- [ ] Settings Alert only had sign out (fix applied — now has Edit Profile + Wellness)
- [ ] No search for users on mobile

### Web — Medium Priority 🟡
- [ ] Some old posts still show placeholder companion message
      "What a lovely moment to share." instead of real AI message
      → These were created before Anthropic API was connected
      → New posts work correctly
- [ ] Video posts not fully tested

### Both Platforms — Lower Priority 🟢
- [ ] Stories (24hr disappearing content) — not built yet
- [ ] Push notifications — not built yet
- [ ] Direct messages — not built yet
- [ ] Creator analytics dashboard — not built yet
- [ ] Slow post 48hr delivery logic — scaffolded but not implemented

---

## Critical Architecture Decisions

### Mobile API calls
Mobile uses Bearer token auth (not cookies):
```typescript
headers: {
  'Authorization': `Bearer ${session?.access_token}`,
  'Content-Type': 'application/json',
}
```

### Mobile companion endpoint
Mobile uses `/api/ai/wellness-chat-mobile` (non-streaming JSON)
because React Native's fetch cannot consume ReadableStream.
Web uses `/api/ai/wellness-chat` (streaming).
Both use the same system prompt and Claude model.

### Feed algorithm — NEVER change these weights
- Relationship depth: 40%
- Mood-time fit: 30%
- Recency (linear decay 48h): 20%
- Serendipity (stable random): 10%
- NEVER use: likes, views, follower counts, viral velocity

### What is NEVER allowed in the UI
- Red notification badges with counts
- Follower/following counts shown publicly
- Like/resonance counts shown publicly
- "Trending" sections
- Autoplay video with sound
- Notifications for likes, follower milestones, "you haven't posted"

### Supabase client files
- `lib/supabase/client.ts` — browser client (use in Client Components)
- `lib/supabase/server.ts` — server client (use in Server Components + API routes)
- `lib/supabase/admin.ts` — service role (server only, never in browser)

---

## File Naming Conventions
- Files: kebab-case (`post-card.tsx`, `use-wellness.ts`)
- Components: PascalCase exports (`PostCard`, `WellnessNudge`)
- Hooks: camelCase with `use` prefix (`useWellness`, `useFeed`)
- DB tables: snake_case plural (`wellness_events`)
- API routes: kebab-case (`/api/ai/post-companion`)
- Env vars: `SERENE_` prefix for web, `EXPO_PUBLIC_` for mobile

---

## Design System

### Colors
```
Slate (primary bg):  #1A1A18
Cream (light bg):    #F5F0E8
Sage 500 (primary):  #4E7A44
Sage 300 (accent):   #8ABD80
Sage light:          #A8D89E
Amber:               #D4883A
```

### Typography
- Display headings: Cormorant Garamond (300, 400, italic)
- UI/Body: Inter (300, 400, 500, 600)
- Gradient text: linear-gradient(135deg, #A8D89E, #4E7A44)

### Key UI patterns
- Glass cards: `rgba(255,255,255,0.03)` bg + `rgba(255,255,255,0.07)` border
- Companion note: `rgba(78,122,68,0.12)` bg + `2px rgba(138,189,128,0.4)` left border
- Mood pill: `rgba(0,0,0,0.4)` backdrop-blur, uppercase, white/85
- Primary button: `#4E7A44` bg, rounded-full, shadow `rgba(78,122,68,0.4)`

---

## AI System Prompts (from .cursorrules §9)

### Post Companion
Never say "Great photo!", "Love this!", "Beautiful!" 
Be specific about actual content. Under 3 sentences.
Ask one gentle open question.

### Wellness Chat
Warm, grounding, 2-4 sentences.
Not a therapist — a warm friend.
Encourage rest, movement, going outside.
If crisis detected → append crisis resources immediately.
Crisis keywords: suicide, kill myself, hurt myself, self harm,
  want to die, end it all, harm myself.

---

## Build & Deploy Commands

### Web
```bash
cd serene-web
npx tsc --noEmit          # type check
npx next build            # production build
npx next dev              # local dev at localhost:3000
git push                  # triggers Vercel auto-deploy
```

### Mobile
```bash
cd serene-mobile
npx tsc --noEmit          # type check
npx expo start --clear    # start dev server, clear cache
npx expo start            # start dev server
```

### Git workflow
```bash
# Always from repo root or correct subfolder
git add -A
git commit -m "fix/feat/chore: description"
git push
# Vercel auto-deploys serene-web changes in ~60 seconds
```

---

## How to Start a New Claude Code Session

1. Open terminal in VS Code
2. Run: `cd "/Users/prabdeepbajaj/Projects /serene"`
3. Run: `claude --dangerously-skip-permissions`
4. First message: "Read CLAUDE.md and .cursorrules then tell me what you understand"
5. Claude Code will have full context — start giving it tasks

---

## Phase Completion Status

| Phase | Description | Status |
|-------|-------------|--------|
| 1 | Foundation (DB, auth, wellness) | ✅ Complete |
| 2 | Core social (feed, posts, follow) | ✅ Complete |
| 3 | AI layer (companion, post notes) | ✅ Complete |
| 4 | Wellness features (rest, cap) | ✅ Complete |
| 5 | Creator tools (stories, video) | 🟡 Partial |
| 6 | Monetisation (ads built, subscriptions pending) | 🟡 Partial |
| Mobile | React Native Expo app | 🟡 In progress |

---

## What to Work on Next (Priority Order)

1. Fix mobile avatar empty circle bug
2. Diagnose and fix mobile sign in error
3. Confirm haptics working on iPhone
4. Add user search on mobile
5. Stories feature (web + mobile)
6. Push notifications
7. TestFlight submission (needs Apple Developer account)
8. Direct messages (Supabase Realtime)
9. Creator analytics dashboard
