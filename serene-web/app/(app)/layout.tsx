import { UserProvider } from "@/context/user-context";
import { WellnessProvider } from "@/context/wellness-context";
import { SessionBanner } from "@/components/wellness/session-banner";
import { RestScreen } from "@/components/wellness/rest-screen";
import { DailyLimitScreen } from "@/components/wellness/daily-limit-screen";
import { Navbar } from "@/components/layout/navbar";

// All (app) routes are session-dependent — never statically prerender
export const dynamic = "force-dynamic";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <WellnessProvider>
        {/* Wellness overlays sit above everything */}
        <SessionBanner />
        <RestScreen />
        <DailyLimitScreen />

          <div className="flex min-h-screen bg-[#1A1A18]">
          <Navbar />
          {/*
            md:ml-64  — offset for desktop sidebar (w-64)
            pt-14     — offset for mobile top bar (h-14)
            pb-20     — space above mobile bottom tab bar
            md:pt-0   — no top offset on desktop (no top bar)
            md:pb-0   — no bottom offset on desktop (no tab bar)
          */}
          <main className="flex-1 md:ml-64 pt-14 pb-20 md:pt-0 md:pb-0">
            {children}
          </main>
        </div>
      </WellnessProvider>
    </UserProvider>
  );
}
