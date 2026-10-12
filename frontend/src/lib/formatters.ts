import type {
  AttendanceStatus,
  MembershipStatus,
  PollResultsVisibility,
  ResourceProgress,
  ResourceType,
  TaskStatus,
  UserRole,
} from "@/types";

// Fixed locale and time zone keep server and client renders identical.
const dateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "Asia/Kolkata",
});

const shortDateFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  timeZone: "Asia/Kolkata",
});

const dateTimeFormat = new Intl.DateTimeFormat("en-GB", {
  day: "numeric",
  month: "short",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
  timeZone: "Asia/Kolkata",
});

export function formatDate(value: string): string {
  return dateFormat.format(new Date(value));
}

export function formatShortDate(value: string): string {
  return shortDateFormat.format(new Date(value));
}

export function formatDateTime(value: string): string {
  return dateTimeFormat.format(new Date(value));
}

export function initials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  const first = parts[0][0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] ?? "" : "";
  return (first + last).toUpperCase();
}

export function firstName(name: string): string {
  return name.trim().split(/\s+/)[0] ?? name;
}

export function pluralise(count: number, singular: string, plural = `${singular}s`): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  member: "Member",
  junior: "Junior",
  senior: "Senior lead",
  admin: "Administrator",
};

export const MEMBERSHIP_LABELS: Record<MembershipStatus, string> = {
  active: "Active",
  alumni: "Alumni",
  inactive: "Inactive",
};

export const RESOURCE_TYPE_LABELS: Record<ResourceType, string> = {
  blog: "Blog",
  paper: "Research paper",
  video: "Video",
  course: "Course",
  documentation: "Documentation",
  competition: "Competition",
  opportunity: "Opportunity",
  other: "Other",
};

export const PROGRESS_LABELS: Record<ResourceProgress, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  completed: "Completed",
};

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const ATTENDANCE_LABELS: Record<AttendanceStatus, string> = {
  present: "Present",
  absent: "Absent",
  not_marked: "Not marked",
};

export const VISIBILITY_LABELS: Record<PollResultsVisibility, string> = {
  after_vote: "After voting",
  always: "Always",
  after_close: "After the poll closes",
};
