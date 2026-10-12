"use client";

import {
  BookOpen,
  BrainCircuit,
  House,
  ListChecks,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  Vote,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { cn } from "@/lib/cn";
import { canAccessAdministration } from "@/lib/permissions";
import { openTasksForMember } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import { ProfileMenu } from "./ProfileMenu";

interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

const NAV: NavItem[] = [
  { href: "/", label: "Home", icon: House },
  { href: "/resources", label: "Resources", icon: BookOpen },
  { href: "/people", label: "People", icon: Users },
  { href: "/tasks", label: "Tasks", icon: ListChecks },
  { href: "/polls", label: "Polls", icon: Vote },
];

const ADMIN_ITEM: NavItem = { href: "/admin", label: "Administration", icon: ShieldCheck };
const PROFILE_ITEM: NavItem = { href: "/profile", label: "Profile", icon: UserRound };

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function NavLinks({ pathname, onNavigate }: { pathname: string | null; onNavigate?: () => void }) {
  const { role, data, currentMember } = useDemo();
  const openTasks = openTasksForMember(data, currentMember.id).length;
  const items = [...NAV, ...(canAccessAdministration(role) ? [ADMIN_ITEM] : []), PROFILE_ITEM];

  return (
    <ul className="grid gap-0.5">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={cn(
                "group flex min-h-10 items-center gap-3 rounded-[var(--radius-control)] px-3 text-[15px] font-medium transition-colors",
                active ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-surface-2 hover:text-fg",
              )}
            >
              <Icon aria-hidden className={cn("size-[18px]", active ? "text-accent-text" : "text-subtle group-hover:text-fg")} />
              <span className="flex-1">{item.label}</span>
              {item.href === "/tasks" && openTasks > 0 && (
                <span className="tabular rounded-full bg-surface-3 px-1.5 text-xs text-fg" aria-label={`${openTasks} open`}>
                  {openTasks}
                </span>
              )}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

function ActiveNavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return <NavLinks pathname={pathname} onNavigate={onNavigate} />;
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-3 rounded-lg">
      <span className="grid size-9 place-items-center rounded-[10px] bg-accent text-accent-ink">
        <BrainCircuit aria-hidden className="size-5" />
      </span>
      <span className="leading-tight">
        <span className="block text-[15px] font-semibold tracking-[0.28em] text-accent-text">AIMS</span>
        <span className="block text-xs text-subtle">Internal workspace</span>
      </span>
    </Link>
  );
}

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  return (
    <div className="flex h-full flex-col gap-6 p-4">
      <div className="px-1 pt-1">
        <Brand />
      </div>
      <nav aria-label="Main" className="flex-1">
        {/* usePathname suspends on dynamic routes during prerender; fall back to links without an active state. */}
        <Suspense fallback={<NavLinks pathname={null} onNavigate={onNavigate} />}>
          <ActiveNavLinks onNavigate={onNavigate} />
        </Suspense>
      </nav>
      <div className="space-y-3">
        <p className="rounded-[var(--radius-control)] border border-line px-3 py-2 text-xs leading-relaxed text-subtle">
          Prototype with fictional sample data. Nothing here is saved to a server.
        </p>
        <ProfileMenu onNavigate={onNavigate} />
      </div>
    </div>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  const [drawerOpen, setDrawerOpen] = useState(false);
  const closeDrawer = () => setDrawerOpen(false);

  return (
    <div className="min-h-dvh lg:grid lg:grid-cols-[248px_minmax(0,1fr)]">
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-3 py-2 font-medium text-accent-ink focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      <aside className="sticky top-0 hidden h-dvh border-r border-line bg-surface lg:block">
        <SidebarContent />
      </aside>

      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center justify-between border-b border-line bg-bg/90 px-4 backdrop-blur-md lg:hidden">
          <Brand />
          <button
            type="button"
            onClick={() => setDrawerOpen(true)}
            aria-label="Open navigation"
            className="grid size-11 place-items-center rounded-[var(--radius-control)] text-muted hover:bg-surface-2 hover:text-fg"
          >
            <Menu aria-hidden className="size-6" />
          </button>
        </header>

        <main id="main" className="mx-auto w-full max-w-[1160px] px-4 py-7 sm:px-6 sm:py-9 lg:px-10">
          {children}
        </main>
      </div>

      <Dialog open={drawerOpen} onClose={closeDrawer} title="Navigation" variant="sheet-left">
        <div className="-mx-5 -my-5 h-full sm:-mx-6">
          <SidebarContent onNavigate={closeDrawer} />
        </div>
      </Dialog>
    </div>
  );
}
