import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  const supabaseUrl = process.env.NEXT_PUBLIC_SERENE_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SERENE_SUPABASE_ANON_KEY;

  // If Supabase credentials are not yet configured (e.g. local dev before
  // filling in .env.local), skip all auth checks and serve the request as-is.
  // This keeps the dev server functional without real credentials.
  if (!supabaseUrl || !supabaseAnonKey) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) =>
          request.cookies.set(name, value)
        );
        supabaseResponse = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          supabaseResponse.cookies.set(name, value, options)
        );
      },
    },
  });

  // IMPORTANT: always call getUser() — never getSession() — per @supabase/ssr docs.
  // getSession() reads from the cookie only and is not safe server-side.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  const isProtectedRoute =
    pathname.startsWith("/feed") ||
    pathname.startsWith("/discover") ||
    pathname.startsWith("/create") ||
    pathname.startsWith("/profile") ||
    pathname.startsWith("/companion") ||
    pathname.startsWith("/settings");

  const isAuthRoute =
    pathname.startsWith("/login") ||
    pathname.startsWith("/signup") ||
    pathname.startsWith("/onboarding");

  if (isProtectedRoute && !user) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  if (isAuthRoute && user) {
    return NextResponse.redirect(new URL("/feed", request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: [
    /*
     * Match all request paths EXCEPT:
     * - _next/static (static files)
     * - _next/image  (image optimisation)
     * - favicon.ico
     * - /design-system (dev reference page — no auth needed)
     * - files with an extension (svg, png, jpg, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|design-system|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
