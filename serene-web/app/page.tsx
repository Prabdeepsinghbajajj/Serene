"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useInView, type Variants } from "framer-motion";
import { createClient } from "@/lib/supabase/client";

/* =========================================================================
   SESSION CHECK — redirect authenticated users to the app
   ========================================================================= */
function useSessionRedirect() {
  const router = useRouter();
  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) router.replace("/feed");
    });
  }, [router]);
}

/* =========================================================================
   FADE SECTION — scroll-triggered fade-up wrapper
   ========================================================================= */
function FadeSection({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const isInView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      className={className}
      initial={{ opacity: 0, y: 28 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: "easeOut", delay }}
    >
      {children}
    </motion.div>
  );
}

/* =========================================================================
   HERO VARIANTS — staggered entrance
   ========================================================================= */
const heroContainer: Variants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.15, delayChildren: 0.2 } },
};
const heroItem: Variants = {
  hidden: { opacity: 0, y: 32 },
  show: { opacity: 1, y: 0, transition: { duration: 0.65, ease: "easeOut" as const } },
};

/* =========================================================================
   MARQUEE ITEMS
   ========================================================================= */
const MARQUEE_ITEMS = [
  "No infinite scroll",
  "No follower counts",
  "No FOMO ads",
  "AI that wants you to rest",
  "Feed that ends",
  "Calm by design",
];

/* =========================================================================
   COMPARISON DATA
   ========================================================================= */
const COMPARISONS = [
  { label: "Feed algorithm", them: "Maximise watch time", us: "Curated for your mood" },
  { label: "Engagement", them: "Public like counts everywhere", us: "Only you see your numbers" },
  { label: "Ads", them: "Retargeted to your behaviour", us: "Ethical whitelist only" },
  { label: "Session limits", them: "No limits. Ever.", us: "Gentle nudges + daily cap" },
  { label: "AI", them: "Surface content that hooks you", us: "Companion that wants you to log off" },
  { label: "Notifications", them: "Like counts, streaks, FOMO", us: "None of the above" },
];

/* =========================================================================
   WELLNESS CARDS
   ========================================================================= */
const WELLNESS_CARDS = [
  { icon: "🌿", title: "Feed ends at 30 posts", desc: "Your daily feed has a natural end — no endless scroll, no algorithmic rabbit holes." },
  { icon: "🌬️", title: "Breathing breaks", desc: "After 40 minutes, a breathing exercise appears. You can skip it — but you'll probably want to try it." },
  { icon: "🤍", title: "No public counts", desc: "Resonances are private. Your worth isn't measured in numbers visible to strangers." },
  { icon: "🧭", title: "Mood-matched feed", desc: "Posts are selected for how you're feeling right now, not what's going viral." },
  { icon: "🌒", title: "Restful notifications", desc: "No alerts for like milestones, follower counts, or 'you haven't posted in X days'." },
  { icon: "✦", title: "Companion, not algorithm", desc: "Your AI companion wants you to step away. That's not a bug — it's the whole point." },
];

/* =========================================================================
   MAIN COMPONENT
   ========================================================================= */
