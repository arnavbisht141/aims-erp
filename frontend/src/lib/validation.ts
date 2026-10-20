import type { AttendanceStatus, ResourceType, UserRole } from "@/types";

export type FieldErrors<K extends string> = Partial<Record<K, string>>;

export function isBlank(value: string | undefined | null): boolean {
  return !value || value.trim().length === 0;
}

export function isValidUrl(value: string): boolean {
  try {
    const url = new URL(value.trim());
    return (url.protocol === "http:" || url.protocol === "https:") && url.hostname.includes(".");
  } catch {
    return false;
  }
}

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function hasErrors(errors: Record<string, string | undefined>): boolean {
  return Object.values(errors).some(Boolean);
}

/** Splits a comma-separated list, trimming and dropping empty or duplicate entries. */
export function parseList(value: string): string[] {
  const seen = new Set<string>();
  return value
    .split(",")
    .map((item) => item.trim())
    .filter((item) => {
      const key = item.toLowerCase();
      if (!item || seen.has(key)) return false;
      seen.add(key);
      return true;
    });
}

export interface ResourceInput {
  title: string;
  url: string;
  type: ResourceType | "";
  category: string;
  description: string;
  note: string;
}

export function validateResource(input: ResourceInput): FieldErrors<keyof ResourceInput> {
  const errors: FieldErrors<keyof ResourceInput> = {};
  if (isBlank(input.title)) errors.title = "Enter a title.";
  if (isBlank(input.url)) errors.url = "Enter the link to the resource.";
  else if (!isValidUrl(input.url)) errors.url = "Enter a full web address starting with https://";
  if (!input.type) errors.type = "Choose a type.";
  if (isBlank(input.category)) errors.category = "Choose a topic.";
  return errors;
}

export interface ProfileInput {
  name: string;
  bio: string;
  skills: string;
  interests: string;
  profiles: { label: string; url: string }[];
}

export type ProfileErrors = FieldErrors<"name" | "bio" | "skills"> & {
  profiles?: Record<number, string>;
};

export function validateProfile(input: ProfileInput): ProfileErrors {
  const errors: ProfileErrors = {};
  if (isBlank(input.name)) errors.name = "Enter your display name.";
  if (isBlank(input.bio)) errors.bio = "Add a short bio so others know what you work on.";
  if (parseList(input.skills).length === 0) errors.skills = "Add at least one skill.";
  const profileErrors: Record<number, string> = {};
  input.profiles.forEach((profile, index) => {
    const hasLabel = !isBlank(profile.label);
    const hasUrl = !isBlank(profile.url);
    if (!hasLabel && !hasUrl) return;
    if (!hasLabel) profileErrors[index] = "Add a label, such as GitHub.";
    else if (!hasUrl) profileErrors[index] = "Add the profile link.";
    else if (!isValidUrl(profile.url)) profileErrors[index] = "Enter a full web address starting with https://";
  });
  if (Object.keys(profileErrors).length > 0) errors.profiles = profileErrors;
  return errors;
}

export function profileHasErrors(errors: ProfileErrors): boolean {
  return Boolean(errors.name || errors.bio || errors.skills || errors.profiles);
}

export interface PollInput {
  question: string;
  description: string;
  options: string[];
}

export function validatePoll(input: PollInput): FieldErrors<"question" | "options"> {
  const errors: FieldErrors<"question" | "options"> = {};
  if (isBlank(input.question)) errors.question = "Enter the question people will answer.";
  const filled = input.options.map((option) => option.trim()).filter(Boolean);
  if (filled.length < 2) errors.options = "Add at least two options.";
  else if (new Set(filled.map((option) => option.toLowerCase())).size !== filled.length)
    errors.options = "Each option needs to be different.";
  return errors;
}

export interface TaskInput {
  title: string;
  assigneeId: string;
}

export function validateTask(input: TaskInput): FieldErrors<"title" | "assigneeId"> {
  const errors: FieldErrors<"title" | "assigneeId"> = {};
  if (isBlank(input.title)) errors.title = "Enter a task title.";
  if (isBlank(input.assigneeId)) errors.assigneeId = "Choose who the task is for.";
  return errors;
}

export function validateComment(text: string): string | undefined {
  return isBlank(text) ? "Write a comment before posting." : undefined;
}

const ATTENDANCE_STATUSES: AttendanceStatus[] = ["present", "absent", "not_marked"];

export function isAttendanceStatus(value: string): value is AttendanceStatus {
  return (ATTENDANCE_STATUSES as string[]).includes(value);
}

const ROLES: UserRole[] = ["member", "junior", "senior", "admin", "attendance_manager"];

export function isUserRole(value: unknown): value is UserRole {
  return typeof value === "string" && (ROLES as string[]).includes(value);
}

export function validateInvite(input: { email: string; role: string }): FieldErrors<"email" | "role"> {
  const errors: FieldErrors<"email" | "role"> = {};
  if (isBlank(input.email)) errors.email = "Enter an email address.";
  else if (!isValidEmail(input.email)) errors.email = "Enter a valid email address, such as name@example.com.";
  if (!isUserRole(input.role)) errors.role = "Choose a role.";
  return errors;
}
