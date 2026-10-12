"use client";

import { ChevronDown, Moon, PencilLine, RotateCcw, Sun, UserRound } from "lucide-react";
import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { Avatar } from "@/components/ui/Display";
import { ConfirmDialog } from "@/components/ui/Dialog";
import { Segmented } from "@/components/ui/Form";
import { useToast } from "@/components/ui/Toast";
import { DEFAULT_DEMO_ROLE, DEMO_PERSONAS } from "@/data/seed";
import { cn } from "@/lib/cn";
import { ROLE_LABELS } from "@/lib/formatters";
import { getMember } from "@/lib/selectors";
import { useDemo } from "@/state/store";
import type { UserRole } from "@/types";

const ROLES: UserRole[] = ["member", "junior", "senior", "admin"];
const THEME_KEY = "aims-theme";

type Theme = "dark" | "light";

function useTheme() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => {
    // The inline script in the root layout has already applied the saved theme.
    // eslint-disable-next-line react-hooks/set-state-in-effect
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

export function DemoRoleSwitcher({ onSwitched }: { onSwitched?: () => void }) {
  const { role, data, actions } = useDemo();
  const toast = useToast();
  const groupName = useId();

  const switchTo = (next: UserRole) => {
    if (next === role) return;
    actions.setRole(next);
    const persona = getMember(data, DEMO_PERSONAS[next]);
    toast(`Now viewing the demo as ${persona?.name ?? "a sample user"} (${ROLE_LABELS[next]}).`, { tone: "info" });
    onSwitched?.();
  };

  return (
    <fieldset>
      <legend className="flex w-full items-center justify-between text-xs font-semibold text-muted">
        Demo role
        <span className="rounded bg-info-soft px-1.5 py-px text-[11px] font-medium text-info">Prototype only</span>
      </legend>
      <div className="mt-2 grid gap-1">
        {ROLES.map((option) => {
          const persona = getMember(data, DEMO_PERSONAS[option]);
          const checked = option === role;
          return (
            <label
              key={option}
              className={cn(
                "flex cursor-pointer items-center gap-2.5 rounded-lg px-2 py-1.5 has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent",
                checked ? "bg-accent-soft" : "hover:bg-surface-3",
              )}
            >
              <input
                type="radio"
                name={groupName}
                value={option}
                checked={checked}
                onChange={() => switchTo(option)}
                className="size-4 accent-[var(--accent)]"
              />
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-medium">
                  {ROLE_LABELS[option]}
                  {option === DEFAULT_DEMO_ROLE && <span className="font-normal text-subtle"> (default)</span>}
                </span>
                <span className="block truncate text-xs text-muted">as {persona?.name}</span>
              </span>
            </label>
          );
        })}
      </div>
      {role !== DEFAULT_DEMO_ROLE && (
        <button
          type="button"
          onClick={() => switchTo(DEFAULT_DEMO_ROLE)}
          className="mt-1.5 w-full rounded-lg px-2 py-1.5 text-left text-sm font-medium text-accent-text hover:bg-surface-3"
        >
          Back to the default role ({ROLE_LABELS[DEFAULT_DEMO_ROLE]})
        </button>
      )}
      <p className="mt-2 px-1 text-xs leading-relaxed text-subtle">
        Switching role changes what the prototype shows. It is not a sign-in and offers no real security.
      </p>
    </fieldset>
  );
}

export function ProfileMenu({ onNavigate }: { onNavigate?: () => void }) {
  const { role, currentMember, actions } = useDemo();
  const toast = useToast();
  const [open, setOpen] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
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
        className="flex w-full items-center gap-3 rounded-[var(--radius-control)] p-2 text-left hover:bg-surface-2 aria-expanded:bg-surface-2"
      >
        <Avatar name={currentMember.name} id={currentMember.id} />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold">{currentMember.name}</span>
          <span className="block truncate text-xs text-muted">Demo role: {ROLE_LABELS[role]}</span>
        </span>
        <ChevronDown aria-hidden className={cn("size-4 text-subtle transition-transform", open && "rotate-180")} />
        <span className="sr-only">Open profile and demo menu</span>
      </button>

      {open && (
        <div
          id={panelId}
          className="absolute right-0 bottom-full left-0 z-40 mb-2 max-h-[calc(100dvh-120px)] overflow-y-auto rounded-[var(--radius-card)] border border-line-strong bg-surface-2 p-2 shadow-[var(--shadow-pop)]"
        >
          <div className="px-2 pt-1 pb-2">
            <p className="text-xs text-subtle">Sample account</p>
            <p className="truncate text-sm text-muted">{currentMember.email}</p>
          </div>
          <nav aria-label="Profile" className="grid gap-0.5 border-b border-line pb-2">
            <Link href="/profile" onClick={close} className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-surface-3">
              <UserRound aria-hidden className="size-4 text-subtle" />
              View profile
            </Link>
            <Link
              href="/profile?edit=1"
              onClick={close}
              className="flex items-center gap-2.5 rounded-lg px-2 py-2 text-sm hover:bg-surface-3"
            >
              <PencilLine aria-hidden className="size-4 text-subtle" />
              Edit profile
            </Link>
          </nav>
          <div className="border-b border-line px-1 py-3">
            <DemoRoleSwitcher onSwitched={() => setOpen(false)} />
          </div>
          <div className="flex items-center justify-between gap-2 border-b border-line px-2 py-3">
            <span className="text-xs font-semibold text-muted">Theme</span>
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
          <button
            type="button"
            onClick={() => setConfirmReset(true)}
            className="mt-1 flex w-full items-center gap-2.5 rounded-lg px-2 py-2 text-left text-sm hover:bg-surface-3"
          >
            <RotateCcw aria-hidden className="size-4 text-subtle" />
            Reset demo data
          </button>
        </div>
      )}

      <ConfirmDialog
        open={confirmReset}
        title="Reset demo data?"
        confirmLabel="Reset demo data"
        tone="danger"
        description={
          <>
            <p>
              This restores the original sample records and switches back to the {ROLE_LABELS[DEFAULT_DEMO_ROLE]} demo
              role. Anything you added or changed in this prototype session will be discarded.
            </p>
            <p className="mt-2 text-sm text-subtle">It only affects prototype data in this browser tab. No real accounts exist.</p>
          </>
        }
        onCancel={() => setConfirmReset(false)}
        onConfirm={() => {
          actions.reset();
          setConfirmReset(false);
          setOpen(false);
          toast("Demo data reset to the original sample records.");
        }}
      />
    </div>
  );
}