export default function LandingPage() {
  useSessionRedirect();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-[#1A1A18] overflow-x-hidden">

      {/* ================================================================
          FIXED NAVBAR
          ================================================================ */}
      <header
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 md:px-10 py-4"
        style={{
          background: "rgba(26,26,24,0.75)",
          backdropFilter: "blur(20px)",
          WebkitBackdropFilter: "blur(20px)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span className="font-display text-xl font-[400] text-grad-sage tracking-tight">
          Serene
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-8">
          {[
            { label: "Why Serene", href: "#about" },
            { label: "Wellness", href: "#wellness" },
            { label: "Companion", href: "#companion" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="font-sans text-xs uppercase tracking-[0.12em] text-white/40 hover:text-white/70 transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-3">
          <Link
            href="/login"
            className="hidden md:block font-sans text-sm text-white/40 hover:text-white/70 transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="font-sans text-sm font-[500] px-5 py-2 rounded-full transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #5E9A52, #3A6032)",
              boxShadow: "0 0 20px rgba(78,122,68,0.4)",
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(78,122,68,0.6)";
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(78,122,68,0.4)";
            }}
          >
            Join free
          </Link>
          <button
            className="md:hidden text-white/50 ml-1"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
              {menuOpen ? (
                <path d="M6 6l12 12M6 18L18 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              ) : (
                <path d="M3 6h18M3 12h18M3 18h18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              )}
            </svg>
          </button>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 px-6 py-6 space-y-4 md:hidden"
            style={{ background: "rgba(26,26,24,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {[
              { label: "Why Serene", href: "#about" },
              { label: "Wellness", href: "#wellness" },
              { label: "Companion", href: "#companion" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="block font-sans text-sm text-white/60 py-1" onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.06]">
              <Link href="/login" className="font-sans text-sm text-white/50 py-1">Sign in</Link>
              <Link href="/signup" className="font-sans text-sm font-[500] text-center py-2.5 rounded-full"
                style={{ background: "linear-gradient(135deg, #5E9A52, #3A6032)" }}>
                Join free
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="relative min-h-screen flex items-center grid-bg" style={{ background: "#1A1A18" }}>
        {/* Animated mesh blobs */}
        <div className="blob" style={{ width: 500, height: 500, background: "rgba(78,122,68,0.18)", top: "-10%", right: "-5%", animationDuration: "14s" }} />
        <div className="blob" style={{ width: 400, height: 400, background: "rgba(212,136,58,0.09)", bottom: "5%", left: "-8%", animationDuration: "18s", animationDelay: "4s" }} />
        <div className="blob" style={{ width: 300, height: 300, background: "rgba(122,106,154,0.07)", top: "40%", left: "35%", animationDuration: "16s", animationDelay: "2s" }} />
        <div className="blob" style={{ width: 250, height: 250, background: "rgba(58,122,116,0.09)", bottom: "15%", right: "15%", animationDuration: "20s", animationDelay: "6s" }} />

        <div className="relative z-10 w-full max-w-7xl mx-auto px-6 md:px-10 pt-32 pb-20">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">

            {/* LEFT — copy */}
            <motion.div variants={heroContainer} initial="hidden" animate="show">
              {/* Eyebrow */}
              <motion.div variants={heroItem} className="flex items-center gap-3 mb-6">
                <div className="h-px w-8" style={{ background: "var(--sage-300)" }} />
                <span className="font-sans text-xs uppercase tracking-[0.18em]" style={{ color: "var(--sage-300)" }}>
                  A new kind of social
                </span>
              </motion.div>

              {/* H1 */}
              <motion.h1
                variants={heroItem}
                className="font-display mb-6 leading-[1.0]"
                style={{ fontSize: "clamp(3.2rem, 6vw, 5.5rem)", fontWeight: 300 }}
              >
                <span style={{ color: "#F5F0E8" }}>Share{" "}</span>
                <span style={{
                  WebkitTextStroke: "1px rgba(245,240,232,0.4)",
                  color: "transparent",
                }}>freely.</span>
                <br />
                <span style={{ color: "#F5F0E8" }}>Scroll{" "}</span>
                <span className="text-grad-hero italic">less.</span>
                <br />
                <span className="text-grad-hero italic">Feel better.</span>
              </motion.h1>

              {/* Subtitle */}
              <motion.p
                variants={heroItem}
                className="font-sans font-[300] leading-[1.9] mb-10"
                style={{ color: "var(--text-muted)", maxWidth: 420, fontSize: "1.05rem" }}
              >
                Serene is a social platform that gently asks you to put your phone down.
                No viral algorithms, no like counts, no endless scroll — just the people and moments that matter.
              </motion.p>

              {/* CTAs */}
              <motion.div variants={heroItem} className="flex flex-wrap items-center gap-4 mb-12">
                <Link
                  href="/signup"
                  className="font-sans text-sm font-[500] uppercase tracking-[0.1em] px-8 py-3.5 rounded-full transition-all duration-200 hover:-translate-y-px"
                  style={{
                    background: "linear-gradient(135deg, #5E9A52, #3A6032)",
                    boxShadow: "0 4px 24px rgba(78,122,68,0.35)",
                    color: "#F5F0E8",
                  }}
                >
                  Start for free
                </Link>
                <Link
                  href="#about"
                  className="group font-sans text-sm transition-colors flex items-center gap-2"
                  style={{ color: "var(--text-muted)" }}
                >
                  See how it works
                  <span className="group-hover:translate-x-1 transition-transform inline-block">→</span>
                </Link>
              </motion.div>

              {/* Stats row */}
              <motion.div
                variants={heroItem}
                className="flex flex-wrap gap-8 pt-8"
                style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}
              >
                {[
                  { num: "30", label: "Posts per day max" },
                  { num: "0", label: "Public like counts" },
                  { num: "∞", label: "Calmer scrolling" },
                ].map(({ num, label }) => (
                  <div key={label}>
                    <div className="font-display text-3xl font-[300] text-grad-sage leading-none mb-1">
                      {num}
                    </div>
                    <div className="font-sans text-xs" style={{ color: "var(--text-hint)" }}>
                      {label}
                    </div>
                  </div>
                ))}
              </motion.div>
            </motion.div>

            {/* RIGHT — Phone mockup */}
            <motion.div
              className="flex items-center justify-center relative"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
            >
              {/* Floating badges */}
              <motion.div
                className="absolute -right-4 top-8 z-20 rounded-[14px] px-3.5 py-2.5 text-xs font-sans hidden lg:block"
                style={{
                  background: "rgba(34,34,32,0.9)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backdropFilter: "blur(12px)",
                  color: "#F5F0E8",
                  maxWidth: 180,
                }}
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
              >
                <div className="font-[500] text-white/80 mb-0.5">Feed ended 🌿</div>
                <div style={{ color: "var(--text-hint)" }}>Come back tomorrow</div>
              </motion.div>

              <motion.div
                className="absolute -left-4 bottom-16 z-20 rounded-[14px] px-3.5 py-2.5 text-xs font-sans hidden lg:block"
                style={{
                  background: "rgba(34,34,32,0.9)",
                  border: "1px solid rgba(255,255,255,0.10)",
                  backdropFilter: "blur(12px)",
                  color: "#F5F0E8",
                  maxWidth: 190,
                }}
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 5.5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              >
                <div className="font-[500] text-white/80 mb-0.5">No counts shown 🤍</div>
                <div style={{ color: "var(--text-hint)" }}>You&apos;re not a metric</div>
              </motion.div>

              {/* Phone shell */}
              <div
                className="phone-float relative"
                style={{
                  width: 270,
                  height: 540,
                  background: "#111110",
                  borderRadius: 40,
                  boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08)",
                  overflow: "hidden",
                }}
              >
                {/* Status bar */}
                <div className="flex items-center justify-between px-5 pt-3 pb-2">
                  <span className="font-sans text-[10px] font-[500]" style={{ color: "var(--text-hint)" }}>9:41</span>
                  <div className="font-display text-sm font-[400] text-grad-sage">Serene</div>
                  <div className="flex gap-1 items-center">
                    <div className="w-3 h-1.5 rounded-sm bg-white/20" />
                    <div className="w-1 h-1.5 rounded-sm bg-white/20" />
                  </div>
                </div>

                {/* Notch */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-20 h-5 rounded-b-2xl" style={{ background: "#111110" }} />

                {/* Post card mock */}
                <div className="mx-3 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.07)" }}>
                  {/* Image area */}
                  <div
                    className="relative"
                    style={{
                      height: 200,
                      background: "linear-gradient(135deg, #1A2818 0%, #2A4A30 25%, #4E6A3A 50%, #8A7A40 75%, #C8953A 100%)",
                    }}
                  >
                    {/* Mood pill */}
                    <div
                      className="absolute top-3 right-3 px-2.5 py-1 rounded-full text-[9px] font-[700] uppercase tracking-widest"
                      style={{
                        background: "rgba(0,0,0,0.4)",
                        backdropFilter: "blur(8px)",
                        border: "1px solid rgba(255,255,255,0.12)",
                        color: "rgba(245,240,232,0.85)",
                      }}
                    >
                      ● grateful
                    </div>
                    {/* Username overlay */}
                    <div className="absolute bottom-3 left-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-white/20" />
                      <span className="font-sans text-[10px] text-white/70">maya_k</span>
                    </div>
                  </div>

                  {/* Content */}
                  <div className="px-3 py-3 space-y-2" style={{ background: "rgba(255,255,255,0.025)" }}>
                    <p className="font-sans text-[10px] leading-[1.6]" style={{ color: "rgba(245,240,232,0.45)" }}>
                      Golden hour from the balcony tonight. Some things stay beautiful.
                    </p>
                    {/* Companion note */}
                    <div
                      className="rounded-lg px-2.5 py-2"
                      style={{
                        background: "rgba(78,122,68,0.12)",
                        borderLeft: "2px solid rgba(138,189,128,0.35)",
                      }}
                    >
                      <div className="font-sans text-[7px] uppercase tracking-widest mb-0.5" style={{ color: "rgba(138,189,128,0.6)" }}>
                        ✦ companion
                      </div>
                      <p className="font-display italic text-[9px] leading-[1.5]" style={{ color: "rgba(168,216,158,0.85)" }}>
                        That light, the way it caught the railing — you saw it, really saw it.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Footer message */}
                <div className="px-4 py-3 text-center">
                  <p className="font-sans text-[9px]" style={{ color: "var(--text-hint)" }}>
                    You&apos;ve seen everything from today ✦
                  </p>
                </div>

                {/* Bottom nav */}
                <div
                  className="absolute bottom-0 left-0 right-0 flex justify-around py-3 px-4"
                  style={{
                    background: "rgba(17,17,16,0.95)",
                    borderTop: "1px solid rgba(255,255,255,0.06)",
                  }}
                >
                  {["⌂", "✦", "+", "◯", "🍃"].map((icon) => (
                    <span key={icon} className="text-sm" style={{ color: "rgba(245,240,232,0.25)" }}>{icon}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ================================================================
          MARQUEE BELT
          ================================================================ */}
      <section
        className="relative overflow-hidden py-5"
        style={{ background: "linear-gradient(135deg, #2F5027, #4E7A44)" }}
      >
        <div className="flex whitespace-nowrap marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="font-sans font-[700] uppercase mr-12"
              style={{ fontSize: "0.75rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.55)" }}
            >
              {item} &nbsp;•
            </span>
          ))}
        </div>
      </section>

      {/* ================================================================
          THE DIFFERENCE
          ================================================================ */}
      <section id="about" className="relative py-32 grid-bg" style={{ background: "linear-gradient(180deg, #1A1A18 0%, #0F1A0D 100%)" }}>
        {/* Glow orbs */}
        <div className="absolute top-0 left-0 w-80 h-80 rounded-full pointer-events-none" style={{ background: "rgba(78,122,68,0.08)", filter: "blur(80px)" }} />
        <div className="absolute bottom-0 right-0 w-64 h-64 rounded-full pointer-events-none" style={{ background: "rgba(212,136,58,0.06)", filter: "blur(80px)" }} />

        <div className="relative max-w-5xl mx-auto px-6 md:px-10">
          <FadeSection className="text-center mb-16">
            <span className="font-sans text-xs uppercase tracking-[0.18em] mb-4 block" style={{ color: "var(--sage-300)" }}>The difference</span>
            <h2 className="font-display text-4xl md:text-5xl font-[300]" style={{ color: "#F5F0E8" }}>
              Every other app vs. <span className="text-grad-sage italic">Serene</span>
            </h2>
          </FadeSection>

          {/* Table header */}
          <div className="grid grid-cols-3 gap-4 mb-3 px-4">
            <div className="font-sans text-xs uppercase tracking-widest" style={{ color: "var(--text-hint)" }}>Feature</div>
            <div className="font-sans text-xs uppercase tracking-widest text-center" style={{ color: "var(--text-hint)" }}>Everywhere else</div>
            <div className="font-sans text-xs uppercase tracking-widest text-center" style={{ color: "var(--sage-300)" }}>Serene</div>
          </div>

          <div className="space-y-2">
            {COMPARISONS.map(({ label, them, us }, i) => (
              <FadeSection key={label} delay={i * 0.07}>
                <div className="grid grid-cols-3 gap-4 rounded-xl overflow-hidden">
                  {/* Label */}
                  <div className="px-4 py-4 flex items-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="font-sans text-sm" style={{ color: "rgba(245,240,232,0.5)" }}>{label}</span>
                  </div>
                  {/* Them */}
                  <div className="px-4 py-4 flex items-center justify-center text-center" style={{ background: "rgba(255,255,255,0.02)" }}>
                    <span className="font-sans text-sm" style={{ color: "rgba(245,240,232,0.28)" }}>{them}</span>
                  </div>
                  {/* Us */}
                  <div
                    className="relative px-4 py-4 flex items-center justify-center text-center"
                    style={{ background: "rgba(78,122,68,0.10)", border: "1px solid rgba(78,122,68,0.2)" }}
                  >
                    <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, #A8D89E, #4E7A44)" }} />
                    <span className="font-sans text-sm" style={{ color: "rgba(168,216,158,0.9)" }}>{us}</span>
                  </div>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          COMPANION  (cream bg)
          ================================================================ */}
      <section id="companion" className="py-32" style={{ background: "#F5F0E8" }}>
        <div className="max-w-5xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Left — feature list */}
            <FadeSection>
              <span className="font-sans text-xs uppercase tracking-[0.18em] mb-4 block" style={{ color: "#4E7A44" }}>AI Companion</span>
              <h2 className="font-display text-4xl md:text-5xl font-[300] text-slate-warm mb-6 leading-[1.1]">
                An AI that wants<br />you to <span className="italic text-grad-sage">log off</span>
              </h2>
              <p className="font-sans font-[300] leading-[1.9] mb-10" style={{ color: "#7A7A74", maxWidth: 400, fontSize: "1.05rem" }}>
                Your companion notices your mood in posts, checks in after long sessions, and celebrates your real-life moments — never your follower count.
              </p>
              {[
                "Responds to your actual content, not generic praise",
                "Asks one thoughtful question, not ten",
                "Gently redirects to the present moment",
                "Crisis resources, always, without question",
              ].map((item) => (
                <div
                  key={item}
                  className="group flex items-start gap-3 mb-4 cursor-default"
                >
                  <div className="flex-shrink-0 w-5 h-5 rounded-full mt-0.5 flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8ABD80, #4E7A44)" }}>
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M2 6l3 3 5-5" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </div>
                  <span className="font-sans text-sm leading-[1.7] transition-colors group-hover:translate-x-1 duration-200 inline-block" style={{ color: "#4A4A45" }}>
                    {item}
                  </span>
                </div>
              ))}
            </FadeSection>

            {/* Right — chat card */}
            <FadeSection delay={0.15}>
              <div
                className="rounded-2xl overflow-hidden"
                style={{
                  background: "#1A1A18",
                  boxShadow: "0 24px 60px rgba(0,0,0,0.25)",
                }}
              >
                {/* Chat header */}
                <div className="px-5 py-4" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: "linear-gradient(135deg, #8ABD80, #4E7A44)" }}>
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                        <path d="M12 21C8 21 4 17 4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21Z" fill="white" opacity="0.8"/>
                        <path d="M12 20V10" stroke="white" strokeWidth="1.5" strokeLinecap="round" opacity="0.6"/>
                      </svg>
                    </div>
                    <div>
                      <div className="font-display text-sm font-[400]" style={{ color: "#F5F0E8" }}>Your companion</div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-[#8ABD80]" style={{ animation: "pulse 2s infinite" }} />
                        <span className="font-sans text-[10px] uppercase tracking-widest" style={{ color: "rgba(138,189,128,0.7)" }}>Online</span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Messages */}
                <div className="px-5 py-5 space-y-4">
                  <div className="flex justify-end">
                    <div className="rounded-xl rounded-tr-sm px-4 py-2.5 text-sm max-w-[75%]"
                      style={{ background: "rgba(255,255,255,0.07)", color: "rgba(245,240,232,0.8)" }}>
                      I shared a photo today but I&apos;m not sure why I feel a bit flat.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="rounded-xl rounded-tl-sm px-4 py-3 text-sm max-w-[85%]"
                      style={{
                        background: "rgba(78,122,68,0.15)",
                        borderLeft: "2px solid rgba(138,189,128,0.35)",
                      }}>
                      <p className="font-display italic leading-[1.6]" style={{ color: "rgba(168,216,158,0.9)", fontSize: "0.9rem" }}>
                        That flatness after sharing something real — I recognise it. The photo of the window light: you were present in that moment. That&apos;s not nothing.
                      </p>
                      <p className="font-display italic mt-2 leading-[1.6]" style={{ color: "rgba(168,216,158,0.9)", fontSize: "0.9rem" }}>
                        What would feel grounding right now?
                      </p>
                    </div>
                  </div>
                </div>

                {/* Input area */}
                <div className="px-5 pb-5">
                  <div className="rounded-xl px-4 py-3 flex items-center gap-3 text-sm"
                    style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.07)" }}>
                    <span className="flex-1 font-sans" style={{ color: "rgba(245,240,232,0.25)" }}>What&apos;s on your mind...</span>
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none">
                      <path d="M12 21C8 21 4 17 4 12C4 7 8 3 12 3C16 3 20 7 20 12C20 17 16 21 12 21Z" stroke="rgba(138,189,128,0.5)" strokeWidth="1.5"/>
                    </svg>
                  </div>
                </div>
              </div>
            </FadeSection>
          </div>
        </div>
      </section>

      {/* ================================================================
          APP PREVIEW
          ================================================================ */}
      <section className="py-32 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #0D1A0B, #1A2818, #1A1A18)" }}>
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="w-96 h-96 rounded-full" style={{ background: "rgba(78,122,68,0.06)", filter: "blur(100px)" }} />
        </div>

        <div className="relative max-w-4xl mx-auto px-6 md:px-10 text-center">
          <FadeSection>
            <span className="font-sans text-xs uppercase tracking-[0.18em] mb-4 block" style={{ color: "var(--sage-300)" }}>The app</span>
            <h2 className="font-display text-4xl md:text-5xl font-[300] mb-4" style={{ color: "#F5F0E8" }}>
              Beautiful by design.<br />
              <span className="text-grad-hero italic">Calm by intention.</span>
            </h2>
            <p className="font-sans font-[300] mb-12" style={{ color: "var(--text-muted)", fontSize: "1.05rem" }}>
              Built for the way you actually want to feel, not the way algorithms want you to behave.
            </p>
          </FadeSection>

          <FadeSection delay={0.2}>
            {/* Browser chrome mockup */}
            <div className="rounded-2xl overflow-hidden" style={{ boxShadow: "0 40px 100px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.06)" }}>
              {/* Chrome bar */}
              <div className="flex items-center gap-3 px-4 py-3" style={{ background: "#222220", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-1.5">
                  {["rgba(255,80,80,0.7)", "rgba(255,180,0,0.7)", "rgba(80,200,80,0.7)"].map((c) => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c }} />
                  ))}
                </div>
                <div className="flex-1 mx-3 py-1 px-3 rounded text-xs text-center font-sans" style={{ background: "rgba(255,255,255,0.04)", color: "rgba(245,240,232,0.3)" }}>
                  app.serene.co/feed
                </div>
              </div>

              {/* App content */}
              <div className="flex" style={{ background: "#1A1A18", minHeight: 320 }}>
                {/* Sidebar */}
                <div className="hidden md:flex flex-col py-6 px-4 gap-3 w-48 flex-shrink-0" style={{ borderRight: "1px solid rgba(255,255,255,0.06)" }}>
                  <div className="font-display text-lg text-grad-sage mb-4 px-2">Serene</div>
                  {["🏠 Feed", "✦ Discover", "＋ Create", "◯ Profile", "🍃 Companion"].map((item, i) => (
                    <div key={item} className="rounded-lg px-3 py-2 font-sans text-xs"
                      style={{
                        background: i === 0 ? "rgba(78,122,68,0.12)" : "transparent",
                        color: i === 0 ? "#8ABD80" : "rgba(245,240,232,0.3)",
                        borderLeft: i === 0 ? "2px solid #8ABD80" : "2px solid transparent",
                      }}>
                      {item}
                    </div>
                  ))}
                </div>

                {/* Feed */}
                <div className="flex-1 p-4 space-y-3 overflow-hidden">
                  {[
                    { name: "alex_w", mood: "peaceful", text: "Morning light through the kitchen window..." },
                    { name: "priya.b", mood: "creative", text: "Finished the mural. Three weeks, three walls." },
                  ].map(({ name, mood, text }) => (
                    <div key={name} className="rounded-xl p-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <div className="w-6 h-6 rounded-full" style={{ background: "linear-gradient(135deg, #4E7A44, #8ABD80)" }} />
                          <span className="font-sans text-xs font-[500]" style={{ color: "rgba(245,240,232,0.6)" }}>{name}</span>
                        </div>
                        <span className="font-sans text-[10px] px-2 py-0.5 rounded-full uppercase"
                          style={{ background: "rgba(0,0,0,0.4)", color: "rgba(245,240,232,0.5)", border: "1px solid rgba(255,255,255,0.1)" }}>
                          ● {mood}
                        </span>
                      </div>
                      <p className="font-sans text-xs leading-[1.6]" style={{ color: "rgba(245,240,232,0.35)" }}>{text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================
          WELLNESS CARDS
          ================================================================ */}
      <section id="wellness" className="py-32 relative" style={{ background: "linear-gradient(180deg, #0F1A0D, #1A1A18)" }}>
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 pointer-events-none" style={{ background: "rgba(78,122,68,0.08)", filter: "blur(60px)" }} />

        <div className="relative max-w-6xl mx-auto px-6 md:px-10">
          <FadeSection className="text-center mb-16">
            <span className="font-sans text-xs uppercase tracking-[0.18em] mb-4 block" style={{ color: "var(--sage-300)" }}>Wellness engine</span>
            <h2 className="font-display text-4xl md:text-5xl font-[300]" style={{ color: "#F5F0E8" }}>
              Designed to protect your <span className="text-grad-sage italic">time and peace</span>
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {WELLNESS_CARDS.map(({ icon, title, desc }, i) => (
              <FadeSection key={title} delay={i * 0.08}>
                <div
                  className="group rounded-2xl p-6 h-full cursor-default transition-all duration-300 hover:-translate-y-1.5"
                  style={{
                    background: "rgba(255,255,255,0.03)",
                    border: "1px solid rgba(255,255,255,0.07)",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(78,122,68,0.3)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(78,122,68,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.borderColor = "rgba(255,255,255,0.07)";
                    (e.currentTarget as HTMLElement).style.boxShadow = "none";
                  }}
                >
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xl mb-4"
                    style={{ background: "linear-gradient(135deg, rgba(138,189,128,0.2), rgba(78,122,68,0.15))" }}>
                    {icon}
                  </div>
                  <h3 className="font-sans text-sm font-[500] mb-2" style={{ color: "#F5F0E8" }}>{title}</h3>
                  <p className="font-sans text-sm leading-[1.7]" style={{ color: "var(--text-muted)" }}>{desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA  (cream bg)
          ================================================================ */}
      <section className="py-32 relative overflow-hidden" style={{ background: "#F5F0E8" }}>
        {/* Mesh gradient */}
        <div className="absolute inset-0 pointer-events-none overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 rounded-full" style={{ background: "rgba(78,122,68,0.08)", filter: "blur(80px)" }} />
          <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full" style={{ background: "rgba(212,136,58,0.06)", filter: "blur(80px)" }} />
        </div>

        <div className="relative max-w-3xl mx-auto px-6 md:px-10 text-center">
          <FadeSection>
            <div className="inline-flex items-center gap-2 rounded-full px-4 py-1.5 mb-6 font-sans text-xs font-[500] uppercase tracking-widest"
              style={{ background: "rgba(78,122,68,0.12)", color: "#4E7A44", border: "1px solid rgba(78,122,68,0.2)" }}>
              ✦ Free to join
            </div>

            <h2 className="font-display text-5xl md:text-6xl font-[300] text-slate-warm mb-6 leading-[1.05]">
              A feed that makes you feel{" "}
              <span className="text-grad-hero italic">better</span>
            </h2>

            <p className="font-sans font-[300] leading-[1.9] mb-10 text-slate-muted" style={{ fontSize: "1.05rem" }}>
              Join a social platform that actually respects your attention, your mood, and your time.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="w-full sm:w-auto font-sans text-sm font-[500] uppercase tracking-[0.1em] px-10 py-4 rounded-full text-center transition-all duration-200 hover:-translate-y-px"
                style={{
                  background: "#1A1A18",
                  color: "#F5F0E8",
                  boxShadow: "0 4px 20px rgba(0,0,0,0.15)",
                }}
              >
                Create your account
              </Link>
              <Link
                href="/login"
                className="w-full sm:w-auto font-sans text-sm px-10 py-4 rounded-full text-center transition-all duration-200 hover:bg-sage-100"
                style={{
                  color: "#4E7A44",
                  border: "1px solid rgba(78,122,68,0.4)",
                }}
              >
                I already have an account
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="py-12 px-6 md:px-10" style={{ background: "#1A1A18", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div>
            <div className="font-display text-xl text-grad-sage mb-1">Serene</div>
            <p className="font-sans text-xs" style={{ color: "var(--text-hint)" }}>A place to share. A place to breathe.</p>
          </div>
          <div className="flex flex-wrap items-center gap-6">
            {["Privacy", "Terms", "About", "Contact"].map((item) => (
              <a key={item} href="#" className="font-sans text-xs transition-colors" style={{ color: "var(--text-hint)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.5)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "var(--text-hint)"; }}>
                {item}
              </a>
            ))}
          </div>
          <p className="font-sans text-xs" style={{ color: "var(--text-hint)" }}>
            © {new Date().getFullYear()} Serene
          </p>
        </div>
      </footer>
    </div>
  );
}
