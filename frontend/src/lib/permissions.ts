import type { Poll, Resource, Task, UserRole } from "@/types";

/*
 * Prototype permission helpers.
 *
 * These checks only shape what the demo shows. They run in the browser and
 * provide no security: a production version must enforce every rule on the
 * server and in the data layer.
 */

/** Senior (authorised lead) and admin roles. */
export function isLead(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}

export function canAccessAdministration(role: UserRole): boolean {
  return isLead(role) || role === "attendance_manager";
}

export function canManageAttendance(role: UserRole): boolean {
  return isLead(role) || role === "attendance_manager";
}
export function canManageProgress(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}
export function canManagePolls(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}
export function canAssignResources(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}
export function canReviewResources(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}
export function canCreateTasks(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}
export function canViewAllTasks(role: UserRole): boolean {
  return role === "senior" || role === "admin";
}

/** Invitations and role assignment are administrator-only. */
export function canManageMembers(role: UserRole): boolean {
  return role === "admin";
}

export function canEditMemberProfile(currentMemberId: string, targetMemberId: string): boolean {
  return currentMemberId === targetMemberId;
}

export function canViewIndividualProgress(
  role: UserRole,
  currentMemberId: string,
  targetMemberId: string,
): boolean {
  return isLead(role) || currentMemberId === targetMemberId;
}

export function canViewIndividualAttendance(
  role: UserRole,
  currentMemberId: string,
  targetMemberId: string,
): boolean {
  return isLead(role) || role === "attendance_manager" || currentMemberId === targetMemberId;
}

/** Pending suggestions are visible to their submitter and to reviewers. */
export function canSeeResource(role: UserRole, currentMemberId: string, resource: Resource): boolean {
  return (
    resource.reviewStatus === "published" ||
    canReviewResources(role) ||
    resource.submittedBy === currentMemberId
  );
}

export function canViewTask(role: UserRole, currentMemberId: string, task: Task): boolean {
  return canViewAllTasks(role) || task.assigneeId === currentMemberId || task.createdBy === currentMemberId;
}

/** Creators and leads can edit a task's details or close it. */
export function canEditTask(role: UserRole, currentMemberId: string, task: Task): boolean {
  return isLead(role) || task.createdBy === currentMemberId;
}

export function canUpdateTaskStatus(role: UserRole, currentMemberId: string, task: Task): boolean {
  return task.assigneeId === currentMemberId || canEditTask(role, currentMemberId, task);
}

export function canVote(poll: Poll, hasVoted: boolean): boolean {
  return poll.status === "open" && !hasVoted;
}

/** Applies the poll's simplified results-visibility setting. Poll managers always see counts. */
export function canSeePollResults(
  poll: Poll,
  { hasVoted, isManager }: { hasVoted: boolean; isManager: boolean },
): boolean {
  if (isManager || poll.status === "closed") return true;
  if (poll.resultsVisibility === "always") return true;
  if (poll.resultsVisibility === "after_vote") return hasVoted;
  return false;
}
