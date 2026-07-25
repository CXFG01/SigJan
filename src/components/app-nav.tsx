"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  CalendarDays,
  CirclePlus,
  Library,
  Network,
  Settings,
  SunMedium,
} from "lucide-react";
import { Brand } from "./brand";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

const links = [
  { href: "/today", label: "Today", icon: SunMedium },
  { href: "/network", label: "Network", icon: Network },
  { href: "/calendar", label: "Calendar", icon: CalendarDays },
  { href: "/library", label: "Library", icon: Library },
] as const;

export function AppNav({ name }: { name: string }) {
  const pathname = usePathname();
  const router = useRouter();

  async function signOut() {
    await getSupabaseBrowserClient()?.auth.signOut();
    router.replace("/");
    router.refresh();
  }

  return (
    <>
      <header className="app-header">
        <div className="app-header-inner">
          <Brand href="/today" />
          <nav className="desktop-nav" aria-label="Main navigation">
            {links.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                aria-current={pathname === href ? "page" : undefined}
              >
                {label}
              </Link>
            ))}
          </nav>
          <div className="header-actions">
            <Link className="button button-primary add-button" href="/add">
              <CirclePlus size={18} aria-hidden="true" /> Add
            </Link>
            <div className="account-menu">
              <button className="account-trigger" popoverTarget="account-popover">
                <span>{name.slice(0, 1).toUpperCase()}</span>
                <span className="sr-only">Open account menu</span>
              </button>
              <div id="account-popover" popover="auto" className="account-popover">
                <p>Signed in as {name}</p>
                <Link href="/settings"><Settings size={17} /> Settings</Link>
                <button onClick={signOut}>Sign out</button>
              </div>
            </div>
          </div>
        </div>
      </header>
      <nav className="mobile-nav" aria-label="Main navigation">
        {links.map(({ href, label, icon: Icon }) => (
          <Link
            key={href}
            href={href}
            aria-current={pathname === href ? "page" : undefined}
          >
            <Icon size={21} aria-hidden="true" />
            <span>{label}</span>
          </Link>
        ))}
        <Link href="/add" aria-current={pathname === "/add" ? "page" : undefined}>
          <CirclePlus size={22} aria-hidden="true" />
          <span>Add</span>
        </Link>
      </nav>
    </>
  );
}
