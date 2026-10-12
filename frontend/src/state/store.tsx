"use client";

import { createContext, useContext, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from "react";
import { DEMO_PERSONAS } from "@/data/seed";
import { isUserRole } from "@/lib/validation";
import type {
  AttendanceStatus,
  Comment,
  CommentParentType,
  DemoData,
  Member,
  PollOption,
  PollResultsVisibility,
  PollStatus,
  ResourceProgress,
  ResourceType,
  TaskStatus,
  UserRole,
} from "@/types";
import { createInitialState, demoReducer, type DemoState, type ProfileChanges, type TaskChanges } from "./reducer";

/*
 * Demo-only persistence: state is mirrored to sessionStorage so a page
 * refresh keeps your edits until the tab closes. It holds fictional data
 * only, never credentials. "Reset demo data" clears it.
 */
const STORAGE_KEY = "aims-demo-state:v1";

const DATA_KEYS: (keyof DemoData)[] = [
  "members",
  "resources",
  "assignments",
  "attendanceSessions",
  "attendanceRecords",
  "progressItems",
  "polls",
  "votes",
  "tasks",
  "comments",
  "announcements",
  "invitations",
];

function readSavedState(): DemoState | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const candidate = parsed as Partial<DemoState>;
    if (!isUserRole(candidate.role) || !candidate.data || typeof candidate.data !== "object") return null;
    const savedData = candidate.data as Partial<DemoData>;
    if (!DATA_KEYS.every((key) => Array.isArray(savedData[key]))) return null;
    return { role: candidate.role, data: savedData as DemoData };
  } catch {
    // Malformed or outdated saved state: fall back to the seed data.
    return null;
  }
}

let idCounter = 0;
function createId(prefix: string): string {
  idCounter += 1;
  return `${prefix}-${Date.now().toString(36)}${idCounter.toString(36)}`;
}

const nowIso = () => new Date().toISOString();

export interface NewResourceInput {
  title: string;
  url: string;
  type: ResourceType;
  category: string;
  description: string;
  note: string;
}

export interface NewPollInput {
  question: string;
  description: string;
  options: string[];
  closesAt: string;
  resultsVisibility: PollResultsVisibility;
  status: PollStatus;
}

export interface NewTaskInput {
  title: string;
  description: string;
  assigneeId: string;
  dueDate: string;
  relatedResourceId: string;
}

