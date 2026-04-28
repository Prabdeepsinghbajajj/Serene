"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { House, Compass, Plus, User } from "lucide-react";
import { useUser } from "@/context/user-context";

/* -------------------------------------------------------------------------- */
/*  Inline leaf SVG for Companion tab                                          */
/*  3-point leaf shape — signals calm and nature, never notifications (§6)     */
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
      {/* Main leaf body */}
      <path
        d="M10 17C6.5 17 3.5 14 3.5 10C3.5 6 6.5 3 10 3C13.5 3 16.5 6 16.5 10C16.5 14 13.5 17 10 17Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      {/* Stem */}
      <path
        d="M10 16.5V8"
        stroke="currentColor"
        strokeWidth="1.1"
        strokeLinecap="round"
        opacity="0.6"
      />
      {/* Left vein */}
      <path
        d="M10 12C8.5 11 7 10 6 8.5"
        stroke="currentColor"
        strokeWidth="0.9"
        strokeLinecap="round"
        opacity="0.4"
      />
      {/* Right vein */}
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
  href: string | ((username: string) => string);
  icon: React.ReactNode;
  isCreate?: boolean;
}

function useNavItems(username: string): { href: string; item: NavItem }[] {
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
      href: (u: string) => `/profile/${u}`,
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
  variant,
}: {
  href: string;
  label: string;
  icon: React.ReactNode;
  isCreate?: boolean;
  active: boolean;
  variant: "sidebar" | "tab";
}) {
  if (variant === "sidebar") {
    return (
      <Link
        href={href}
        aria-label={label}
        aria-current={active ? "page" : undefined}
        className={`flex items-center gap-3 rounded-lg px-3 py-2.5 font-sans text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 ${
          active
            ? "bg-sage-100 text-sage-600"
            : "text-slate-muted hover:bg-cream-200 hover:text-slate-warm"
        }`}
      >
        <span
          className={
            isCreate
              ? "flex h-7 w-7 items-center justify-center rounded-lg bg-sage-100"
              : ""
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
      className={`flex flex-col items-center gap-1 pt-2 pb-1 focus:outline-none focus-visible:ring-2 focus-visible:ring-sage-400 rounded-lg ${
        active ? "text-sage-600" : "text-slate-hint"
      }`}
    >
      <span
        className={
          isCreate
            ? "flex h-9 w-9 items-center justify-center rounded-full bg-sage-100"
            : ""
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
  const { profile } = useUser();
  const username = profile?.username ?? "me";
  const navItems = useNavItems(username);

  function isActive(href: string) {
    if (href === "/feed") return pathname === "/feed";
    return pathname.startsWith(href);
  }

  return (
    <>
      {/* ================================================================= */}
      {/* Desktop sidebar — hidden on mobile                                 */}
      {/* ================================================================= */}
      <aside
        className="hidden md:flex fixed left-0 top-0 bottom-0 w-64 flex-col bg-cream-50 border-r border-cream-200 z-30"
        aria-label="Main navigation"
      >
        {/* Wordmark */}
        <div className="px-6 py-6 flex-shrink-0">
          <span className="font-serif text-xl text-sage-600">Serene</span>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-2 space-y-1 overflow-y-auto">
          {navItems.map(({ href, item }) => (
            <NavLink
              key={href}
              href={href}
              label={item.label}
              icon={item.icon}
              isCreate={item.isCreate}
              active={isActive(href)}
              variant="sidebar"
            />
          ))}
        </nav>
      </aside>

      {/* ================================================================= */}
      {/* Mobile top bar — visible on mobile only                            */}
      {/* ================================================================= */}
      <header
        className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center justify-center bg-cream-50/90 backdrop-blur border-b border-cream-200 h-14"
        aria-label="Serene"
      >
        <span className="font-serif text-lg text-sage-600">Serene</span>
      </header>

      {/* ================================================================= */}
      {/* Mobile bottom tab bar — visible on mobile only                     */}
      {/* ================================================================= */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-end justify-around bg-cream-50 border-t border-cream-200 px-2"
        style={{ paddingBottom: "env(safe-area-inset-bottom, 0px)" }}
        aria-label="Tab navigation"
      >
        {navItems.map(({ href, item }) => (
          <NavLink
            key={href}
            href={href}
            label={item.label}
            icon={item.icon}
            isCreate={item.isCreate}
            active={isActive(href)}
            variant="tab"
          />
        ))}
      </nav>
    </>
  );
}
