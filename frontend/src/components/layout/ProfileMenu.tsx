"use client";

import { ChevronDown, LogOut, Moon, PencilLine, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Display";
import { Segmented } from "@/components/ui/Form";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/formatters";
import { useDemo } from "@/state/store";
import { logoutAction } from "@/lib/auth/actions";

const THEME_KEY = "aims-theme";
export type Theme = "dark" | "light";

export function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark");
  }, []);
  const change = (next: Theme) => {
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      window.localStorage.setItem(THEME_KEY, next);
    } catch {
      /* preference simply won't persist */
    }
  };
  return [theme, change] as const;
}

export function ThemeToggle() {
  const [theme, setTheme] = useTheme();
  return (
    <button
      type="button"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
      className="grid size-9 place-items-center rounded-lg text-muted hover:bg-surface-2 hover:text-fg transition-colors cursor-pointer"
    >
      {theme === "dark" ? <Sun className="size-4.5" /> : <Moon className="size-4.5" />}
    </button>
  );
}

export function ProfileMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { role, currentMember } = useDemo();
  const [open, setOpen] = useState(false);
  const [theme, setTheme] = useTheme();
  const containerRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const panelId = useId();

  useEffect(() => {
    if (!open) return;
    const onPointer = (event: PointerEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    onNavigate?.();
  };

  return (
    <div ref={containerRef} className="relative">
      <button
        ref={buttonRef}
        type="button"
        aria-expanded={open}
        aria-controls={panelId}
        onClick={() => setOpen((value) => !value)}
        className="flex items-center gap-2 rounded-lg p-1.5 text-left hover:bg-surface-2 aria-expanded:bg-surface-2 transition-colors focus-visible:outline-2 focus-visible:outline-accent cursor-pointer"
      >
        <Avatar name={currentMember.name} id={currentMember.id} size="sm" />
        <span className="hidden sm:block text-left leading-tight max-w-[140px]">
          <span className="block truncate text-sm font-semibold text-fg">{currentMember.name}</span>
          <span className="block truncate text-[11px] text-muted">{ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown aria-hidden className={cn("size-3.5 text-subtle transition-transform duration-200", open && "rotate-180")} />
        <span className="sr-only">Open account menu</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 top-full mt-2 w-64 z-50 rounded-[var(--radius-card)] border border-line-strong bg-surface-2 p-2 shadow-[var(--shadow-pop)] animate-in fade-in-0 zoom-in-95"
        >
          {/* User info */}
          <div className="px-3 py-2 border-b border-line">
            <p className="truncate text-sm font-semibold text-fg">{currentMember.name}</p>
            <p className="truncate text-xs text-muted">{currentMember.email}</p>
            <div className="mt-2 flex items-center gap-1.5">
              <span className="inline-flex items-center rounded-full bg-accent-soft px-2 py-0.5 text-[11px] font-medium text-accent-text border border-accent/20">
                {ROLE_LABELS[role]}
              </span>
              {currentMember.department && (
                <span className="text-[11px] text-subtle truncate">· {currentMember.department}</span>
              )}
            </div>
          </div>

          {/* Navigation links */}
          <nav aria-label="Profile navigation" className="py-1">
            <Link
              href="/profile"
              onClick={close}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-fg hover:bg-surface-3 transition-colors"
            >
              <UserRound aria-hidden className="size-4 text-subtle" />
              <span>View profile</span>
            </Link>
            <Link
              href="/profile?edit=1"
              onClick={close}
              className="flex items-center gap-2.5 rounded-md px-3 py-2 text-sm text-fg hover:bg-surface-3 transition-colors"
            >
              <PencilLine aria-hidden className="size-4 text-subtle" />
              <span>Edit profile</span>
            </Link>
          </nav>

          {/* Theme switcher */}
          <div className="flex items-center justify-between gap-2 border-t border-line px-3 py-2">
            <span className="text-xs font-medium text-muted">Theme</span>
            <Segmented<Theme>
              label="Theme"
              size="sm"
              value={theme}
              onChange={setTheme}
              options={[
                { value: "dark", label: "Dark", icon: <Moon aria-hidden /> },
                { value: "light", label: "Light", icon: <Sun aria-hidden /> },
              ]}
            />
          </div>

          {/* Sign out */}
          <div className="border-t border-line pt-1">
            <button
              type="button"
              onClick={async () => {
                close();
                await logoutAction();
              }}
              className="flex w-full items-center gap-2.5 rounded-md px-3 py-2 text-left text-sm text-[var(--danger)] hover:bg-[var(--danger-soft)] transition-colors cursor-pointer"
            >
              <LogOut aria-hidden className="size-4 text-[var(--danger)]" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
