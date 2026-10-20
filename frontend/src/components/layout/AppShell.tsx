"use client";

import {
  BookOpen,
  BrainCircuit,
  House,
  ListChecks,
  LogOut,
  Menu,
  ShieldCheck,
  UserRound,
  Users,
  Vote,
  X,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState, type ReactNode } from "react";
import { Dialog } from "@/components/ui/Dialog";
import { Avatar } from "@/components/ui/Display";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/formatters";
import { canAccessAdministration } from "@/lib/permissions";
import { openTasksForMember } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import { logoutAction } from "@/lib/auth/actions";
import { ProfileMenu, ThemeToggle } from "./ProfileMenu";

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

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(`${href}/`);
}

function Brand() {
  return (
    <Link
      href="/"
      className="group flex items-center gap-3 rounded-lg focus-visible:outline-2 focus-visible:outline-accent"
    >
      <div className="grid size-9 place-items-center rounded-xl bg-accent text-accent-ink shadow-sm transition-transform duration-200 group-hover:scale-105">
        <BrainCircuit aria-hidden className="size-5" />
      </div>
      <div className="leading-tight">
        <div className="flex items-center gap-2">
          <span className="text-[16px] font-bold tracking-[0.22em] text-accent-text">AIMS</span>
          <span className="rounded border border-line bg-surface-3 px-1.5 py-0.5 text-[10px] font-semibold tracking-wider text-subtle uppercase">
            DTU
          </span>
        </div>
        <span className="block text-[11px] font-medium text-muted">Internal Workspace</span>
      </div>
    </Link>
  );
}

function DesktopNav({ pathname }: { pathname: string | null }) {
  const { role, data, currentMember } = useDemo();
  const openTasks = openTasksForMember(data, currentMember.id).length;
  const items = [...NAV, ...(canAccessAdministration(role) ? [ADMIN_ITEM] : [])];

  return (
    <nav className="hidden items-center gap-1 md:flex" aria-label="Main Navigation">
      {items.map((item) => {
        const active = isActive(pathname, item.href);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={active ? "page" : undefined}
            className={cn(
              "group relative flex items-center gap-2 rounded-lg px-3.5 py-2 text-sm font-medium transition-all duration-150",
              active
                ? "bg-accent-soft font-semibold text-accent-text shadow-xs"
                : "text-muted hover:bg-surface-2 hover:text-fg",
            )}
          >
            <Icon
              aria-hidden
              className={cn("size-4 transition-colors", active ? "text-accent-text" : "text-subtle group-hover:text-fg")}
            />
            <span>{item.label}</span>
            {item.href === "/tasks" && openTasks > 0 && (
              <span
                className="tabular rounded-full bg-accent px-1.5 py-0.2 text-[11px] font-bold text-accent-ink"
                aria-label={`${openTasks} open tasks`}
              >
                {openTasks}
              </span>
            )}
          </Link>
        );
      })}
    </nav>
  );
}

function ActiveDesktopNav() {
  const pathname = usePathname();
  return <DesktopNav pathname={pathname} />;
}

