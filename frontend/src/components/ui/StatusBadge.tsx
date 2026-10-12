import { CircleCheck, CircleDashed, CircleDot, Clock, Hourglass, Lock, Vote, X } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { ATTENDANCE_LABELS, PROGRESS_LABELS, TASK_STATUS_LABELS } from "@/lib/formatters";
import type { AttendanceStatus, PollStatus, ResourceProgress, ResourceReviewStatus, TaskStatus } from "@/types";

type Tone = "neutral" | "accent" | "success" | "danger" | "info";

const tones: Record<Tone, string> = {
  neutral: "bg-surface-3 text-muted",
  accent: "bg-accent-soft text-accent-text",
  success: "bg-success-soft text-success",
  danger: "bg-danger-soft text-danger",
  info: "bg-info-soft text-info",
};

/** Small status pill. Always pairs colour with an icon and a text label. */
export function Badge({
  tone = "neutral",
  icon,
  children,
  className,
}: {
  tone?: Tone;
  icon?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium whitespace-nowrap [&_svg]:size-3.5",
        tones[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  );
}

export function ProgressBadge({ status }: { status: ResourceProgress }) {
  const config = {
    not_started: { tone: "neutral", icon: <CircleDashed aria-hidden /> },
    in_progress: { tone: "accent", icon: <CircleDot aria-hidden /> },
    completed: { tone: "success", icon: <CircleCheck aria-hidden /> },
  } as const;
  return (
    <Badge tone={config[status].tone} icon={config[status].icon}>
      {PROGRESS_LABELS[status]}
    </Badge>
  );
}

export function TaskStatusBadge({ status }: { status: TaskStatus }) {
  const config = {
    todo: { tone: "neutral", icon: <CircleDashed aria-hidden /> },
    in_progress: { tone: "accent", icon: <CircleDot aria-hidden /> },
    done: { tone: "success", icon: <CircleCheck aria-hidden /> },
  } as const;
  return (
    <Badge tone={config[status].tone} icon={config[status].icon}>
      {TASK_STATUS_LABELS[status]}
    </Badge>
  );
}

export function AttendanceBadge({ status }: { status: AttendanceStatus }) {
  const config = {
    present: { tone: "success", icon: <CircleCheck aria-hidden /> },
    absent: { tone: "danger", icon: <X aria-hidden /> },
    not_marked: { tone: "neutral", icon: <Clock aria-hidden /> },
  } as const;
  return (
    <Badge tone={config[status].tone} icon={config[status].icon}>
      {ATTENDANCE_LABELS[status]}
    </Badge>
  );
}

export function ReviewBadge({ status }: { status: ResourceReviewStatus }) {
  if (status === "published") return null;
  return (
    <Badge tone="info" icon={<Hourglass aria-hidden />}>
      Pending review
    </Badge>
  );
}

export function PollStatusBadge({ status }: { status: PollStatus }) {
  return status === "open" ? (
    <Badge tone="accent" icon={<Vote aria-hidden />}>
      Open
    </Badge>
  ) : (
    <Badge tone="neutral" icon={<Lock aria-hidden />}>
      Closed
    </Badge>
  );
}

export function RestrictedBadge({ children = "Only you and leads" }: { children?: ReactNode }) {
  return (
    <Badge tone="info" icon={<Lock aria-hidden />}>
      {children}
    </Badge>
  );
}
