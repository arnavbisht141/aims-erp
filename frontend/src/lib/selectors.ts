import type {
  AttendanceRecord,
  AttendanceStatus,
  Comment,
  CommentParentType,
  DemoData,
  Member,
  Poll,
  Resource,
  ResourceAssignment,
  ResourceProgress,
  ResourceType,
  Task,
  TaskStatus,
  UserRole,
} from "@/types";
import { canSeeResource, canViewTask } from "./permissions";

/* ---------- Members ---------- */

export function getMember(data: DemoData, id: string): Member | undefined {
  return data.members.find((member) => member.id === id);
}

export function memberName(data: DemoData, id: string): string {
  return getMember(data, id)?.name ?? "Former member";
}

export function activeJuniors(data: DemoData): Member[] {
  return data.members.filter((member) => member.role === "junior" && member.membershipStatus === "active");
}

/** Members who can receive assignments or tasks in the demo. */
export function assignableMembers(data: DemoData): Member[] {
  return data.members.filter((member) => member.membershipStatus === "active");
}

export interface MemberFilters {
  query: string;
  year: string;
  department: string;
}

export function filterMembers(members: Member[], { query, year, department }: MemberFilters): Member[] {
  const needle = query.trim().toLowerCase();
  return members.filter((member) => {
    if (year && member.yearLabel !== year) return false;
    if (department && member.department !== department) return false;
    if (!needle) return true;
    const haystack = [member.name, member.department ?? "", ...member.skills, ...member.interests]
      .join(" ")
      .toLowerCase();
    return haystack.includes(needle);
  });
}

export function distinctValues(values: (string | undefined)[]): string[] {
  return Array.from(new Set(values.filter((value): value is string => Boolean(value)))).sort();
}

export function membershipSummary(data: DemoData) {
  const byRole: Record<UserRole, number> = { member: 0, junior: 0, senior: 0, admin: 0 };
  let active = 0;
  let alumni = 0;
  for (const member of data.members) {
    if (member.membershipStatus === "active") {
      active += 1;
      byRole[member.role] += 1;
    }
    if (member.membershipStatus === "alumni") alumni += 1;
  }
  const pendingInvites = data.invitations.filter((invite) => invite.status === "pending").length;
  return { total: data.members.length, active, alumni, byRole, pendingInvites };
}

/* ---------- Resources ---------- */

export function getResource(data: DemoData, id: string): Resource | undefined {
  return data.resources.find((resource) => resource.id === id);
}

