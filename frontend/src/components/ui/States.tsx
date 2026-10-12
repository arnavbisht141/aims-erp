"use client";

import { FileQuestion, LockKeyhole } from "lucide-react";
import type { ReactNode } from "react";
import { ROLE_LABELS } from "@/lib/formatters";
import { useDemo } from "@/state/store";
import type { UserRole } from "@/types";
import { ButtonLink } from "./Button";

export function PageLoading() {
  return (
    <div aria-busy="true" aria-live="polite" className="animate-pulse space-y-4 motion-reduce:animate-none">
      <span className="sr-only">Loading</span>
      <div className="h-9 w-56 rounded-lg bg-surface-2" />
      <div className="h-4 w-80 max-w-full rounded bg-surface-2" />
      <div className="grid gap-4 pt-4 sm:grid-cols-2">
        <div className="h-36 rounded-[var(--radius-card)] bg-surface" />
        <div className="h-36 rounded-[var(--radius-card)] bg-surface" />
      </div>
    </div>
  );
}

function StateScreen({ icon, title, children, action }: { icon: ReactNode; title: string; children: ReactNode; action: ReactNode }) {
  return (
    <div className="mx-auto flex max-w-lg flex-col items-center py-16 text-center sm:py-24">
      <div className="grid size-14 place-items-center rounded-2xl bg-surface-2 text-accent-text [&_svg]:size-7">{icon}</div>
      <h1 className="mt-5 text-2xl font-semibold">{title}</h1>
      <div className="mt-2 text-[15px] text-muted">{children}</div>
      <div className="mt-6 flex flex-wrap justify-center gap-2">{action}</div>
    </div>
  );
}

export function AccessRestricted({ area, allowed }: { area: string; allowed: UserRole[] }) {
  const { role } = useDemo();
  const allowedLabels = allowed.map((r) => ROLE_LABELS[r]).join(" or ");
  return (
    <StateScreen
      icon={<LockKeyhole aria-hidden />}
      title={`${area} is restricted`}
      action={<ButtonLink href="/" variant="primary">Go to Home</ButtonLink>}
    >
      <p>
        You are using the <strong className="font-semibold text-fg">{ROLE_LABELS[role]}</strong> demo role. This area is
        available to the {allowedLabels} role.
      </p>
      <p className="mt-2 text-sm text-subtle">
        To explore it, switch demo role from the profile menu. In this prototype the check happens in the browser
        only; it is not real access control.
      </p>
    </StateScreen>
  );
}

export function NotFoundState({ thing, backHref, backLabel }: { thing: string; backHref: string; backLabel: string }) {
  return (
    <StateScreen
      icon={<FileQuestion aria-hidden />}
      title={`${thing} not found`}
      action={<ButtonLink href={backHref} variant="primary">{backLabel}</ButtonLink>}
    >
      <p>
        The link may be out of date, or the item was removed. Demo data resets when you choose “Reset demo data” or
        close the tab, so items created earlier may no longer exist.
      </p>
    </StateScreen>
  );
}

/** Page-level role check: the nav hides restricted links, and this guards direct visits. */
export function RoleGate({
  allow,
  area,
  allowed,
  children,
}: {
  allow: (role: UserRole) => boolean;
  area: string;
  allowed: UserRole[];
  children: ReactNode;
}) {
  const { role, ready } = useDemo();
  if (!ready) return <PageLoading />;
  if (!allow(role)) return <AccessRestricted area={area} allowed={allowed} />;
  return <>{children}</>;
}
