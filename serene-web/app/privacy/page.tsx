import Link from "next/link";

export const metadata = {
  title: "Privacy — Serene",
  description: "How Serene handles your data.",
};

export default function PrivacyPage() {
  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#1A1A18", color: "#F5F0E8" }}>
      <div style={{ maxWidth: "640px", margin: "0 auto", padding: "80px 24px 120px" }}>
        <Link href="/" className="font-display" style={{ fontSize: "1.3rem", color: "#8ABD80", textDecoration: "none" }}>
          Serene
        </Link>

        <h1 className="font-display" style={{ fontSize: "2.2rem", fontWeight: 300, marginTop: "48px", marginBottom: "24px", color: "#F5F0E8" }}>
          Privacy
        </h1>

        <div className="font-sans" style={{ fontSize: "1rem", lineHeight: "1.9", color: "rgba(245,240,232,0.6)", display: "flex", flexDirection: "column", gap: "28px" }}>
          <div>
            <h2 style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(138,189,128,0.7)", marginBottom: "10px" }}>
              What we collect
            </h2>
            <p>
              We collect what you give us — your email, display name, posts, and the information
              you share with your companion. We also collect basic usage data to keep the product
              working.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(138,189,128,0.7)", marginBottom: "10px" }}>
              Your companion
            </h2>
            <p>
              What your companion learns about you stays with you. It is never sold, never used for
              targeting, and never shared with third parties. Companion conversations are private
              and are not visible to other users.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(138,189,128,0.7)", marginBottom: "10px" }}>
              Third parties
            </h2>
            <p>
              We use Supabase for authentication and data storage, and Anthropic to power the
              companion. We do not sell your data to advertisers or data brokers.
            </p>
          </div>

          <div>
            <h2 style={{ fontSize: "0.8rem", letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(138,189,128,0.7)", marginBottom: "10px" }}>
              Deleting your account
            </h2>
            <p>
              You can request full account deletion at any time. Contact us and we will remove your
              data within 30 days.
            </p>
          </div>
        </div>

        <div style={{ marginTop: "64px", paddingTop: "32px", borderTop: "1px solid rgba(255,255,255,0.07)", display: "flex", gap: "32px" }}>
          <Link href="/about" className="font-sans" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            About
          </Link>
          <Link href="/contact" className="font-sans" style={{ fontSize: "0.75rem", color: "rgba(255,255,255,0.3)", textDecoration: "none", letterSpacing: "0.08em" }}>
            Contact
          </Link>
        </div>
      </div>
    </div>
  );
}
