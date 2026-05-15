import Link from "next/link";

export const metadata = {
  title: "Contact — Serene",
  description: "Get in touch with the Serene team.",
};

export default function ContactPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1A1A18", color: "#F5F0E8" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" className="font-display" style={{ fontSize: "1.3rem", color: "#8ABD80", textDecoration: "none" }}>
          Serene
        </Link>

        <h1 className="font-display" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: "48px", marginBottom: "12px", color: "#F5F0E8" }}>
          Contact
        </h1>

        <p className="font-sans" style={{ fontSize: "1rem", lineHeight: "1.9", color: "rgba(245,240,232,0.6)", marginBottom: "40px" }}>
          We read every message. Reach us at:
        </p>

        <a
          href="mailto:hello@serene.network"
          className="font-sans"
          style={{ fontSize: "1.1rem", color: "#8ABD80", textDecoration: "none", letterSpacing: "0.02em" }}
        >
          hello@serene.network
        </a>

        <p className="font-sans" style={{ fontSize: "0.85rem", color: "rgba(245,240,232,0.3)", marginTop: "32px", lineHeight: "1.7" }}>
          For account deletion requests, data questions, or anything else —
          we typically respond within a few days.
        </p>

        <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "32px" }}>
          <Link href="/about" className="font-sans" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            About
          </Link>
          <Link href="/privacy" className="font-sans" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            Privacy
          </Link>
        </div>
      </div>
    </div>
  );
}