/** Resources the current demo user may see, newest first. */
export function visibleResources(data: DemoData, role: UserRole, memberId: string): Resource[] {
  return data.resources
    .filter((resource) => canSeeResource(role, memberId, resource))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

export function getAssignment(
  data: DemoData,
  resourceId: string,
  memberId: string,
): ResourceAssignment | undefined {
  return data.assignments.find((a) => a.resourceId === resourceId && a.memberId === memberId);
}

export function assignmentsForResource(data: DemoData, resourceId: string): ResourceAssignment[] {
  return data.assignments.filter((a) => a.resourceId === resourceId);
}

export function assignedResourcesForMember(data: DemoData, memberId: string) {
  return data.assignments
    .filter((assignment) => assignment.memberId === memberId)
    .map((assignment) => ({ assignment, resource: getResource(data, assignment.resourceId) }))
    .filter((entry): entry is { assignment: ResourceAssignment; resource: Resource } => Boolean(entry.resource))
    .sort((a, b) => b.assignment.assignedAt.localeCompare(a.assignment.assignedAt));
}

export interface ResourceFilters {
  query: string;
  type: ResourceType | "";
  category: string;
  assignedToMe: boolean;
}

export function filterResources(
  resources: Resource[],
  filters: ResourceFilters,
  assignments: ResourceAssignment[],
  memberId: string,
): Resource[] {
  const needle = filters.query.trim().toLowerCase();
  const assignedIds = new Set(assignments.filter((a) => a.memberId === memberId).map((a) => a.resourceId));
  return resources.filter((resource) => {
    if (filters.type && resource.type !== filters.type) return false;
    if (filters.category && resource.category !== filters.category) return false;
    if (filters.assignedToMe && !assignedIds.has(resource.id)) return false;
    if (!needle) return true;
    return [resource.title, resource.description, resource.category].join(" ").toLowerCase().includes(needle);
  });
}

/* ---------- Progress ---------- */

export interface ProgressCounts {
  total: number;
  not_started: number;
  in_progress: number;
  completed: number;
  /** Whole-number completion percentage; 0 when nothing is assigned. */
  percent: number;
}

export function countProgress(statuses: ResourceProgress[]): ProgressCounts {
  const counts: ProgressCounts = { total: statuses.length, not_started: 0, in_progress: 0, completed: 0, percent: 0 };
  for (const status of statuses) counts[status] += 1;
  counts.percent = counts.total === 0 ? 0 : Math.round((counts.completed / counts.total) * 100);
  return counts;
}

export interface LearningEntry {
  /** "resource" entries come from library assignments; "item" entries are standalone learning items. */
  kind: "resource" | "item";
  id: string;
  title: string;
  status: ResourceProgress;
  dueDate?: string;
  resourceId?: string;
}

/** Everything a person is working through: assigned resources plus learning items. */
export function learningEntriesForMember(data: DemoData, memberId: string): LearningEntry[] {
  const fromResources: LearningEntry[] = assignedResourcesForMember(data, memberId).map(({ assignment, resource }) => ({
    kind: "resource",
    id: assignment.id,
    title: resource.title,
    status: assignment.status,
    resourceId: resource.id,
  }));
  const fromItems: LearningEntry[] = data.progressItems
    .filter((item) => item.memberId === memberId)
    .map((item) => ({ kind: "item", id: item.id, title: item.title, status: item.status, dueDate: item.dueDate }));
  return [...fromResources, ...fromItems];
}

export function progressForMember(data: DemoData, memberId: string): ProgressCounts {
  return countProgress(learningEntriesForMember(data, memberId).map((entry) => entry.status));
}

export function progressOverview(data: DemoData) {
  const juniors = activeJuniors(data);
  const rows = juniors.map((member) => ({ member, progress: progressForMember(data, member.id) }));
  const totals = countProgress(rows.flatMap(({ member }) => learningEntriesForMember(data, member.id).map((e) => e.status)));
  return { rows, totals };
}

/* ---------- Attendance ---------- */

export type AttendanceCounts = Record<AttendanceStatus, number> & { total: number };

export function countAttendance(records: AttendanceRecord[]): AttendanceCounts {
  const counts: AttendanceCounts = { present: 0, absent: 0, not_marked: 0, total: records.length };
  for (const record of records) counts[record.status] += 1;
  return counts;
}

export function attendanceForSession(data: DemoData, sessionId: string) {
  return data.attendanceRecords
    .filter((record) => record.sessionId === sessionId)
    .map((record) => ({ record, member: getMember(data, record.memberId) }))
    .filter((row): row is { record: AttendanceRecord; member: Member } => Boolean(row.member))
    .sort((a, b) => a.member.name.localeCompare(b.member.name));
}

/** A person's own attendance, counting only sessions where they were marked. */
export function attendanceSummaryForMember(data: DemoData, memberId: string) {
  const records = data.attendanceRecords.filter((record) => record.memberId === memberId);
  const marked = records.filter((record) => record.status !== "not_marked");
  return {
    attended: marked.filter((record) => record.status === "present").length,
    marked: marked.length,
    sessions: records.length,
  };
}

export function latestSession(data: DemoData) {
  return [...data.attendanceSessions].sort((a, b) => b.date.localeCompare(a.date))[0];
}

/* ---------- Polls ---------- */

export function getPoll(data: DemoData, id: string): Poll | undefined {
  return data.polls.find((poll) => poll.id === id);
}

export function getVote(data: DemoData, pollId: string, memberId: string) {
  return data.votes.find((vote) => vote.pollId === pollId && vote.memberId === memberId);
}

export function pollResults(data: DemoData, pollId: string) {
  const poll = getPoll(data, pollId);
  const votes = data.votes.filter((vote) => vote.pollId === pollId);
  const total = votes.length;
  const options = (poll?.options ?? []).map((option) => {
    const count = votes.filter((vote) => vote.optionId === option.id).length;
    return { option, count, percent: total === 0 ? 0 : Math.round((count / total) * 100) };
  });
  const top = Math.max(0, ...options.map((o) => o.count));
  return { total, options, leadingIds: top === 0 ? [] : options.filter((o) => o.count === top).map((o) => o.option.id) };
}

export function sortPolls(polls: Poll[]): Poll[] {
  return [...polls].sort((a, b) => {
    if (a.status !== b.status) return a.status === "open" ? -1 : 1;
    return b.createdAt.localeCompare(a.createdAt);
  });
}

/* ---------- Tasks ---------- */

export function getTask(data: DemoData, id: string): Task | undefined {
  return data.tasks.find((task) => task.id === id);
}

export type TaskScope = "assigned" | "created" | "all";

export function tasksForScope(
  data: DemoData,
  role: UserRole,
  memberId: string,
  scope: TaskScope,
  status: TaskStatus | "",
): Task[] {
  return data.tasks
    .filter((task) => {
      if (!canViewTask(role, memberId, task)) return false;
      if (scope === "assigned" && task.assigneeId !== memberId) return false;
      if (scope === "created" && task.createdBy !== memberId) return false;
      if (status && task.status !== status) return false;
      return true;
    })
    .sort(compareTasks);
}

const STATUS_ORDER: Record<TaskStatus, number> = { in_progress: 0, todo: 1, done: 2 };

function compareTasks(a: Task, b: Task): number {
  if (a.status !== b.status) return STATUS_ORDER[a.status] - STATUS_ORDER[b.status];
  const aDue = a.dueDate ?? "9999";
  const bDue = b.dueDate ?? "9999";
  if (aDue !== bDue) return aDue.localeCompare(bDue);
  return b.createdAt.localeCompare(a.createdAt);
}

export function openTasksForMember(data: DemoData, memberId: string): Task[] {
  return data.tasks.filter((task) => task.assigneeId === memberId && task.status !== "done").sort(compareTasks);
}

export function countTasks(tasks: Task[]): Record<TaskStatus, number> {
  const counts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 };
  for (const task of tasks) counts[task.status] += 1;
  return counts;
}

/* ---------- Comments ---------- */

export function commentsFor(data: DemoData, parentType: CommentParentType, parentId: string): Comment[] {
  return data.comments
    .filter((comment) => comment.parentType === parentType && comment.parentId === parentId)
    .sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}
