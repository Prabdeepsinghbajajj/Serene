"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Plus, User, LogOut, Search } from "lucide-react";
import { useUser } from "@/context/user-context";
import { UserSearch } from "@/components/search/user-search";
import { MobileSearchOverlay } from "@/components/search/mobile-search-overlay";

/* -------------------------------------------------------------------------- */
/*  Inline leaf SVG for Companion tab                                          */
/* -------------------------------------------------------------------------- */
function LeafNavIcon({ className }: { className?: string }) {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 20 20"
      fill="none"
      aria-hidden="true"
      className={className}
    >
      <path
        d="M10 17C6.5 17 3.5 14 3.5 10C3.5 6 6.5 3 10 3C13.5 3 16.5 6 16.5 10C16.5 14 13.5 17 10 17Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="M10 16.5V8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.6"
      />
      <path
        d="M10 12C8.5 11 7 10 6 8.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M10 12C11.5 11 13 10 14 8.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />
    </svg>
  );
}

/* -------------------------------------------------------------------------- */
/*  Nav item data                                                               */
/* -------------------------------------------------------------------------- */
interface NavItem {
  label: string;
  href: string | ((username: string | undefined) => string);
  icon: React.ReactNode;
  isCreate?: boolean;
}

function useNavItems(username: string | undefined): { href: string; item: NavItem }[] {
  const items: NavItem[] = [
    { label: "Home", href: "/feed", icon: <House size={20} aria-hidden="true" /> },
    { label: "Discover", href: "/discover", icon: <Compass size={20} aria-hidden="true" /> },
    {
      label: "Create",
      href: "/create",
      icon: <Plus size={20} aria-hidden="true" />,
      isCreate: true,
    },
    {
      label: "Profile",
      href: (u: string | undefined) => (u ? `/profile/${u}` : "/profile"),
      icon: <User size={20} aria-hidden="true" />,
    },
    {
      label: "Companion",
      href: "/companion",
      icon: <LeafNavIcon />,
    },
  ];

  return items.map((item) => ({
    href: typeof item.href === "function" ? item.href(username) : item.href,
    item,
  }));
}

/* -------------------------------------------------------------------------- */
/*  Shared link component                                                       */
/* -------------------------------------------------------------------------- */
function NavLink({
  href,
  label,
  icon,
  isCreate = false,
  active,
  muted = false,
  variant,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isCreate?: boolean;
  active: boolean;
  muted?: boolean;
  variant: "sidebar" | "tab";
}) {
  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg py-2.5 font-sans text-sm transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 border-l-2 ${
          active
            ? "bg-sage-500/15 text-sage-300 border-sage-300 pl-[10px] pr-3"
            : "text-white/40 hover:text-white/80 hover:bg-white/[0.04] border-transparent px-3"
        } ${muted ? "opacity-60" : "opacity-100"}`}
      >
        <span
          className={
            isCreate
              ? "flex h-8 w-8 items-center justify-center rounded-full text-white"
              : ""
          }
          style={
            isCreate
              ? { background: "linear-gradient(135deg, #5E9A52, #3A6032)" }
              : {}
          }
        >
          {icon}
        </span>
        {label}
      </Link>
    );
  }

  // Mobile tab
  return (
    <Link
      href={href}
      aria-label={label}
      aria-current={active ? "page" : undefined}
      className={`flex flex-col items-center gap-1 pt-2 pb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded-lg transition-all duration-200 ${
        active ? "text-sage-300" : "text-white/30"
      } ${muted ? "opacity-60" : "opacity-100"}`}
    >
      <span
        className={
          isCreate
            ? "flex h-9 w-9 items-center justify-center rounded-full text-white"
            : ""
        }
        style={
          isCreate
            ? { background: "linear-gradient(135deg, #5E9A52, #3A6032)" }
            : {}
        }
      >
        {icon}
      </span>
      <span className="font-sans text-xs">{label}</span>
    </Link>
  );
}

/* -------------------------------------------------------------------------- */
/*  Navbar                                                                      */
/* -------------------------------------------------------------------------- */
export function Navbar() {
  const pathname = usePathname();
  const { profile, loading, signOut } = useUser();
  const username = profile?.username;
  const navItems = useNavItems(username);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);

  function isActive(href: string) {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ================================================================= */}
      {/* Desktop sidebar                                                    */}
      {/* ================================================================= */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col z-30"
        style={{
          background: "#1A1A18",
          borderRight: "1px solid rgba(255,255,255,0.07)",
        }}
        aria-label="Main navigation"
      >
        {/* Wordmark */}
        <div className="px-6 py-6 flex-shrink-0" style={{ borderBottom: "1px solid rgba(255,255,255,0.07)" }}>
          <Link
            href="/feed"
            className="font-display text-2xl text-grad-sage cursor-pointer no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded"
          >
            Serene
          </Link>
        </div>

        <div className="flex-shrink-0 px-4 pt-4 pb-3">
          <UserSearch className="w-full" />
          <div
            className="mt-4"
            style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}
            aria-hidden
          />
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 py-2 space-y-1 overflow-y-auto min-h-0">
          {navItems.map(({ href, item }) => (
            <NavLink
              key={item.label}
              href={href}
              label={item.label}
              icon={item.icon}
              isCreate={item.isCreate}
              active={isActive(href)}
              muted={item.label === "Profile" && loading}
              variant="sidebar"
            />
          ))}
        </nav>

        {/* Sign out */}
        <div className="flex-shrink-0 px-2 py-4" style={{ borderTop: "1px solid rgba(255,255,255,0.07)" }}>
          <button
            type="button"
            onClick={signOut}
            className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm text-white/25 hover:text-white/40 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
          >
            <LogOut size={20} aria-hidden="true" />
            Sign out
          </button>
        </div>
      </aside>

      {/* ================================================================= */}
      {/* Mobile top bar                                                     */}
      {/* ================================================================= */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex h-14 items-center justify-center px-3"
        style={{
          background: "rgba(26,26,24,0.95)",
          borderBottom: "1px solid rgba(255,255,255,0.06)",
        }}
        aria-label="Serene"
      >
        <button
          type="button"
          onClick={() => setMobileSearchOpen(true)}
          className="absolute left-3 top-1/2 -translate-y-1/2 rounded-lg p-2 text-white/50 transition-colors hover:bg-white/[0.06] hover:text-white/70 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400"
          aria-label="Search people"
        >
          <Search size={20} aria-hidden />
        </button>
        <Link
          href="/feed"
          className="font-display text-lg text-grad-sage cursor-pointer no-underline focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded"
        >
          Serene
        </Link>
      </header>

      <MobileSearchOverlay
        open={mobileSearchOpen}
        onClose={() => setMobileSearchOpen(false)}
      />

      {/* ================================================================= */}
      {/* Mobile bottom tab bar                                              */}
      {/* ================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-end justify-around px-2"
        style={{
          background: "rgba(26,26,24,0.98)",
          borderTop: "1px solid rgba(255,255,255,0.06)",
          paddingBottom: "env(safe-area-inset-bottom, 0px)",
        }}
        aria-label="Tab navigation"
      >
        {navItems.map(({ href, item }) => (
          <NavLink
            key={item.label}
            href={href}
            label={item.label}
            icon={item.icon}
            isCreate={item.isCreate}
            active={isActive(href)}
            muted={item.label === "Profile" && loading}
            variant="tab"
          />
        ))}
      </nav>
    </>
  );
}
