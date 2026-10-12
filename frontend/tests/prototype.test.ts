import { describe, expect, it } from "vitest";
import { seedData } from "@/data/seed";
import {
  canAccessAdministration,
  canEditMemberProfile,
  canSeePollResults,
  canViewIndividualAttendance,
  canViewIndividualProgress,
} from "@/lib/permissions";
import { countAttendance, countProgress, pollResults, progressForMember } from "@/lib/selectors";
import { isValidUrl, parseList, validateComment, validatePoll, validateResource } from "@/lib/validation";
import { createInitialState, demoReducer } from "@/state/reducer";

describe("permissions", () => {
  it("limits administration to senior and admin", () => {
    expect(canAccessAdministration("senior")).toBe(true);
    expect(canAccessAdministration("admin")).toBe(true);
    expect(canAccessAdministration("junior")).toBe(false);
    expect(canAccessAdministration("member")).toBe(false);
  });
  it("lets people see only their own progress and attendance", () => {
    expect(canViewIndividualProgress("junior", "m06", "m06")).toBe(true);
    expect(canViewIndividualProgress("junior", "m06", "m07")).toBe(false);
    expect(canViewIndividualAttendance("member", "m04", "m06")).toBe(false);
    expect(canViewIndividualAttendance("senior", "m02", "m06")).toBe(true);
  });
  it("allows editing only your own profile", () => {
    expect(canEditMemberProfile("m06", "m06")).toBe(true);
    expect(canEditMemberProfile("m06", "m07")).toBe(false);
  });
  it("applies poll result visibility", () => {
    const poll = seedData.polls.find((p) => p.id === "pl2")!; // after_close
    expect(canSeePollResults(poll, { hasVoted: true, isManager: false })).toBe(false);
    expect(canSeePollResults(poll, { hasVoted: false, isManager: true })).toBe(true);
  });
});

describe("selectors", () => {
  it("derives progress from the underlying items", () => {
    expect(countProgress(["completed", "in_progress", "not_started", "completed"]).percent).toBe(50);
    expect(countProgress([]).percent).toBe(0);
    const arjun = progressForMember(seedData, "m06");
    expect(arjun.total).toBe(arjun.completed + arjun.in_progress + arjun.not_started);
  });
  it("counts attendance for a session", () => {
    const counts = countAttendance(seedData.attendanceRecords.filter((r) => r.sessionId === "s3"));
    expect(counts.present + counts.absent + counts.not_marked).toBe(counts.total);
  });
  it("totals poll votes", () => {
    const r = pollResults(seedData, "pl1");
    expect(r.total).toBe(5);
    expect(r.options.reduce((n, o) => n + o.count, 0)).toBe(5);
  });
});

describe("validation", () => {
  it("validates urls and lists", () => {
    expect(isValidUrl("https://example.com/a")).toBe(true);
    expect(isValidUrl("not a url")).toBe(false);
    expect(isValidUrl("javascript:alert(1)")).toBe(false);
    expect(parseList("a, b, ,A")).toEqual(["a", "b"]);
  });
  it("rejects incomplete resources and whitespace-only values", () => {
    const e = validateResource({ title: "  ", url: "nope", type: "", category: "", description: "", note: "" });
    expect(Object.keys(e).sort()).toEqual(["category", "title", "type", "url"]);
  });
  it("requires two distinct poll options", () => {
    expect(validatePoll({ question: "Q?", description: "", options: ["A", " "] }).options).toBeTruthy();
    expect(validatePoll({ question: "Q?", description: "", options: ["A", "a"] }).options).toBeTruthy();
    expect(validatePoll({ question: "Q?", description: "", options: ["A", "B"] }).options).toBeUndefined();
  });
  it("rejects empty comments", () => {
    expect(validateComment("   ")).toBeTruthy();
    expect(validateComment("Hi")).toBeUndefined();
  });
});

describe("reducer", () => {
  it("prevents duplicate votes and votes on closed polls", () => {
    let s = createInitialState();
    s = demoReducer(s, { type: "castVote", pollId: "pl1", memberId: "m06", optionId: "pl1-o1" });
    expect(pollResults(s.data, "pl1").total).toBe(6);
    s = demoReducer(s, { type: "castVote", pollId: "pl1", memberId: "m06", optionId: "pl1-o2" });
    expect(pollResults(s.data, "pl1").total).toBe(6);
    s = demoReducer(s, { type: "castVote", pollId: "pl3", memberId: "m08", optionId: "pl3-o1" });
    expect(pollResults(s.data, "pl3").total).toBe(9);
  });
  it("closes polls so later votes are rejected", () => {
    let s = createInitialState();
    s = demoReducer(s, { type: "closePoll", pollId: "pl1", outcome: "Wednesday" });
    s = demoReducer(s, { type: "castVote", pollId: "pl1", memberId: "m08", optionId: "pl1-o1" });
    expect(pollResults(s.data, "pl1").total).toBe(5);
  });
  it("updates attendance and progress summaries", () => {
    let s = createInitialState();
    const rec = s.data.attendanceRecords.find((r) => r.status === "not_marked")!;
    s = demoReducer(s, { type: "setAttendance", recordId: rec.id, status: "present" });
    expect(countAttendance(s.data.attendanceRecords.filter((r) => r.sessionId === rec.sessionId)).not_marked).toBe(3);
    const before = progressForMember(s.data, "m08").completed;
    s = demoReducer(s, { type: "updateProgressItem", itemId: "p05", status: "completed" });
    expect(progressForMember(s.data, "m08").completed).toBe(before + 1);
  });
  it("refuses to edit another person's profile and ignores empty comments", () => {
    let s = createInitialState();
    const changes = { name: "X", bio: "b", skills: ["s"], interests: [], codingProfiles: [] };
    s = demoReducer(s, { type: "updateProfile", actorId: "m06", memberId: "m07", changes });
    expect(s.data.members.find((m) => m.id === "m07")!.name).toBe("Sana Qureshi");
    const n = s.data.comments.length;
    s = demoReducer(s, { type: "addComment", comment: { id: "x", parentType: "task", parentId: "t01", authorId: "m06", text: "  ", createdAt: "" } });
    expect(s.data.comments.length).toBe(n);
  });
  it("reset restores seed data and default role", () => {
    let s = demoReducer(createInitialState(), { type: "setRole", role: "admin" });
    s = demoReducer(s, { type: "closePoll", pollId: "pl1" });
    s = demoReducer(s, { type: "reset" });
    expect(s.role).toBe("junior");
    expect(s.data.polls.find((p) => p.id === "pl1")!.status).toBe("open");
  });
  it("seed references are consistent", () => {
    const ids = new Set(seedData.members.map((m) => m.id));
    const ok = (id: string) => ids.has(id);
    expect(seedData.resources.every((r) => ok(r.submittedBy))).toBe(true);
    expect(seedData.assignments.every((a) => ok(a.memberId) && ok(a.assignedBy))).toBe(true);
    expect(seedData.attendanceRecords.every((a) => ok(a.memberId))).toBe(true);
    expect(seedData.tasks.every((t) => ok(t.assigneeId) && ok(t.createdBy))).toBe(true);
    expect(seedData.votes.every((v) => ok(v.memberId))).toBe(true);
    expect(seedData.comments.every((c) => ok(c.authorId))).toBe(true);
  });
});
