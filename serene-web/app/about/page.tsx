import Link from "next/link";

export const metadata = {
  title: "About — Serene",
  description: "Serene is a quiet social space for intentional sharing.",
};

export default function AboutPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1A1A18", color: "#F5F0E8" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" className="font-display" style={{ fontSize: "1.3rem", color: "#8ABD80", textDecoration: "none" }}>
          Serene
        </Link>

        <h1 className="font-display" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: "48px", marginBottom: "24px", color: "#F5F0E8" }}>
          About
        </h1>

        <div className="font-sans" style={{ fontSize: "1rem", lineHeight: "1.9", color: "rgba(245,240,232,0.6)", display: "flex", flexDirection: "column", gap: "20px" }}>
          <p>
            Serene is a social space built for people who want to share meaningfully — not endlessly.
            It is a place for slow posts, quiet moments, and genuine connection without the noise.
          </p>
          <p>
            There are no infinite feeds, no algorithmic manipulation, and no engagement metrics
            designed to keep you scrolling. Serene is intentionally limited so that what you share
            actually matters.
          </p>
          <p>
            Your AI companion is private to you. It learns what you share and reflects it back
            thoughtfully — it is never used to target ads or influence your behaviour.
          </p>
          <p>
            Serene is an early product. We are building it slowly and carefully.
          </p>
        </div>

        <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "32px" }}>
          <Link href="/privacy" className="font-sans" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            Privacy
          </Link>
          <Link href="/contact" className="font-sans" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
