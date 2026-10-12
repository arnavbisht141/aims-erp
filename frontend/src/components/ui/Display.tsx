import { ArrowLeft, ArrowRight, type LucideIcon } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { initials } from "@/lib/formatters";

const AVATAR_TINTS = [
  "bg-[#5a3a1c] text-[#ffd9a8]",
  "bg-[#3d3a1d] text-[#efe3a2]",
  "bg-[#24402f] text-[#bfe7c9]",
  "bg-[#253a4c] text-[#c4dcf5]",
  "bg-[#43283a] text-[#f2c6de]",
  "bg-[#4a2a22] text-[#f6c3b3]",
];

function tintFor(seed: string) {
  let hash = 0;
  for (const char of seed) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  return AVATAR_TINTS[hash % AVATAR_TINTS.length];
}

export function Avatar({ name, id, size = "md" }: { name: string; id: string; size?: "sm" | "md" | "lg" | "xl" }) {
  const sizes = { sm: "size-7 text-[11px]", md: "size-9 text-[13px]", lg: "size-12 text-base", xl: "size-20 text-2xl" };
  return (
    <span
      aria-hidden
      className={cn("inline-grid shrink-0 place-items-center rounded-full font-semibold tracking-wide", sizes[size], tintFor(id))}
    >
      {initials(name)}
    </span>
  );
}

export function PageHeader({
  title,
  description,
  actions,
  back,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  back?: ReactNode;
}) {
  return (
    <header className="mb-7 flex flex-col gap-4 sm:mb-8 md:flex-row md:items-end md:justify-between">
      <div className="min-w-0">
        {back}
        <h1 className="text-[28px] leading-tight font-semibold sm:text-[34px]">{title}</h1>
        {description && <p className="mt-1.5 max-w-[65ch] text-[15px] text-muted">{description}</p>}
      </div>
      {actions && <div className="flex shrink-0 flex-wrap gap-2">{actions}</div>}
    </header>
  );
}

/** A titled region of a page. Plain surface with a hairline border, not a floating card. */
export function Panel({
  title,
  action,
  children,
  className,
  headingLevel = 2,
  id,
}: {
  title?: ReactNode;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
  headingLevel?: 2 | 3;
  id?: string;
}) {
  const Heading = headingLevel === 2 ? "h2" : "h3";
  return (
    <section aria-labelledby={title && id ? id : undefined} className={cn("rounded-[var(--radius-card)] border border-line bg-surface", className)}>
      {title && (
        <div className="flex items-center justify-between gap-3 px-5 pt-4 pb-1">
          <Heading id={id} className="text-base font-semibold">
            {title}
          </Heading>
          {action}
        </div>
      )}
      <div className="px-5 pt-2 pb-5">{children}</div>
    </section>
  );
}

export function PanelLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link
      href={href}
      className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-accent-text hover:underline"
    >
      {children}
      <ArrowRight aria-hidden className="size-3.5" />
    </Link>
  );
}

export function StatCard({
  label,
  value,
  detail,
  href,
  icon: Icon,
}: {
  label: string;
  value: ReactNode;
  detail?: ReactNode;
  href?: string;
  icon?: LucideIcon;
}) {
  const body = (
    <>
      <div className="flex items-center justify-between gap-2 text-sm text-muted">
        <span>{label}</span>
        {Icon && <Icon aria-hidden className="size-4 text-subtle" />}
      </div>
      <div className="tabular mt-2 text-[28px] leading-none font-semibold tracking-tight">{value}</div>
      {detail && <div className="mt-2 text-sm text-muted">{detail}</div>}
    </>
  );
  const classes = "block rounded-[var(--radius-card)] border border-line bg-surface p-4";
  return href ? (
    <Link href={href} className={cn(classes, "transition-colors hover:border-line-strong hover:bg-surface-2")}>
      {body}
    </Link>
  ) : (
    <div className={classes}>{body}</div>
  );
}

/** Bar plus a text value, so the number never depends on colour alone. */
export function ProgressBar({ percent, label, className }: { percent: number; label: string; className?: string }) {
  return (
    <div className={cn("flex items-center gap-3", className)}>
      <div
        role="progressbar"
        aria-label={label}
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3"
      >
        <div className="h-full rounded-full bg-accent transition-[width] duration-500 ease-out" style={{ width: `${percent}%` }} />
      </div>
      <span className="tabular w-10 text-right text-sm font-medium">{percent}%</span>
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  children,
  action,
  compact,
}: {
  icon: LucideIcon;
  title: string;
  children?: ReactNode;
  action?: ReactNode;
  compact?: boolean;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center rounded-[var(--radius-card)] border border-dashed border-line-strong text-center",
        compact ? "px-4 py-6" : "px-6 py-12",
      )}
    >
      <Icon aria-hidden className={cn("text-subtle", compact ? "size-6" : "size-8")} />
      <p className={cn("font-semibold", compact ? "mt-2 text-[15px]" : "mt-3 text-lg")}>{title}</p>
      {children && <div className="mt-1 max-w-[46ch] text-sm text-muted">{children}</div>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

export function BackLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <Link href={href} className="mb-3 inline-flex min-h-8 items-center gap-1.5 rounded-md text-sm font-medium text-muted hover:text-fg">
      <ArrowLeft aria-hidden className="size-4" />
      {children}
    </Link>
  );
}
