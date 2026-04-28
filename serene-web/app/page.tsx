import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Heading, Body } from "@/components/ui/typography";
import { createClient } from "@/lib/supabase/server";

export default async function LandingPage() {
  const supabase = createClient();

  if (supabase) {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) redirect("/feed");
  }

  return (
    <main className="min-h-screen bg-cream-50 flex items-center justify-center px-8 py-16">
      <div className="w-full max-w-md text-center space-y-12">
        <header className="space-y-6">
          <Heading as="h1" size="xl">
            Serene
          </Heading>
          <Body size="lg" muted>
            A place to share. A place to breathe.
          </Body>
        </header>

        <div className="flex flex-col gap-4">
          <Button asChild size="lg" variant="default">
            <Link href="/signup">Join Serene</Link>
          </Button>
          <Button asChild size="lg" variant="ghost">
            <Link href="/login">Sign in</Link>
          </Button>
        </div>
      </div>
    </main>
  );
}
