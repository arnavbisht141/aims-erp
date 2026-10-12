import { DEFAULT_DEMO_ROLE, seedData } from "@/data/seed";
import { isBlank } from "@/lib/validation";
import type {
  AttendanceStatus,
  CodingProfile,
  Comment,
  DemoData,
  Invitation,
  Poll,
  ProgressItem,
  Resource,
  ResourceAssignment,
  ResourceProgress,
  Task,
  TaskStatus,
  UserRole,
} from "@/types";

export interface DemoState {
  role: UserRole;
  data: DemoData;
}

export interface ProfileChanges {
  name: string;
  bio: string;
  skills: string[];
  interests: string[];
  codingProfiles: CodingProfile[];
}

export type TaskChanges = Partial<Pick<Task, "title" | "description" | "assigneeId" | "dueDate" | "relatedResourceId">>;

export type DemoAction =
  | { type: "setRole"; role: UserRole }
  | { type: "reset" }
  | { type: "hydrate"; state: DemoState }
  | { type: "updateProfile"; actorId: string; memberId: string; changes: ProfileChanges }
  | { type: "submitResource"; resource: Resource }
  | { type: "reviewResource"; resourceId: string; decision: "publish" | "reject" }
  | { type: "assignResource"; assignments: ResourceAssignment[] }
  | { type: "updateAssignmentStatus"; assignmentId: string; status: ResourceProgress }
  | { type: "setAttendance"; recordId: string; status: AttendanceStatus }
  | { type: "restoreAttendance"; records: { id: string; status: AttendanceStatus }[] }
  | { type: "updateProgressItem"; itemId: string; status: ResourceProgress }
  | { type: "addProgressItem"; item: ProgressItem }
  | { type: "createPoll"; poll: Poll }
  | { type: "castVote"; pollId: string; memberId: string; optionId: string }
  | { type: "closePoll"; pollId: string; outcome?: string }
  | { type: "createTask"; task: Task }
  | { type: "updateTask"; taskId: string; changes: TaskChanges }
  | { type: "updateTaskStatus"; taskId: string; status: TaskStatus }
  | { type: "addComment"; comment: Comment }
  | { type: "createInvitation"; invitation: Invitation };

export function createInitialState(): DemoState {
  // structuredClone keeps the seed module pristine so "reset" always restores it.
  return { role: DEFAULT_DEMO_ROLE, data: structuredClone(seedData) };
}

function withData(state: DemoState, data: Partial<DemoData>): DemoState {
  return { ...state, data: { ...state.data, ...data } };
}

export function demoReducer(state: DemoState, action: DemoAction): DemoState {
  const { data } = state;

  switch (action.type) {
    case "setRole":
      return { ...state, role: action.role };

    case "reset":
      return createInitialState();

    case "hydrate":
      return action.state;

    case "updateProfile": {
      // The ordinary UI may only change the signed-in person's own profile.
      if (action.actorId !== action.memberId) return state;
      return withData(state, {
        members: data.members.map((member) =>
          member.id === action.memberId ? { ...member, ...action.changes } : member,
        ),
      });
    }

    case "submitResource":
      return withData(state, { resources: [action.resource, ...data.resources] });

    case "reviewResource": {
      if (action.decision === "publish") {
        return withData(state, {
          resources: data.resources.map((resource) =>
            resource.id === action.resourceId ? { ...resource, reviewStatus: "published" } : resource,
          ),
        });
      }
      return withData(state, {
        resources: data.resources.filter((resource) => resource.id !== action.resourceId),
        assignments: data.assignments.filter((a) => a.resourceId !== action.resourceId),
        comments: data.comments.filter((c) => !(c.parentType === "resource" && c.parentId === action.resourceId)),
      });
    }

    case "assignResource": {
      const fresh = action.assignments.filter(
        (incoming) =>
          !data.assignments.some((a) => a.resourceId === incoming.resourceId && a.memberId === incoming.memberId),
      );
      if (fresh.length === 0) return state;
      return withData(state, { assignments: [...data.assignments, ...fresh] });
    }

    case "updateAssignmentStatus":
      return withData(state, {
        assignments: data.assignments.map((a) => (a.id === action.assignmentId ? { ...a, status: action.status } : a)),
      });

    case "setAttendance":
      return withData(state, {
        attendanceRecords: data.attendanceRecords.map((record) =>
          record.id === action.recordId ? { ...record, status: action.status } : record,
        ),
      });

    case "restoreAttendance": {
      const byId = new Map(action.records.map((r) => [r.id, r.status]));
      return withData(state, {
        attendanceRecords: data.attendanceRecords.map((record) =>
          byId.has(record.id) ? { ...record, status: byId.get(record.id)! } : record,
        ),
      });
    }

    case "updateProgressItem":
      return withData(state, {
        progressItems: data.progressItems.map((item) =>
          item.id === action.itemId ? { ...item, status: action.status } : item,
        ),
      });

    case "addProgressItem":
      return withData(state, { progressItems: [...data.progressItems, action.item] });

    case "createPoll":
      return withData(state, { polls: [action.poll, ...data.polls] });

    case "castVote": {
      const poll = data.polls.find((p) => p.id === action.pollId);
      const alreadyVoted = data.votes.some((v) => v.pollId === action.pollId && v.memberId === action.memberId);
      const validOption = poll?.options.some((o) => o.id === action.optionId);
      // Closed polls and duplicate votes are rejected here, not only in the UI.
      if (!poll || poll.status !== "open" || alreadyVoted || !validOption) return state;
      return withData(state, {
        votes: [...data.votes, { pollId: action.pollId, memberId: action.memberId, optionId: action.optionId }],
      });
    }

    case "closePoll":
      return withData(state, {
        polls: data.polls.map((poll) =>
          poll.id === action.pollId
            ? { ...poll, status: "closed", outcome: isBlank(action.outcome) ? poll.outcome : action.outcome!.trim() }
            : poll,
        ),
      });

    case "createTask":
      return withData(state, { tasks: [action.task, ...data.tasks] });

    case "updateTask":
      return withData(state, {
        tasks: data.tasks.map((task) => (task.id === action.taskId ? { ...task, ...action.changes } : task)),
      });

    case "updateTaskStatus":
      return withData(state, {
        tasks: data.tasks.map((task) => (task.id === action.taskId ? { ...task, status: action.status } : task)),
      });

    case "addComment":
      if (isBlank(action.comment.text)) return state;
      return withData(state, {
        comments: [...data.comments, { ...action.comment, text: action.comment.text.trim() }],
      });

    case "createInvitation":
      return withData(state, { invitations: [action.invitation, ...data.invitations] });
  }
}
