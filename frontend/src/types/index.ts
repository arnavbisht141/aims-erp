export type UserRole = "member" | "junior" | "senior" | "admin" | "attendance_manager";

export type MembershipStatus = "active" | "alumni" | "inactive";

export interface CodingProfile {
  label: string;
  url: string;
}

export interface Member {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: MembershipStatus;
  yearLabel: string;
  department?: string;
  bio: string;
  skills: string[];
  interests: string[];
  codingProfiles: CodingProfile[];
  avatarUrl?: string;
}

export type ResourceType =
  | "blog"
  | "paper"
  | "video"
  | "course"
  | "documentation"
  | "competition"
  | "opportunity"
  | "other";

/** An individual's learning progress on an assigned item. */
export type ResourceProgress = "not_started" | "in_progress" | "completed";

/** Publication state of the resource itself — never an individual's progress. */
export type ResourceReviewStatus = "published" | "pending_review";

export interface Resource {
  id: string;
  title: string;
  description: string;
  url: string;
  type: ResourceType;
  category: string;
  submittedBy: string;
  createdAt: string;
  reviewStatus: ResourceReviewStatus;
  note?: string;
}

export interface ResourceAssignment {
  id: string;
  resourceId: string;
  memberId: string;
  status: ResourceProgress;
  assignedBy: string;
  assignedAt: string;
}

export type AttendanceStatus = "present" | "absent" | "not_marked";

export interface AttendanceSession {
  id: string;
  title: string;
  date: string;
  groupLabel: string;
}

export interface AttendanceRecord {
  id: string;
  sessionId: string;
  memberId: string;
  status: AttendanceStatus;
}

/** A learning item for a junior that is not backed by a library resource. */
export interface ProgressItem {
  id: string;
  memberId: string;
  title: string;
  status: ResourceProgress;
  dueDate?: string;
}

export type PollStatus = "open" | "closed";
export type PollResultsVisibility = "after_vote" | "always" | "after_close";

export interface PollOption {
  id: string;
  label: string;
}

export interface PollVote {
  pollId: string;
  memberId: string;
  optionId: string;
}

export interface Poll {
  id: string;
  question: string;
  description?: string;
  createdBy: string;
  createdAt: string;
  closesAt?: string;
  status: PollStatus;
  options: PollOption[];
  resultsVisibility: PollResultsVisibility;
  outcome?: string;
}

export type TaskStatus = "todo" | "in_progress" | "done";

export interface Task {
  id: string;
  title: string;
  description: string;
  assigneeId: string;
  createdBy: string;
  status: TaskStatus;
  dueDate?: string;
  relatedResourceId?: string;
  relatedPollId?: string;
  createdAt: string;
}

export type CommentParentType = "resource" | "task" | "poll";

export interface Comment {
  id: string;
  parentType: CommentParentType;
  parentId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export interface Announcement {
  id: string;
  title: string;
  body: string;
  authorId: string;
  createdAt: string;
}

export interface Invitation {
  id: string;
  email: string;
  role: UserRole;
  invitedBy: string;
  createdAt: string;
  status: "pending" | "accepted";
}

export interface DemoData {
  members: Member[];
  resources: Resource[];
  assignments: ResourceAssignment[];
  attendanceSessions: AttendanceSession[];
  attendanceRecords: AttendanceRecord[];
  progressItems: ProgressItem[];
  polls: Poll[];
  votes: PollVote[];
  tasks: Task[];
  comments: Comment[];
  announcements: Announcement[];
  invitations: Invitation[];
}
