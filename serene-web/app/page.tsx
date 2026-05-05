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
  "AI that works for you",
  "Not against you",
  "Ads you can actually trust",
  "A friend who knows you",
  "Built for your wellbeing",
  "Not your screen time",
];

/* =========================================================================
   WELLNESS CARDS
   ========================================================================= */
const WELLNESS_CARDS = [
  {
    icon: "⏱",
    title: "Breathing room, built in",
    desc: "Serene checks in after 20 minutes. After 40, it gently suggests a break. Not as a punishment — as a genuine reminder that life is happening outside the screen.",
  },
  {
    icon: "🧘",
    title: "Move. Breathe. Step outside.",
    desc: "Your companion actively encourages you to stand, stretch, and go outside. Your physical health matters here — not just your mood.",
  },
  {
    icon: "🔒",
    title: "No metrics on people",
    desc: "No follower counts. No like counts. No view counts shown publicly. You are not a number and neither is anyone else here.",
  },
  {
    icon: "🌱",
    title: "Ads we'd recommend ourselves",
    desc: "Our AI reads every ad before it runs. If a brand isn't genuinely good for your mental or physical health, it doesn't appear here. Full stop.",
  },
  {
    icon: "🤝",
    title: "AI that builds you up",
    desc: "Instead of learning what keeps you scrolling, Serene's AI learns what makes you feel good — and shows you more of that. A fundamental difference in intention.",
  },
  {
    icon: "🤍",
    title: "Connection, not competition",
    desc: "A quiet leaf instead of a like counter. Share because it matters to you — not because you're tracking performance. This is a space, not a stage.",
  },
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
        className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between"
        style={{
          padding: "1.1rem 3rem",
          background: "rgba(26,26,24,0.70)",
          backdropFilter: "blur(24px) saturate(1.5)",
          WebkitBackdropFilter: "blur(24px) saturate(1.5)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
      >
        <span
          className="font-display font-[400] tracking-[0.08em] text-grad-sage"
          style={{ fontSize: "1.6rem" }}
        >
          Serene
        </span>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-10">
          {[
            { label: "Why Serene", href: "#difference" },
            { label: "Companion", href: "#companion" },
            { label: "Wellness", href: "#wellness" },
          ].map(({ label, href }) => (
            <a
              key={label}
              href={href}
              className="font-sans transition-colors"
              style={{ fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,240,232,0.5)" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F5F0E8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.5)"; }}
            >
              {label}
            </a>
          ))}
        </nav>

        <div className="flex items-center gap-4">
          <Link
            href="/login"
            className="hidden md:block font-sans transition-colors"
            style={{ fontSize: "0.72rem", fontWeight: 500, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(245,240,232,0.4)" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F5F0E8"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.4)"; }}
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="font-sans transition-all duration-200 hover:-translate-y-px"
            style={{
              background: "linear-gradient(135deg, #5E9A52, #3A6032)",
              color: "#F5F0E8",
              padding: "0.55rem 1.5rem",
              borderRadius: "100px",
              fontSize: "0.7rem",
              fontWeight: 600,
              letterSpacing: "0.10em",
              textTransform: "uppercase",
              boxShadow: "0 0 20px rgba(78,122,68,0.4)",
            }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 32px rgba(78,122,68,0.6)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 0 20px rgba(78,122,68,0.4)"; }}
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

        {menuOpen && (
          <motion.div
            className="absolute top-full left-0 right-0 px-6 py-6 space-y-4 md:hidden"
            style={{ background: "rgba(26,26,24,0.97)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {[
              { label: "Why Serene", href: "#difference" },
              { label: "Companion", href: "#companion" },
              { label: "Wellness", href: "#wellness" },
            ].map(({ label, href }) => (
              <a key={label} href={href} className="block font-sans text-sm text-white/60 py-1" onClick={() => setMenuOpen(false)}>
                {label}
              </a>
            ))}
            <div className="flex flex-col gap-3 pt-2 border-t border-white/[0.06]">
              <Link href="/login" className="font-sans text-sm text-white/50 py-1">Sign in</Link>
              <Link href="/signup" className="font-sans text-sm font-[600] text-center py-2.5 rounded-full"
                style={{ background: "linear-gradient(135deg, #5E9A52, #3A6032)", color: "#F5F0E8" }}>
                Join free
              </Link>
            </div>
          </motion.div>
        )}
      </header>

      {/* ================================================================
          HERO
          ================================================================ */}
      <section className="relative min-h-screen grid grid-cols-1 lg:grid-cols-2 items-center gap-8 grid-bg overflow-hidden"
        style={{ background: "#1A1A18", padding: "8rem 3rem 5rem 5rem" }}>

        <div className="blob" style={{ width: 500, height: 500, background: "radial-gradient(circle, rgba(78,122,68,0.25), transparent 70%)", top: "-10%", right: "5%", animationDuration: "14s" }} />
        <div className="blob" style={{ width: 400, height: 400, background: "radial-gradient(circle, rgba(212,136,58,0.12), transparent 70%)", bottom: "0", left: "-5%", animationDuration: "18s", animationDelay: "2s" }} />
        <div className="blob" style={{ width: 350, height: 350, background: "radial-gradient(circle, rgba(122,106,154,0.10), transparent 70%)", top: "30%", left: "30%", animationDuration: "16s", animationDelay: "5s" }} />
        <div className="blob" style={{ width: 250, height: 250, background: "radial-gradient(circle, rgba(58,122,116,0.12), transparent 70%)", bottom: "20%", right: "30%", animationDuration: "20s", animationDelay: "8s" }} />

        {/* LEFT — copy */}
        <motion.div variants={heroContainer} initial="hidden" animate="show" className="relative z-10">
          {/* Eyebrow */}
          <motion.div variants={heroItem} className="flex items-center gap-3 mb-7">
            <div className="h-px w-8" style={{ background: "linear-gradient(90deg, #8ABD80, transparent)" }} />
            <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.25em", color: "#8ABD80" }}>
              Social media, finally on your side
            </span>
          </motion.div>

          {/* H1 */}
          <motion.h1
            variants={heroItem}
            className="font-display mb-7"
            style={{ fontSize: "clamp(3.5rem, 5.5vw, 5.8rem)", fontWeight: 300, lineHeight: 1.0 }}
          >
            <span style={{ color: "#F5F0E8", display: "block" }}>The platform</span>
            <span className="text-grad-hero italic" style={{ display: "block" }}>that works</span>
            <span style={{ color: "#F5F0E8", display: "block" }}>for you.</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p
            variants={heroItem}
            className="font-sans font-[300] mb-10"
            style={{ fontSize: "1rem", lineHeight: 1.9, color: "rgba(245,240,232,0.55)", maxWidth: 420 }}
          >
            Every other platform uses AI to study your habits, moods, and vulnerabilities — to keep you scrolling and sell you things. Serene uses that same intelligence to do the opposite: to understand you, support you, and actively work for your wellbeing.
          </motion.p>

          {/* CTAs */}
          <motion.div variants={heroItem} className="flex flex-wrap items-center gap-4 mb-10">
            <Link
              href="/signup"
              className="font-sans inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-px"
              style={{
                padding: "0.9rem 2.2rem",
                borderRadius: "100px",
                fontSize: "0.78rem",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                background: "linear-gradient(135deg, #6AAF5E, #4E7A44)",
                color: "white",
                boxShadow: "0 4px 24px rgba(78,122,68,0.4), 0 0 0 1px rgba(78,122,68,0.3)",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(78,122,68,0.5), 0 0 40px rgba(78,122,68,0.2)"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(78,122,68,0.4), 0 0 0 1px rgba(78,122,68,0.3)"; }}
            >
              Join Serene →
            </Link>
            <a
              href="#difference"
              className="font-sans inline-flex items-center gap-1 transition-all duration-200"
              style={{ color: "rgba(245,240,232,0.5)", fontSize: "0.78rem", fontWeight: 500 }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#F5F0E8"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(245,240,232,0.5)"; }}
            >
              See what makes us different →
            </a>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={heroItem}
            className="flex flex-wrap gap-10 pt-8"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
          >
            {[
              { num: "0", label: "Times AI is used against you" },
              { num: "100%", label: "Ads vetted for your health" },
              { num: "∞", label: "More present in real life" },
            ].map(({ num, label }) => (
              <div key={label}>
                <span className="font-display text-grad-sage block" style={{ fontSize: "2rem", fontWeight: 400, lineHeight: 1 }}>{num}</span>
                <div className="font-sans mt-1" style={{ fontSize: "0.65rem", fontWeight: 500, letterSpacing: "0.10em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)" }}>{label}</div>
              </div>
            ))}
          </motion.div>
        </motion.div>

        {/* RIGHT — Phone mockup */}
        <motion.div
          className="relative z-10 flex justify-center items-center"
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.8, delay: 0.4, ease: "easeOut" }}
        >
          <div className="relative">
            {/* Floating badge 1 — top right */}
            <motion.div
              className="absolute z-20 hidden lg:flex items-center gap-2.5 rounded-[14px]"
              style={{
                top: "8%", right: "-22%",
                padding: "0.7rem 1rem",
                background: "rgba(30,30,28,0.9)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
              animate={{ y: [0, -8, 0], rotate: [1, 1, 1] }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
            >
              <span style={{ fontSize: "1.1rem" }}>🌿</span>
              <div>
                <div className="font-sans font-[600]" style={{ fontSize: "0.62rem", color: "#F5F0E8", letterSpacing: "0.02em" }}>Feed ended</div>
                <div className="font-sans font-[300]" style={{ fontSize: "0.52rem", color: "rgba(245,240,232,0.4)" }}>Come back tomorrow</div>
              </div>
            </motion.div>

            {/* Floating badge 2 — bottom left */}
            <motion.div
              className="absolute z-20 hidden lg:flex items-center gap-2.5 rounded-[14px]"
              style={{
                bottom: "18%", left: "-24%",
                padding: "0.7rem 1rem",
                background: "rgba(30,30,28,0.9)",
                border: "1px solid rgba(255,255,255,0.10)",
                backdropFilter: "blur(20px)",
                boxShadow: "0 8px 32px rgba(0,0,0,0.3)",
              }}
              animate={{ y: [0, 8, 0], rotate: [-1, -1, -1] }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 1 }}
            >
              <span style={{ fontSize: "1.1rem" }}>🤍</span>
              <div>
                <div className="font-sans font-[600]" style={{ fontSize: "0.62rem", color: "#F5F0E8", letterSpacing: "0.02em" }}>No counts shown</div>
                <div className="font-sans font-[300]" style={{ fontSize: "0.52rem", color: "rgba(245,240,232,0.4)" }}>You&apos;re not a metric</div>
              </div>
            </motion.div>

            {/* Phone shell */}
            <div
              className="phone-float relative overflow-hidden"
              style={{
                width: 270, height: 540,
                borderRadius: 40,
                background: "rgba(30,30,28,0.95)",
                boxShadow: "0 40px 100px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.08), inset 0 1px 0 rgba(255,255,255,0.1)",
              }}
            >
              <div className="absolute inset-0 z-0 pointer-events-none" style={{ background: "linear-gradient(135deg, rgba(78,122,68,0.08), transparent 50%, rgba(212,136,58,0.05))" }} />
              <div className="relative z-10 mx-auto" style={{ width: 90, height: 26, background: "rgba(30,30,28,0.95)", borderRadius: "0 0 18px 18px" }} />
              <div className="relative z-10" style={{ height: "calc(100% - 26px)", display: "flex", flexDirection: "column" }}>
                <div className="flex items-center justify-between px-4 py-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <span className="font-display text-grad-sage" style={{ fontSize: "0.9rem" }}>Serene</span>
                  <span className="font-sans font-[600]" style={{ fontSize: "0.5rem", color: "rgba(255,255,255,0.3)", letterSpacing: "0.05em" }}>9:41</span>
                </div>
                <div className="mx-2.5 mt-2 rounded-2xl overflow-hidden" style={{ border: "1px solid rgba(255,255,255,0.06)", background: "rgba(40,40,38,0.8)" }}>
                  <div className="relative flex items-center justify-center"
                    style={{ height: 120, background: "linear-gradient(135deg, #1A2818 0%, #2A4A30 25%, #4E6A3A 50%, #8A7A40 75%, #C8953A 100%)" }}>
                    <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, transparent 40%, rgba(0,0,0,0.5))" }} />
                    <div className="absolute top-2 right-2 font-sans font-[700] uppercase z-10"
                      style={{ background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.15)", borderRadius: "100px", padding: "0.15rem 0.5rem", fontSize: "0.4rem", color: "rgba(255,255,255,0.9)", letterSpacing: "0.10em" }}>
                      🌿 Peaceful
                    </div>
                    <div className="absolute bottom-2 left-2.5 font-sans font-[600] z-10" style={{ fontSize: "0.45rem", color: "rgba(255,255,255,0.8)", letterSpacing: "0.04em" }}>maya_creates</div>
                  </div>
                  <div className="px-2.5 py-2.5 space-y-2">
                    <p className="font-sans font-[300]" style={{ fontSize: "0.5rem", color: "rgba(245,240,232,0.5)", lineHeight: 1.6 }}>
                      Golden hour from the balcony tonight. Some things stay beautiful.
                    </p>
                    <div className="rounded-lg" style={{ background: "rgba(78,122,68,0.15)", borderLeft: "2px solid rgba(138,189,128,0.4)", padding: "0.45rem 0.55rem" }}>
                      <div className="font-sans font-[600] uppercase mb-1" style={{ fontSize: "0.37rem", letterSpacing: "0.12em", color: "rgba(138,189,128,0.6)" }}>✦ A note from your companion</div>
                      <p className="font-display italic" style={{ fontSize: "0.52rem", color: "rgba(168,216,158,0.9)", lineHeight: 1.5 }}>
                        That light, the way it caught the railing — you saw it, really saw it.
                      </p>
                    </div>
                  </div>
                </div>
                <div className="px-4 py-2 text-center">
                  <p className="font-sans" style={{ fontSize: "0.38rem", color: "rgba(245,240,232,0.2)", letterSpacing: "0.12em" }}>
                    ✦ &nbsp; You&apos;ve seen everything from today &nbsp; ✦
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* ================================================================
          MARQUEE BELT
          ================================================================ */}
      <div className="overflow-hidden" style={{ padding: "1.2rem 0", background: "linear-gradient(135deg, #2F5027, #4E7A44)", borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
        <div className="flex whitespace-nowrap marquee-track">
          {[...MARQUEE_ITEMS, ...MARQUEE_ITEMS].map((item, i) => (
            <span
              key={i}
              className="font-sans font-[600] uppercase inline-flex items-center gap-4"
              style={{ padding: "0 2rem", fontSize: "0.68rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.6)", whiteSpace: "nowrap" }}
            >
              {item}
              <span className="inline-block w-[3px] h-[3px] rounded-full" style={{ background: "rgba(255,255,255,0.3)" }} />
            </span>
          ))}
        </div>
      </div>

      {/* ================================================================
          THE DIFFERENCE
          ================================================================ */}
      <section id="difference" className="relative py-32 overflow-hidden" style={{ background: "linear-gradient(180deg, #1A1A18 0%, #0F1A0D 100%)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ backgroundImage: "linear-gradient(rgba(78,122,68,0.04) 1px, transparent 1px), linear-gradient(90deg, rgba(78,122,68,0.04) 1px, transparent 1px)", backgroundSize: "60px 60px" }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 600, height: 400, top: -100, left: -100, background: "rgba(78,122,68,0.10)", filter: "blur(100px)" }} />
        <div className="absolute rounded-full pointer-events-none" style={{ width: 400, height: 400, bottom: -100, right: -50, background: "rgba(212,136,58,0.06)", filter: "blur(100px)" }} />

        <div className="relative max-w-5xl mx-auto px-6 md:px-10">
          <FadeSection className="mb-14">
            <div className="flex items-center gap-3 mb-5">
              <div className="h-px w-10" style={{ background: "linear-gradient(90deg, #8ABD80, transparent)" }} />
              <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: "#8ABD80" }}>The difference</span>
            </div>
            <h2 className="font-display font-[300]" style={{ fontSize: "clamp(2.5rem, 4vw, 4rem)", lineHeight: 1.05, maxWidth: 600 }}>
              The same AI. A completely<br />
              different <em className="text-grad-hero">intention.</em>
            </h2>
          </FadeSection>

          <FadeSection delay={0.15}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Their column */}
              <div className="rounded-3xl p-10" style={{ background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.05)" }}>
                <div className="font-sans font-[600] uppercase pb-5 mb-6" style={{ fontSize: "0.62rem", letterSpacing: "0.18em", color: "rgba(255,255,255,0.20)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  How other platforms use AI
                </div>
                {[
                  "Studies your mood to show you ads at your weakest moment",
                  "Learns your habits to exploit them for longer sessions",
                  "Uses your emotional state to recommend addictive content",
                  "Slides any ad that pays — regardless of impact on you",
                  "Sends notifications engineered to trigger anxiety and FOMO",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 mb-5">
                    <div className="flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center mt-px" style={{ background: "rgba(255,255,255,0.04)" }}>
                      <span className="font-sans font-[800]" style={{ fontSize: "0.58rem", color: "rgba(255,255,255,0.15)" }}>✕</span>
                    </div>
                    <p className="font-sans font-[300]" style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(245,240,232,0.25)" }}>{text}</p>
                  </div>
                ))}
              </div>

              {/* Our column */}
              <div className="relative rounded-3xl p-10 overflow-hidden" style={{ background: "linear-gradient(135deg, rgba(78,122,68,0.12), rgba(78,122,68,0.06))", border: "1px solid rgba(78,122,68,0.20)" }}>
                <div className="absolute top-0 left-0 right-0 h-[2px]" style={{ background: "linear-gradient(90deg, transparent, #8ABD80, transparent)" }} />
                <div className="font-sans font-[600] uppercase pb-5 mb-6" style={{ fontSize: "0.62rem", letterSpacing: "0.18em", color: "#8ABD80", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  How Serene uses AI
                </div>
                {[
                  "Understands you like a friend — to support, not exploit",
                  "Learns your patterns to nudge you toward rest and balance",
                  "Checks in on your wellbeing and reminds you to breathe",
                  "Vets every ad — only promotes what\u2019s genuinely good for you",
                  "Notifies you only when it actually matters to people you care about",
                ].map((text) => (
                  <div key={text} className="flex items-start gap-3 mb-5">
                    <div className="flex-shrink-0 w-[22px] h-[22px] rounded-full flex items-center justify-center mt-px" style={{ background: "rgba(138,189,128,0.20)" }}>
                      <span className="font-sans font-[800]" style={{ fontSize: "0.58rem", color: "#8ABD80" }}>✦</span>
                    </div>
                    <p className="font-sans font-[300]" style={{ fontSize: "0.82rem", lineHeight: 1.6, color: "rgba(245,240,232,0.85)" }}>{text}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================
          COMPANION  — light cream background
          ================================================================ */}
      <section id="companion" className="py-32" style={{ background: "#F5F0E8" }}>
        <div className="max-w-6xl mx-auto px-6 md:px-10">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-24 items-center">
            {/* Left — copy + feature cards */}
            <FadeSection>
              <div className="flex items-center gap-3 mb-5">
                <div className="h-px w-10" style={{ background: "#4E7A44" }} />
                <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: "#4E7A44" }}>Your companion</span>
              </div>
              <h2 className="font-display font-[300] mb-5" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.5rem)", color: "#1A1A18", lineHeight: 1.1 }}>
                An AI that knows you<br />like a <em className="italic" style={{ color: "#4E7A44" }}>friend.</em><br />Not an algorithm.
              </h2>
              <p className="font-sans font-[300] mb-8" style={{ fontSize: "0.9rem", lineHeight: 1.9, color: "#6B6B63" }}>
                Most platforms use AI to build a profile of your vulnerabilities. Serene uses it to build something different — a genuine understanding of who you are, what you need, and how you&apos;re feeling. Your companion notices when you&apos;re struggling, celebrates what matters to you, and never uses what it knows against you.
              </p>
              <div className="flex flex-col gap-3">
                {[
                  {
                    icon: "🌿",
                    title: "Reads between the lines",
                    body: "Understands the mood and meaning behind what you share — not to target you, but to respond with genuine warmth.",
                  },
                  {
                    icon: "💭",
                    title: "Checks in on you",
                    body: "Asks how you\u2019re doing. Reminds you to stand up, take a breath, go outside. Treats your health as the priority, not your session length.",
                  },
                  {
                    icon: "🌙",
                    title: "Never used against you",
                    body: "What your companion learns about you stays with you. It is never sold, never used for targeting, never weaponised for engagement.",
                  },
                ].map(({ icon, title, body }) => (
                  <div
                    key={title}
                    className="group flex items-start gap-4 rounded-2xl cursor-default transition-all duration-300"
                    style={{ padding: "1.1rem 1.2rem", background: "white", border: "1px solid rgba(78,122,68,0.08)" }}
                    onMouseEnter={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(78,122,68,0.25)";
                      el.style.transform = "translateX(6px)";
                      el.style.boxShadow = "0 4px 20px rgba(78,122,68,0.08)";
                    }}
                    onMouseLeave={(e) => {
                      const el = e.currentTarget as HTMLElement;
                      el.style.borderColor = "rgba(78,122,68,0.08)";
                      el.style.transform = "translateX(0)";
                      el.style.boxShadow = "none";
                    }}
                  >
                    <span className="flex-shrink-0 mt-px" style={{ fontSize: "1.2rem" }}>{icon}</span>
                    <div>
                      <div className="font-sans font-[600] mb-1" style={{ fontSize: "0.83rem", color: "#1A1A18" }}>{title}</div>
                      <div className="font-sans font-[300]" style={{ fontSize: "0.76rem", color: "#6B6B63", lineHeight: 1.55 }}>{body}</div>
                    </div>
                  </div>
                ))}
              </div>
            </FadeSection>

            {/* Right — chat card */}
            <FadeSection delay={0.15}>
              <div
                className="rounded-[28px] p-8"
                style={{
                  background: "#1A1A18",
                  boxShadow: "0 30px 80px rgba(26,26,24,0.20), 0 0 0 1px rgba(255,255,255,0.06)",
                }}
              >
                <div className="flex items-center justify-between mb-6">
                  <span className="font-display text-grad-sage" style={{ fontSize: "1.1rem" }}>Your companion</span>
                  <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.10em", color: "#8ABD80", background: "rgba(78,122,68,0.15)", padding: "0.3rem 0.7rem", borderRadius: "100px", border: "1px solid rgba(78,122,68,0.2)" }}>
                    ● Online
                  </span>
                </div>

                <div className="space-y-4 mb-4">
                  <div className="flex justify-end">
                    <div className="font-sans font-[300] rounded-[18px] rounded-tr-[4px] px-4 py-2.5 max-w-[80%]"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem", color: "rgba(245,240,232,0.8)", lineHeight: 1.5 }}>
                      I&apos;ve been on my phone for hours and I feel kind of hollow about it.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="font-display italic rounded-[18px] rounded-tl-[4px] px-4 py-3 max-w-[85%]"
                      style={{ background: "linear-gradient(135deg, rgba(78,122,68,0.20), rgba(78,122,68,0.10))", border: "1px solid rgba(78,122,68,0.20)", fontSize: "0.88rem", color: "#A8D89E", lineHeight: 1.65 }}>
                      That hollow feeling is worth listening to. Your body noticed something your mind was trying to ignore. What would feel good right now — even just for five minutes?
                    </div>
                  </div>
                  <div className="flex justify-end">
                    <div className="font-sans font-[300] rounded-[18px] rounded-tr-[4px] px-4 py-2.5 max-w-[80%]"
                      style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(255,255,255,0.06)", fontSize: "0.8rem", color: "rgba(245,240,232,0.8)", lineHeight: 1.5 }}>
                      Maybe a walk. I haven&apos;t been outside today.
                    </div>
                  </div>
                  <div className="flex justify-start">
                    <div className="font-display italic rounded-[18px] rounded-tl-[4px] px-4 py-3 max-w-[85%]"
                      style={{ background: "linear-gradient(135deg, rgba(78,122,68,0.20), rgba(78,122,68,0.10))", border: "1px solid rgba(78,122,68,0.20)", fontSize: "0.88rem", color: "#A8D89E", lineHeight: 1.65 }}>
                      That sounds exactly right. I&apos;ll be here when you get back. Go — the feed can wait.
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-4" style={{ borderTop: "1px solid rgba(255,255,255,0.05)" }}>
                  <div className="w-[7px] h-[7px] rounded-full bg-[#8ABD80]" style={{ animation: "pulse 2s ease-in-out infinite" }} />
                  <span className="font-sans font-[300]" style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.3)" }}>
                    Your companion is here whenever you need it
                  </span>
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
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 50% 60% at 50% 50%, rgba(78,122,68,0.15), transparent 60%)" }} />

        <div className="relative max-w-5xl mx-auto px-6 md:px-10">
          <FadeSection className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-8" style={{ background: "#8ABD80" }} />
              <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: "#8ABD80" }}>Inside the app</span>
              <div className="h-px w-8" style={{ background: "#8ABD80" }} />
            </div>
            <h2 className="font-display font-[300] mb-4" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.5rem)", color: "#F5F0E8" }}>
              Beautiful by design.<br />
              <em className="text-grad-hero">Honest by intention.</em>
            </h2>
            <p className="font-sans font-[300] mx-auto" style={{ fontSize: "0.9rem", lineHeight: 1.8, color: "rgba(245,240,232,0.4)", maxWidth: 500 }}>
              Serene looks like a social app. It works like one too. The difference is what&apos;s underneath — an AI that has genuinely different priorities than every other platform you&apos;ve used.
            </p>
          </FadeSection>

          <FadeSection delay={0.2}>
            <div className="rounded-2xl overflow-hidden" style={{ background: "rgba(20,20,18,0.9)", border: "1px solid rgba(255,255,255,0.08)", boxShadow: "0 40px 100px rgba(0,0,0,0.5)" }}>
              <div className="flex items-center gap-3 px-4 py-3.5" style={{ background: "rgba(30,30,28,0.95)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <div className="flex gap-1.5">
                  {[{ bg: "#FF5F57" }, { bg: "#FEBC2E" }, { bg: "#28C840" }].map(({ bg }, i) => (
                    <div key={i} className="w-2.5 h-2.5 rounded-full" style={{ background: bg }} />
                  ))}
                </div>
                <div className="flex-1 mx-4 rounded h-6 flex items-center px-3" style={{ background: "rgba(255,255,255,0.05)" }}>
                  <span className="font-sans" style={{ fontSize: "0.65rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.04em" }}>serene.network/feed</span>
                </div>
              </div>

              <div className="flex" style={{ minHeight: 400 }}>
                <div className="hidden md:flex flex-col py-6 px-4" style={{ width: 220, flexShrink: 0, background: "rgba(245,240,232,0.02)", borderRight: "1px solid rgba(255,255,255,0.05)" }}>
                  <span className="font-display text-grad-sage mb-6 px-3 block" style={{ fontSize: "1.1rem" }}>Serene</span>
                  {[
                    { icon: "🏠", label: "Home", active: true },
                    { icon: "🧭", label: "Discover" },
                    { icon: "＋", label: "Create" },
                    { icon: "👤", label: "Profile" },
                    { icon: "🌿", label: "Companion" },
                  ].map(({ icon, label, active }) => (
                    <div key={label} className="flex items-center gap-2.5 rounded-xl mb-1 cursor-default"
                      style={{
                        padding: active ? "0.6rem 0.75rem 0.6rem calc(0.75rem - 2px)" : "0.6rem 0.75rem",
                        background: active ? "rgba(78,122,68,0.15)" : "transparent",
                        color: active ? "rgba(168,216,158,0.9)" : "rgba(245,240,232,0.4)",
                        borderLeft: active ? "2px solid #8ABD80" : "2px solid transparent",
                        fontSize: "0.72rem",
                      }}>
                      <span style={{ fontSize: "0.9rem" }}>{icon}</span> {label}
                    </div>
                  ))}
                </div>

                <div className="flex-1 p-6 overflow-hidden">
                  <div className="font-display italic mb-6 pb-4" style={{ fontSize: "1rem", color: "rgba(245,240,232,0.4)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                    Good evening, Maya. How are you feeling today?
                  </div>

                  {[
                    {
                      user: "Maya Chen",
                      time: "2h ago",
                      mood: "🌿 Peaceful",
                      imgGrad: "linear-gradient(135deg, #1A2818 0%, #2A4A30 25%, #4E6A3A 50%, #8A7A40 75%, #C8953A 100%)",
                      cap: "Morning walk before the city woke up. These quiet hours are everything.",
                      note: "The light you caught here — what did it feel like to be in it?",
                    },
                    {
                      user: "Alex Rivera",
                      time: "5h ago",
                      mood: "💭 Reflective",
                      imgGrad: "linear-gradient(135deg, #1A2830, #2A4A55, #3A7A74, #6ABAAA)",
                      cap: "Finished the book I\u2019ve been reading for three months. It ended at exactly the right time.",
                      note: "Books have a way of finding us when we\u2019re ready. What stayed with you?",
                    },
                  ].map(({ user, time, mood, imgGrad, cap, note }) => (
                    <div key={user} className="rounded-2xl overflow-hidden mb-4" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}>
                      <div className="relative" style={{ height: 140, background: imgGrad }}>
                        <div className="absolute top-0 left-0 right-0 px-3 py-3 flex items-center justify-between">
                          <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.52rem", letterSpacing: "0.08em", background: "rgba(0,0,0,0.4)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", padding: "0.15rem 0.5rem", color: "rgba(255,255,255,0.85)" }}>
                            {mood}
                          </span>
                        </div>
                      </div>
                      <div className="px-3 py-3">
                        <div className="font-sans font-[600] mb-1.5" style={{ fontSize: "0.65rem", color: "rgba(245,240,232,0.7)", letterSpacing: "0.02em" }}>
                          {user} · <span style={{ fontWeight: 300, color: "rgba(245,240,232,0.3)" }}>{time}</span>
                        </div>
                        <p className="font-sans font-[300] mb-2" style={{ fontSize: "0.62rem", color: "rgba(245,240,232,0.35)", lineHeight: 1.5 }}>{cap}</p>
                        <div className="rounded-lg" style={{ background: "rgba(78,122,68,0.10)", borderLeft: "2px solid rgba(138,189,128,0.30)", padding: "0.4rem 0.5rem" }}>
                          <div className="font-sans font-[600] uppercase mb-1" style={{ fontSize: "0.38rem", letterSpacing: "0.10em", color: "rgba(138,189,128,0.5)" }}>✦ A note from your companion</div>
                          <p className="font-display italic" style={{ fontSize: "0.55rem", color: "rgba(168,216,158,0.7)", lineHeight: 1.4 }}>{note}</p>
                        </div>
                      </div>
                      <div className="flex items-center justify-between px-3 pb-3" style={{ borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "0.5rem" }}>
                        <span className="font-sans flex items-center gap-1.5" style={{ fontSize: "0.6rem", color: "rgba(245,240,232,0.25)" }}>🍃 Resonate</span>
                        <span className="font-sans flex items-center gap-1.5" style={{ fontSize: "0.6rem", color: "rgba(245,240,232,0.25)" }}>💬 Reply</span>
                      </div>
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
      <section id="wellness" className="py-32 relative overflow-hidden" style={{ background: "linear-gradient(180deg, #0F1A0D, #1A1A18)" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 80% 40% at 50% 0%, rgba(78,122,68,0.12), transparent 60%)" }} />

        <div className="relative max-w-6xl mx-auto px-6 md:px-10">
          <FadeSection className="text-center mb-16">
            <div className="flex items-center justify-center gap-3 mb-5">
              <div className="h-px w-8" style={{ background: "#8ABD80" }} />
              <span className="font-sans font-[700] uppercase" style={{ fontSize: "0.65rem", letterSpacing: "0.22em", color: "#8ABD80" }}>How it works</span>
              <div className="h-px w-8" style={{ background: "#8ABD80" }} />
            </div>
            <h2 className="font-display font-[300]" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.5rem)", lineHeight: 1.1 }}>
              Every feature is built<br />around <em className="text-grad-hero">you,</em> not engagement.
            </h2>
          </FadeSection>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {WELLNESS_CARDS.map(({ icon, title, desc }, i) => (
              <FadeSection key={title} delay={i * 0.07}>
                <div
                  className="relative rounded-[22px] p-8 h-full cursor-default transition-all duration-300 overflow-hidden"
                  style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)" }}
                  onMouseEnter={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(78,122,68,0.30)";
                    el.style.transform = "translateY(-6px)";
                    el.style.boxShadow = "0 20px 50px rgba(0,0,0,0.3), 0 0 40px rgba(78,122,68,0.08)";
                  }}
                  onMouseLeave={(e) => {
                    const el = e.currentTarget as HTMLElement;
                    el.style.borderColor = "rgba(255,255,255,0.07)";
                    el.style.transform = "translateY(0)";
                    el.style.boxShadow = "none";
                  }}
                >
                  <div className="w-12 h-12 rounded-[14px] flex items-center justify-center text-2xl mb-6"
                    style={{ background: "linear-gradient(135deg, rgba(78,122,68,0.2), rgba(78,122,68,0.08))", border: "1px solid rgba(78,122,68,0.20)" }}>
                    {icon}
                  </div>
                  <h3 className="font-display font-[400] mb-2.5" style={{ fontSize: "1.2rem", color: "#F5F0E8" }}>{title}</h3>
                  <p className="font-sans font-[300]" style={{ fontSize: "0.78rem", lineHeight: 1.75, color: "rgba(245,240,232,0.45)" }}>{desc}</p>
                </div>
              </FadeSection>
            ))}
          </div>
        </div>
      </section>

      {/* ================================================================
          CTA
          ================================================================ */}
      <section className="py-32 relative overflow-hidden text-center" style={{ background: "#F5F0E8" }}>
        <div className="absolute inset-0 pointer-events-none" style={{ background: "radial-gradient(ellipse 60% 60% at 50% 100%, rgba(78,122,68,0.10), transparent), radial-gradient(ellipse 40% 40% at 20% 20%, rgba(212,136,58,0.06), transparent)" }} />

        <div className="relative max-w-3xl mx-auto px-6 md:px-10">
          <FadeSection>
            <div className="inline-flex items-center gap-2 rounded-full mb-8 font-sans font-[700] uppercase"
              style={{ background: "rgba(78,122,68,0.10)", border: "1px solid rgba(78,122,68,0.20)", padding: "0.4rem 1rem", fontSize: "0.65rem", letterSpacing: "0.12em", color: "#4E7A44" }}>
              ✦ Different by design
            </div>

            <h2 className="font-display font-[300] mb-6" style={{ fontSize: "clamp(3rem, 6vw, 5.5rem)", color: "#1A1A18", lineHeight: 1.0 }}>
              Ready for social media<br />
              that&apos;s actually <em className="text-grad-hero">on your side?</em>
            </h2>

            <p className="font-sans font-[300] mx-auto mb-12" style={{ fontSize: "1rem", lineHeight: 1.85, color: "#6B6B63", maxWidth: 440 }}>
              Serene is what social media looks like when the AI is working for you instead of against you. Join us — and feel the difference.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/signup"
                className="font-sans font-[700] uppercase inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-px"
                style={{ padding: "0.9rem 2.2rem", borderRadius: "100px", fontSize: "0.78rem", letterSpacing: "0.08em", background: "#1A1A18", color: "#F5F0E8", boxShadow: "0 4px 24px rgba(26,26,24,0.25)" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 8px 32px rgba(26,26,24,0.35)"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.boxShadow = "0 4px 24px rgba(26,26,24,0.25)"; }}
              >
                Join Serene — it&apos;s free →
              </Link>
              <Link
                href="/login"
                className="font-sans font-[600] inline-flex items-center gap-2 transition-all duration-300 hover:-translate-y-px"
                style={{ padding: "0.9rem 2rem", borderRadius: "100px", fontSize: "0.78rem", letterSpacing: "0.06em", border: "1.5px solid rgba(78,122,68,0.30)", color: "#4E7A44", background: "transparent" }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "#4E7A44";
                  el.style.background = "rgba(78,122,68,0.06)";
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget as HTMLElement;
                  el.style.borderColor = "rgba(78,122,68,0.30)";
                  el.style.background = "transparent";
                }}
              >
                Sign in
              </Link>
            </div>
          </FadeSection>
        </div>
      </section>

      {/* ================================================================
          FOOTER
          ================================================================ */}
      <footer className="flex flex-col md:flex-row items-center justify-between gap-4"
        style={{ padding: "2.5rem 5rem", background: "#1A1A18", borderTop: "1px solid rgba(255,255,255,0.05)" }}>
        <div className="font-display text-grad-sage" style={{ fontSize: "1.3rem" }}>Serene</div>
        <div className="flex gap-8">
          {["Privacy", "About", "Contact"].map((item) => (
            <a key={item} href="#" className="font-sans transition-colors" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.25)", letterSpacing: "0.10em" }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.color = "#8ABD80"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.color = "rgba(255,255,255,0.25)"; }}>
              {item}
            </a>
          ))}
        </div>
        <div className="font-sans font-[300]" style={{ fontSize: "0.68rem", color: "rgba(255,255,255,0.20)", letterSpacing: "0.05em" }}>
          A place to share. A place to breathe.
        </div>
      </footer>
    </div>
  );
}
