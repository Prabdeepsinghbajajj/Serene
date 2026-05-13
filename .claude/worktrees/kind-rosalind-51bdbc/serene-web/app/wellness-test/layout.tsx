import { UserProvider } from "@/context/user-context";
import { WellnessProvider } from "@/context/wellness-context";

// Dev-only layout — provides the same context stack as (app) layout
export const dynamic = "force-dynamic";

export default function WellnessTestLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <UserProvider>
      <WellnessProvider>
        {children}
      </WellnessProvider>
    </UserProvider>
  );
}