function MobileNavDrawer({
  open,
  onClose,
  pathname,
}: {
  open: boolean;
  onClose: () => void;
  pathname: string | null;
}) {
  const { role, data, currentMember } = useDemo();
  const openTasks = openTasksForMember(data, currentMember.id).length;
  const items = [
    ...NAV,
    ...(canAccessAdministration(role) ? [ADMIN_ITEM] : []),
    { href: "/profile", label: "My Profile", icon: UserRound },
  ];

  return (
    <Dialog open={open} onClose={onClose} title="Menu" variant="sheet-left">
      <div className="-mx-5 -my-5 flex h-full flex-col justify-between sm:-mx-6">
        <div>
          {/* Authenticated user header card */}
          <div className="border-b border-line bg-surface-2 p-4">
            <div className="flex items-center gap-3">
              <Avatar name={currentMember.name} id={currentMember.id} size="md" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-bold text-fg">{currentMember.name}</p>
                <p className="truncate text-xs text-muted">{currentMember.email}</p>
                <div className="mt-1 flex items-center gap-1.5">
                  <span className="inline-flex items-center rounded-full border border-accent/20 bg-accent-soft px-2 py-0.5 text-[11px] font-semibold text-accent-text">
                    {ROLE_LABELS[role]}
                  </span>
                  {currentMember.department && (
                    <span className="truncate text-[11px] text-subtle">· {currentMember.department}</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Navigation Links */}
          <nav aria-label="Mobile Navigation" className="p-3">
            <ul className="grid gap-1">
              {items.map((item) => {
                const active = isActive(pathname, item.href);
                const Icon = item.icon;
                return (
                  <li key={item.href}>
                    <Link
                      href={item.href}
                      onClick={onClose}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex min-h-11 items-center gap-3 rounded-lg px-3.5 text-[15px] font-medium transition-colors",
                        active ? "bg-accent-soft text-accent-text" : "text-muted hover:bg-surface-2 hover:text-fg",
                      )}
                    >
                      <Icon
                        aria-hidden
                        className={cn("size-5", active ? "text-accent-text" : "text-subtle group-hover:text-fg")}
                      />
                      <span className="flex-1">{item.label}</span>
                      {item.href === "/tasks" && openTasks > 0 && (
                        <span
                          className="tabular rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-accent-ink"
                          aria-label={`${openTasks} open`}
                        >
                          {openTasks}
                        </span>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Bottom Drawer Actions */}
        <div className="border-t border-line bg-surface p-4 space-y-3">
          <div className="flex items-center justify-between px-1">
            <span className="text-sm font-medium text-muted">Theme</span>
            <ThemeToggle />
          </div>

          <button
            type="button"
            onClick={async () => {
              onClose();
              await logoutAction();
            }}
            className="flex min-h-10 w-full items-center justify-center gap-2 rounded-lg bg-[var(--danger-soft)] px-3 py-2 text-sm font-semibold text-[var(--danger)] transition-colors hover:bg-[var(--danger)] hover:text-white cursor-pointer"
          >
            <LogOut aria-hidden className="size-4" />
            <span>Sign out</span>
          </button>
        </div>
      </div>
    </Dialog>
  );
}

function ActiveMobileNavDrawer({ open, onClose }: { open: boolean; onClose: () => void }) {
  const pathname = usePathname();
  return <MobileNavDrawer open={open} onClose={onClose} pathname={pathname} />;
}

export function AppShell({ children }: { children: ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const closeMobileMenu = () => setMobileMenuOpen(false);

  return (
    <div className="relative isolate min-h-dvh flex flex-col bg-bg text-fg">
      {/* Static ambient glow behind every page */}
      <div className="ambient" aria-hidden>
        <span className="ambient-a" />
        <span className="ambient-b" />
      </div>
      {/* Keyboard Accessibility: Skip to Content */}
      <a
        href="#main"
        className="sr-only z-50 rounded-md bg-accent px-4 py-2 text-sm font-medium text-accent-ink shadow-lg focus:not-sr-only focus:fixed focus:top-3 focus:left-3"
      >
        Skip to content
      </a>

      {/* Production Top Navbar */}
      <header className="sticky top-0 z-40 w-full border-b border-line bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          {/* Left: Brand */}
          <div className="flex items-center gap-6">
            <Brand />
          </div>

          {/* Center: Desktop Navigation */}
          <Suspense fallback={<DesktopNav pathname={null} />}>
            <ActiveDesktopNav />
          </Suspense>

          {/* Right: Actions & User Profile */}
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden sm:block">
              <ThemeToggle />
            </div>

            <ProfileMenu onNavigate={closeMobileMenu} />

            {/* Mobile Hamburger Toggle */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open mobile navigation"
              className="grid size-10 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg md:hidden cursor-pointer"
            >
              <Menu aria-hidden className="size-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Drawer Sheet */}
      <Suspense fallback={<MobileNavDrawer open={mobileMenuOpen} onClose={closeMobileMenu} pathname={null} />}>
        <ActiveMobileNavDrawer open={mobileMenuOpen} onClose={closeMobileMenu} />
      </Suspense>

      {/* Main Content Workspace */}
      <main id="main" className="flex-1 mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 sm:py-8 lg:px-8">
        {children}
      </main>
    </div>
  );
}
