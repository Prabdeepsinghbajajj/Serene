"use client";

import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

/* -------------------------------------------------------------------------- */
/*  Scroll-triggered fade-up wrapper                                           */
/* -------------------------------------------------------------------------- */
function FadeSection({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 32 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, delay, ease: "easeOut" }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* Stagger variants for hero children */
const heroContainer = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15 } },
};
const heroItem = {
  hidden: { opacity: 0, y: 24 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.65, ease: "easeOut" as const },
  },
};

/* -------------------------------------------------------------------------- */
/*  Landing page                                                                */
/* -------------------------------------------------------------------------- */
export default function LandingPage() {
  const router = useRouter();

  /* Client-side session check — redirect authenticated users to /feed */
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user) router.replace("/feed");
    });
  }, [router]);

  return (
    <div className="min-h-screen bg-cream-50 text-slate-warm overflow-x-hidden">
      {/* ================================================================ */}
      {/* 1. Fixed navigation bar                                          */}
      {/* ================================================================ */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4 bg-cream-50/85 backdrop-blur-md border-b border-sage-100">
        <span className="font-display font-light text-2xl text-sage-600 tracking-wide">
          Serene
        </span>
        <div className="hidden md:flex items-center gap-8">
          <a
            href="#difference"
            className="font-sans text-sm text-slate-muted hover:text-slate-warm transition-colors"
          >
            Why Serene
          </a>
          <a
            href="#companion"
            className="font-sans text-sm text-slate-muted hover:text-slate-warm transition-colors"
          >
            Companion
          </a>
          <a
            href="#wellness"
            className="font-sans text-sm text-slate-muted hover:text-slate-warm transition-colors"
          >
            Wellness
          </a>
          <Link
            href="/signup"
            className="inline-flex items-center px-4 py-2 rounded-lg bg-sage-600 text-cream-50 font-sans text-sm font-medium shadow-[0_4px_14px_rgba(78,122,68,0.25)] hover:bg-sage-800 hover:-translate-y-px transition-all duration-200"
          >
            Join free
          </Link>
        </div>
        {/* Mobile CTA */}
        <Link
          href="/signup"
          className="md:hidden inline-flex items-center px-3 py-1.5 rounded-lg bg-sage-600 text-cream-50 font-sans text-sm font-medium"
        >
          Join free
        </Link>
      </nav>

      {/* ================================================================ */}
      {/* 2. Hero                                                           */}
      {/* ================================================================ */}
      <section className="min-h-screen flex items-center pt-24 pb-16 px-6 md:px-16 lg:px-24 relative overflow-hidden">
        {/* Background radial circles */}
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
        >
          <div
            className="absolute top-1/4 right-1/4 w-[500px] h-[500px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(201,219,194,0.18) 0%, transparent 70%)",
            }}
          />
          <div
            className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full"
            style={{
              background:
                "radial-gradient(circle, rgba(232,239,228,0.25) 0%, transparent 70%)",
            }}
          />
        </div>

        <div className="max-w-6xl mx-auto w-full grid md:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <motion.div
            variants={heroContainer}
            initial="hidden"
            animate="visible"
            className="space-y-8"
          >
            {/* Eyebrow */}
            <motion.div
              variants={heroItem}
              className="flex items-center gap-4"
            >
              <div className="h-px w-8 bg-sage-400 flex-shrink-0" />
              <span className="font-sans text-xs uppercase tracking-[0.2em] text-sage-600">
                A new kind of social
              </span>
            </motion.div>

            {/* Headline */}
            <motion.h1
              variants={heroItem}
              className="font-display font-light text-5xl md:text-6xl lg:text-7xl leading-[1.08] text-slate-warm"
            >
              Share freely.
              <br />
              Scroll{" "}
              <em className="text-sage-600 not-italic font-light italic">
                less.
              </em>
              <br />
              <em className="text-sage-600 not-italic font-light italic">
                Feel better.
              </em>
            </motion.h1>

            {/* Subtitle */}
            <motion.p
              variants={heroItem}
              className="font-sans font-light text-lg text-slate-muted leading-[1.75] max-w-md"
            >
              Serene is a social platform designed to make you feel good about
              your life — not anxious about it. A feed that ends. An AI that
              genuinely wants you to rest.
            </motion.p>

            {/* CTAs */}
            <motion.div
              variants={heroItem}
              className="flex flex-col sm:flex-row items-start sm:items-center gap-5"
            >
              <Link
                href="/signup"
                className="inline-flex items-center px-7 py-3.5 rounded-xl bg-sage-600 text-cream-50 font-sans font-medium shadow-[0_4px_16px_rgba(78,122,68,0.25)] hover:bg-sage-800 hover:-translate-y-0.5 hover:shadow-[0_6px_22px_rgba(78,122,68,0.35)] transition-all duration-200"
              >
                Join Serene
              </Link>
              <a
                href="#difference"
                className="font-sans text-sm text-slate-muted hover:text-sage-600 transition-colors inline-flex items-center gap-2 group"
              >
                See how it&apos;s different
                <span
                  aria-hidden="true"
                  className="group-hover:translate-x-1 transition-transform duration-200"
                >
                  →
                </span>
              </a>
            </motion.div>
          </motion.div>

          {/* Right — phone mockup (CSS-drawn, desktop only) */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.4, ease: "easeOut" }}
            className="hidden md:flex justify-center items-center"
          >
            <div className="float-animation">
              <div
                className="w-[300px] bg-white overflow-hidden"
                style={{
                  borderRadius: "40px",
                  boxShadow:
                    "0 24px 60px rgba(0,0,0,0.10), 0 8px 20px rgba(0,0,0,0.06), 0 0 0 1px rgba(201,219,194,0.4)",
                }}
              >
                {/* Status bar */}
                <div className="bg-white pt-10 pb-3 px-6 flex items-center justify-between border-b border-cream-100">
                  <span className="font-display text-sm font-light text-sage-600">
                    Serene
                  </span>
                  <span className="font-sans text-xs text-slate-hint">9:41</span>
                </div>

                {/* Post card inside phone */}
                <div className="px-4 pt-4 pb-6 space-y-3">
                  {/* Image placeholder — sage gradient */}
                  <div
                    className="w-full h-44 rounded-2xl"
                    style={{
                      background:
                        "linear-gradient(135deg, #C9DBC2 0%, #87AA7E 55%, #4E7A44 100%)",
                    }}
                    aria-hidden="true"
                  />

                  {/* Post header */}
                  <div className="flex items-center gap-2 pt-0.5">
                    <div className="w-7 h-7 rounded-full bg-sage-200 flex-shrink-0" />
                    <span className="font-sans text-xs font-medium text-slate-warm">
                      maya_creates
                    </span>
                    <span className="ml-auto rounded-full bg-sage-100 px-2 py-0.5 font-sans text-[10px] text-sage-600 tracking-wide">
                      peaceful
                    </span>
                  </div>

                  {/* Companion note */}
                  <div className="rounded-xl bg-sage-100 px-3 py-2.5 space-y-1">
                    <p className="font-sans text-[9px] text-slate-hint uppercase tracking-[0.12em]">
                      A note from your companion
                    </p>
                    <p className="font-display text-[11px] italic text-slate-warm leading-relaxed">
                      The light you caught here — golden, unhurried — feels like
                      a breath.
                    </p>
                  </div>

                  {/* Feed end line */}
                  <div className="flex items-center justify-center gap-2 pt-1">
                    <div className="h-px flex-1 bg-cream-200" />
                    <span className="font-sans text-[10px] text-slate-hint whitespace-nowrap">
                      You&apos;ve seen everything from today ✦
                    </span>
                    <div className="h-px flex-1 bg-cream-200" />
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 3. The Difference — dark section                                 */}
      {/* ================================================================ */}
      <section
        id="difference"
        className="py-28 px-6 md:px-16 lg:px-24"
        style={{ background: "#3A3A35" }}
      >
        <div className="max-w-5xl mx-auto space-y-16">
          <FadeSection className="text-center space-y-5">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-sage-400">
              The difference
            </p>
            <h2 className="font-display font-light text-4xl md:text-5xl text-cream-50 leading-[1.2]">
              Social media doesn&apos;t have to
              <br />
              make you feel{" "}
              <em className="text-sage-400 not-italic italic">worse.</em>
            </h2>
          </FadeSection>

          <FadeSection delay={0.15}>
            <div className="grid md:grid-cols-2 gap-5">
              {/* Other platforms */}
              <div className="rounded-2xl p-8 space-y-4 opacity-55">
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-slate-hint mb-6">
                  Other platforms
                </p>
                {[
                  "Infinite scroll designed to trap you",
                  "Follower counts that fuel comparison",
                  "Ads targeting your fears",
                  "Algorithms that reward outrage",
                  "Notifications designed to compel you back",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-slate-hint mt-0.5 flex-shrink-0 text-sm">
                      ✕
                    </span>
                    <span className="font-sans text-sm text-slate-hint leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>

              {/* Serene */}
              <div
                className="rounded-2xl p-8 space-y-4"
                style={{
                  background: "rgba(46,72,39,0.22)",
                  border: "1px solid rgba(78,122,68,0.35)",
                }}
              >
                <p className="font-sans text-xs uppercase tracking-[0.18em] text-sage-400 mb-6">
                  Serene
                </p>
                {[
                  "A feed that ends — 30 posts, then rest",
                  "No public counts — you're not a number",
                  "Ads only from health and nature brands",
                  "Algorithm built on relationship depth",
                  "An AI companion that wants you to rest",
                ].map((item) => (
                  <div key={item} className="flex items-start gap-3">
                    <span className="text-sage-400 mt-0.5 flex-shrink-0 text-sm">
                      ✦
                    </span>
                    <span className="font-sans text-sm text-cream-100 leading-relaxed">
                      {item}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 4. The Companion                                                  */}
      {/* ================================================================ */}
      <section
        id="companion"
        className="py-28 px-6 md:px-16 lg:px-24 bg-cream-50"
      >
        <div className="max-w-5xl mx-auto grid md:grid-cols-2 gap-16 items-center">
          {/* Left — text */}
          <FadeSection className="space-y-8">
            <div className="space-y-5">
              <p className="font-sans text-xs uppercase tracking-[0.2em] text-sage-600">
                Your companion
              </p>
              <h2 className="font-display font-light text-4xl md:text-5xl text-slate-warm leading-[1.15]">
                An AI that wants you to{" "}
                <em className="text-sage-600 not-italic italic">feel good,</em>
                <br />
                not scroll more.
              </h2>
            </div>

            <p className="font-sans font-light text-base text-slate-muted leading-[1.75]">
              Your companion reads what you share and responds with warmth and
              specificity, not algorithms. It&apos;s a quiet presence — always
              on your side, never on the platform&apos;s.
            </p>

            <div className="space-y-3">
              {[
                {
                  icon: "🌿",
                  title: "Responds to your posts",
                  desc: "Specific, warm, never generic",
                },
                {
                  icon: "💭",
                  title: "A quiet space to check in",
                  desc: "Listens without judgment",
                },
                {
                  icon: "🌙",
                  title: "Tells you when to rest",
                  desc: "And genuinely means it",
                },
              ].map((pill) => (
                <div
                  key={pill.title}
                  className="flex items-start gap-4 rounded-xl px-4 py-3.5 bg-sage-100 border-l-[3px] border-sage-400"
                >
                  <span className="text-base flex-shrink-0 mt-0.5">
                    {pill.icon}
                  </span>
                  <div>
                    <p className="font-sans text-sm font-medium text-slate-warm">
                      {pill.title}
                    </p>
                    <p className="font-sans text-xs text-slate-muted mt-0.5">
                      {pill.desc}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </FadeSection>

          {/* Right — chat mockup */}
          <FadeSection delay={0.2} className="hidden md:block">
            <div className="rounded-2xl bg-cream-100 border border-cream-200 p-6 space-y-4 shadow-sm">
              <p className="font-sans text-xs uppercase tracking-[0.15em] text-slate-hint">
                Your companion
              </p>

              {/* User */}
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-cream-200 px-4 py-3">
                  <p className="font-sans text-sm text-slate-warm leading-relaxed">
                    I keep comparing my work to others and feeling behind.
                  </p>
                </div>
              </div>

              {/* Companion */}
              <div className="flex justify-start">
                <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-sage-100 px-4 py-3">
                  <p className="font-display italic text-sm text-slate-warm leading-relaxed">
                    That feeling is really common — and really exhausting. What
                    would it feel like to just look at your own work today,
                    without comparison?
                  </p>
                </div>
              </div>

              {/* User */}
              <div className="flex justify-end">
                <div className="max-w-[78%] rounded-2xl rounded-br-sm bg-cream-200 px-4 py-3">
                  <p className="font-sans text-sm text-slate-warm leading-relaxed">
                    Honestly… lighter. I hadn&apos;t thought of it that way.
                  </p>
                </div>
              </div>

              {/* Companion */}
              <div className="flex justify-start">
                <div className="max-w-[82%] rounded-2xl rounded-bl-sm bg-sage-100 px-4 py-3">
                  <p className="font-display italic text-sm text-slate-warm leading-relaxed">
                    That lightness is worth protecting. You&apos;ve been
                    scrolling for 38 minutes — would you like to take a short
                    break?
                  </p>
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 5. How It Works                                                   */}
      {/* ================================================================ */}
      <section
        id="wellness"
        className="py-28 px-6 md:px-16 lg:px-24"
        style={{ background: "#EDE6D8" }}
      >
        <div className="max-w-5xl mx-auto space-y-16">
          <FadeSection className="text-center space-y-5">
            <p className="font-sans text-xs uppercase tracking-[0.2em] text-sage-600">
              How it works
            </p>
            <h2 className="font-display font-light text-4xl md:text-5xl text-slate-warm leading-[1.2]">
              Designed for your wellbeing,
              <br />
              not your attention span
            </h2>
          </FadeSection>

          <FadeSection delay={0.15}>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {[
                {
                  icon: "⏱",
                  title: "The feed ends",
                  desc: "30 posts a day, then warmly closes. Your time matters.",
                },
                {
                  icon: "🌬",
                  title: "Rest screens",
                  desc: "Nature and breathing after 40 minutes. A genuine pause.",
                },
                {
                  icon: "🔒",
                  title: "No public counts",
                  desc: "Follower counts are yours alone. You're not a metric.",
                },
                {
                  icon: "🌱",
                  title: "Ethical ads only",
                  desc: "Health, nature, and creativity brands. Nothing exploitive.",
                },
                {
                  icon: "🧭",
                  title: "Calm discovery",
                  desc: "10 curated posts, refreshed once at midnight. Not infinite.",
                },
                {
                  icon: "🤍",
                  title: "Resonance, not likes",
                  desc: "A leaf, not a heart counter. Connection without competition.",
                },
              ].map((card) => (
                <div
                  key={card.title}
                  className="rounded-xl bg-white p-6 space-y-3 hover:-translate-y-1.5 hover:shadow-[0_8px_24px_rgba(0,0,0,0.08)] transition-all duration-250 cursor-default"
                >
                  <span className="text-2xl block" aria-hidden="true">
                    {card.icon}
                  </span>
                  <p className="font-sans font-medium text-slate-warm text-sm tracking-wide">
                    {card.title}
                  </p>
                  <p className="font-sans text-xs text-slate-muted leading-relaxed">
                    {card.desc}
                  </p>
                </div>
              ))}
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================ */}
      {/* 6. CTA                                                            */}
      {/* ================================================================ */}
      <section className="py-36 px-6 text-center bg-cream-50 relative overflow-hidden">
        <div
          className="absolute inset-0 pointer-events-none"
          aria-hidden="true"
          style={{
            background:
              "radial-gradient(ellipse 80% 60% at 50% 0%, rgba(232,239,228,0.55) 0%, transparent 70%)",
          }}
        />
        <FadeSection className="relative space-y-8">
          <h2 className="font-display font-light text-5xl md:text-6xl text-slate-warm leading-[1.15]">
            Ready to feel{" "}
            <em className="text-sage-600 not-italic italic">better</em> online?
          </h2>
          <p className="font-sans font-light text-lg text-slate-muted max-w-lg mx-auto leading-[1.75]">
            Join Serene — a place to share, rest, and actually enjoy being
            online.
          </p>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center px-8 py-4 rounded-xl bg-sage-600 text-cream-50 font-sans font-medium text-base shadow-[0_4px_16px_rgba(78,122,68,0.25)] hover:bg-sage-800 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(78,122,68,0.35)] transition-all duration-200"
            >
              Join Serene — it&apos;s free
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center px-8 py-4 rounded-xl border border-cream-200 text-slate-muted font-sans text-base hover:bg-cream-100 hover:text-slate-warm hover:border-cream-200 transition-all duration-200"
            >
              Sign in
            </Link>
          </div>
        </FadeSection>
      </section>

      {/* ================================================================ */}
      {/* 7. Footer                                                         */}
      {/* ================================================================ */}
      <footer className="border-t border-cream-200 py-12 px-6 md:px-16">
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
          <span className="font-display font-light text-xl text-sage-600">
            Serene
          </span>
          <span className="font-sans text-sm text-slate-hint">
            A place to share. A place to breathe.
          </span>
        </div>
      </footer>
    </div>
  );
}