function useDemoActions(dispatch: React.Dispatch<Parameters<typeof demoReducer>[1]>, stateRef: React.RefObject<DemoState>) {
  return useMemo(() => {
    const currentId = () => DEMO_PERSONAS[stateRef.current.role];
    return {
      setRole: (role: UserRole) => dispatch({ type: "setRole", role }),
      reset: () => {
        try {
          window.sessionStorage.removeItem(STORAGE_KEY);
        } catch {
          /* storage unavailable: nothing to clear */
        }
        dispatch({ type: "reset" });
      },
      updateProfile: (memberId: string, changes: ProfileChanges) =>
        dispatch({ type: "updateProfile", actorId: currentId(), memberId, changes }),
      submitResource: (input: NewResourceInput) => {
        const role = stateRef.current.role;
        const autoPublish = role === "senior" || role === "admin";
        const id = createId("r");
        dispatch({
          type: "submitResource",
          resource: {
            id,
            title: input.title.trim(),
            url: input.url.trim(),
            type: input.type,
            category: input.category,
            description: input.description.trim(),
            note: input.note.trim() || undefined,
            submittedBy: currentId(),
            createdAt: nowIso(),
            reviewStatus: autoPublish ? "published" : "pending_review",
          },
        });
        return { id, published: autoPublish };
      },
      reviewResource: (resourceId: string, decision: "publish" | "reject") =>
        dispatch({ type: "reviewResource", resourceId, decision }),
      assignResource: (resourceId: string, memberIds: string[]) => {
        const assignedAt = nowIso();
        dispatch({
          type: "assignResource",
          assignments: memberIds.map((memberId) => ({
            id: createId("a"),
            resourceId,
            memberId,
            status: "not_started",
            assignedBy: currentId(),
            assignedAt,
          })),
        });
      },
      updateAssignmentStatus: (assignmentId: string, status: ResourceProgress) =>
        dispatch({ type: "updateAssignmentStatus", assignmentId, status }),
      setAttendance: (recordId: string, status: AttendanceStatus) =>
        dispatch({ type: "setAttendance", recordId, status }),
      restoreAttendance: (records: { id: string; status: AttendanceStatus }[]) =>
        dispatch({ type: "restoreAttendance", records }),
      updateProgressItem: (itemId: string, status: ResourceProgress) =>
        dispatch({ type: "updateProgressItem", itemId, status }),
      addProgressItem: (memberId: string, title: string, dueDate: string) =>
        dispatch({
          type: "addProgressItem",
          item: { id: createId("p"), memberId, title: title.trim(), status: "not_started", dueDate: dueDate || undefined },
        }),
      createPoll: (input: NewPollInput) => {
        const id = createId("pl");
        const options: PollOption[] = input.options
          .map((label) => label.trim())
          .filter(Boolean)
          .map((label, index) => ({ id: `${id}-o${index + 1}`, label }));
        dispatch({
          type: "createPoll",
          poll: {
            id,
            question: input.question.trim(),
            description: input.description.trim() || undefined,
            createdBy: currentId(),
            createdAt: nowIso(),
            closesAt: input.closesAt || undefined,
            status: input.status,
            options,
            resultsVisibility: input.resultsVisibility,
          },
        });
        return id;
      },
      castVote: (pollId: string, optionId: string) =>
        dispatch({ type: "castVote", pollId, memberId: currentId(), optionId }),
      closePoll: (pollId: string, outcome: string) => dispatch({ type: "closePoll", pollId, outcome }),
      createTask: (input: NewTaskInput) => {
        const id = createId("t");
        dispatch({
          type: "createTask",
          task: {
            id,
            title: input.title.trim(),
            description: input.description.trim(),
            assigneeId: input.assigneeId,
            createdBy: currentId(),
            status: "todo",
            dueDate: input.dueDate || undefined,
            relatedResourceId: input.relatedResourceId || undefined,
            createdAt: nowIso(),
          },
        });
        return id;
      },
      updateTask: (taskId: string, changes: TaskChanges) => dispatch({ type: "updateTask", taskId, changes }),
      updateTaskStatus: (taskId: string, status: TaskStatus) => dispatch({ type: "updateTaskStatus", taskId, status }),
      addComment: (parentType: CommentParentType, parentId: string, text: string) => {
        const comment: Comment = {
          id: createId("c"),
          parentType,
          parentId,
          authorId: currentId(),
          text,
          createdAt: nowIso(),
        };
        dispatch({ type: "addComment", comment });
      },
      createInvitation: (email: string, role: UserRole) =>
        dispatch({
          type: "createInvitation",
          invitation: {
            id: createId("i"),
            email: email.trim().toLowerCase(),
            role,
            invitedBy: currentId(),
            createdAt: nowIso(),
            status: "pending",
          },
        }),
    };
  }, [dispatch, stateRef]);
}

export type DemoActions = ReturnType<typeof useDemoActions>;

interface DemoContextValue {
  role: UserRole;
  data: DemoData;
  currentMember: Member;
  actions: DemoActions;
  /** False until saved session state has been read; avoids flashing the wrong role. */
  ready: boolean;
}

const DemoContext = createContext<DemoContextValue | null>(null);

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(demoReducer, undefined, createInitialState);
  const [ready, setReady] = useState(false);
  const stateRef = useRef(state);
  const actions = useDemoActions(dispatch, stateRef);

  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  useEffect(() => {
    const saved = readSavedState();
    if (saved) {
      stateRef.current = saved;
      dispatch({ type: "hydrate", state: saved });
    }
    // Reading sessionStorage must wait until after hydration to match the server render.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full or blocked: the demo keeps working in memory */
    }
  }, [state, ready]);

  const value = useMemo<DemoContextValue>(() => {
    const currentMember =
      state.data.members.find((member) => member.id === DEMO_PERSONAS[state.role]) ?? state.data.members[0];
    return { role: state.role, data: state.data, currentMember, actions, ready };
  }, [state, actions, ready]);

  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>;
}

export function useDemo(): DemoContextValue {
  const value = useContext(DemoContext);
  if (!value) throw new Error("useDemo must be used inside <DemoProvider>");
  return value;
}
