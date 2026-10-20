import {
  pgTable,
  text,
  timestamp,
  varchar,
  integer,
  uniqueIndex,
  index,
  jsonb,
  pgEnum,
} from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";

// ---------------------------------------------------------------------------
// 1. ENUMS
// ---------------------------------------------------------------------------
export const userRoleEnum = pgEnum("user_role", [
  "member",
  "junior",
  "senior",
  "admin",
  "attendance_manager",
]);

export const membershipStatusEnum = pgEnum("membership_status", [
  "active",
  "alumni",
  "inactive",
]);

export const resourceTypeEnum = pgEnum("resource_type", [
  "blog",
  "paper",
  "video",
  "course",
  "documentation",
  "competition",
  "opportunity",
  "other",
]);

export const resourceProgressEnum = pgEnum("resource_progress", [
  "not_started",
  "in_progress",
  "completed",
]);

export const reviewStatusEnum = pgEnum("review_status", [
  "published",
  "pending_review",
]);

export const attendanceStatusEnum = pgEnum("attendance_status", [
  "present",
  "absent",
  "not_marked",
]);

export const pollStatusEnum = pgEnum("poll_status", ["open", "closed"]);

export const pollVisibilityEnum = pgEnum("poll_visibility", [
  "after_vote",
  "always",
  "after_close",
]);

export const taskStatusEnum = pgEnum("task_status", [
  "todo",
  "in_progress",
  "done",
]);

export const commentParentTypeEnum = pgEnum("comment_parent_type", [
  "resource",
  "task",
  "poll",
]);

// ---------------------------------------------------------------------------
// 2. MEMBERS & SESSIONS
// ---------------------------------------------------------------------------
export const members = pgTable(
  "members",
  {
    id: text("id").primaryKey(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    passwordHash: text("password_hash").notNull().default("aims2026"),
    name: text("name").notNull(),
    role: userRoleEnum("role").default("member").notNull(),
    membershipStatus: membershipStatusEnum("membership_status").default("active").notNull(),
    academicYear: varchar("academic_year", { length: 64 }).notNull(),
    department: text("department"),
    bio: text("bio").default("").notNull(),
    skills: text("skills").array().notNull().default([]),
    interests: text("interests").array().notNull().default([]),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_members_role").on(table.role),
    index("idx_members_email").on(table.email),
  ]
);

export const sessions = pgTable(
  "sessions",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    token: text("token").notNull().unique(),
    expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_sessions_token").on(table.token),
    index("idx_sessions_member").on(table.memberId),
  ]
);

export const codingProfiles = pgTable(
  "coding_profiles",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    platform: varchar("platform", { length: 64 }).notNull(),
    url: text("url").notNull(),
  },
  (table) => [index("idx_coding_profiles_member").on(table.memberId)]
);

// ---------------------------------------------------------------------------
// 3. RESOURCES & ASSIGNMENTS
// ---------------------------------------------------------------------------
export const resources = pgTable(
  "resources",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    url: text("url").notNull(),
    type: resourceTypeEnum("type").notNull(),
    category: varchar("category", { length: 64 }).notNull(),
    submittedBy: text("submitted_by").references(() => members.id, { onDelete: "set null" }),
    reviewStatus: reviewStatusEnum("review_status").default("published").notNull(),
    note: text("note"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_resources_category").on(table.category),
    index("idx_resources_review_status").on(table.reviewStatus),
  ]
);

export const resourceAssignments = pgTable(
  "resource_assignments",
  {
    id: text("id").primaryKey(),
    resourceId: text("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    status: resourceProgressEnum("status").default("not_started").notNull(),
    assignedBy: text("assigned_by").references(() => members.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_resource_assignment").on(table.resourceId, table.memberId),
    index("idx_resource_assignment_member").on(table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 4. ATTENDANCE SESSIONS & RECORDS
// ---------------------------------------------------------------------------
export const attendanceSessions = pgTable("attendance_sessions", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  sessionDate: text("session_date").notNull(),
  groupLabel: varchar("group_label", { length: 64 }).notNull(),
  createdBy: text("created_by").references(() => members.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: text("id").primaryKey(),
    sessionId: text("session_id").references(() => attendanceSessions.id, { onDelete: "cascade" }).notNull(),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    status: attendanceStatusEnum("status").default("not_marked").notNull(),
    markedBy: text("marked_by").references(() => members.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_session_member_attendance").on(table.sessionId, table.memberId),
    index("idx_attendance_session").on(table.sessionId),
    index("idx_attendance_member").on(table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 5. JUNIOR PROGRESS ITEMS
// ---------------------------------------------------------------------------
export const progressItems = pgTable(
  "progress_items",
  {
    id: text("id").primaryKey(),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    status: resourceProgressEnum("status").default("not_started").notNull(),
    dueDate: text("due_date"),
    assignedBy: text("assigned_by").references(() => members.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_progress_items_member").on(table.memberId)]
);

// ---------------------------------------------------------------------------
// 6. POLLS, OPTIONS & VOTES
// ---------------------------------------------------------------------------
export const polls = pgTable("polls", {
  id: text("id").primaryKey(),
  question: text("question").notNull(),
  description: text("description"),
  createdBy: text("created_by").references(() => members.id, { onDelete: "set null" }),
  status: pollStatusEnum("status").default("open").notNull(),
  closesAt: text("closes_at"),
  resultsVisibility: pollVisibilityEnum("results_visibility").default("after_vote").notNull(),
  outcome: text("outcome"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pollOptions = pgTable("poll_options", {
  id: text("id").primaryKey(),
  pollId: text("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: text("id").primaryKey(),
    pollId: text("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
    optionId: text("option_id").references(() => pollOptions.id, { onDelete: "cascade" }).notNull(),
    memberId: text("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_poll_member_vote").on(table.pollId, table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 7. TASKS, COMMENTS & ANNOUNCEMENTS
// ---------------------------------------------------------------------------
export const tasks = pgTable(
  "tasks",
  {
    id: text("id").primaryKey(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    assigneeId: text("assignee_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    createdBy: text("created_by").references(() => members.id, { onDelete: "set null" }),
    status: taskStatusEnum("status").default("todo").notNull(),
    dueDate: text("due_date"),
    relatedResourceId: text("related_resource_id").references(() => resources.id, { onDelete: "set null" }),
    relatedPollId: text("related_poll_id").references(() => polls.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_tasks_assignee").on(table.assigneeId)]
);

export const comments = pgTable(
  "comments",
  {
    id: text("id").primaryKey(),
    parentType: commentParentTypeEnum("parent_type").notNull(),
    parentId: text("parent_id").notNull(),
    authorId: text("author_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_comments_parent").on(table.parentType, table.parentId)]
);

export const announcements = pgTable("announcements", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  authorId: text("author_id").references(() => members.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const invitations = pgTable("invitations", {
  id: text("id").primaryKey(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").default("member").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  invitedBy: text("invited_by").references(() => members.id, { onDelete: "set null" }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  expiresAt: text("expires_at"),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: text("id").primaryKey(),
    actorId: text("actor_id").references(() => members.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(),
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: text("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_audit_logs_actor").on(table.actorId)]
);

// ---------------------------------------------------------------------------
// 8. RELATIONS
// ---------------------------------------------------------------------------
export const membersRelations = relations(members, ({ many }) => ({
  sessions: many(sessions),
  codingProfiles: many(codingProfiles),
  assignedResources: many(resourceAssignments, { relationName: "assignedMember" }),
  attendanceRecords: many(attendanceRecords),
  progressItems: many(progressItems),
  votes: many(pollVotes),
  tasksAssigned: many(tasks, { relationName: "taskAssignee" }),
  tasksCreated: many(tasks, { relationName: "taskCreator" }),
  comments: many(comments),
}));

export const resourcesRelations = relations(resources, ({ one, many }) => ({
  submitter: one(members, {
    fields: [resources.submittedBy],
    references: [members.id],
  }),
  assignments: many(resourceAssignments),
}));

export const resourceAssignmentsRelations = relations(resourceAssignments, ({ one }) => ({
  resource: one(resources, {
    fields: [resourceAssignments.resourceId],
    references: [resources.id],
  }),
  member: one(members, {
    fields: [resourceAssignments.memberId],
    references: [members.id],
    relationName: "assignedMember",
  }),
}));

export const attendanceSessionsRelations = relations(attendanceSessions, ({ many, one }) => ({
  records: many(attendanceRecords),
  creator: one(members, {
    fields: [attendanceSessions.createdBy],
    references: [members.id],
  }),
}));

export const attendanceRecordsRelations = relations(attendanceRecords, ({ one }) => ({
  session: one(attendanceSessions, {
    fields: [attendanceRecords.sessionId],
    references: [attendanceSessions.id],
  }),
  member: one(members, {
    fields: [attendanceRecords.memberId],
    references: [members.id],
  }),
}));

export const pollsRelations = relations(polls, ({ many, one }) => ({
  options: many(pollOptions),
  votes: many(pollVotes),
  creator: one(members, {
    fields: [polls.createdBy],
    references: [members.id],
  }),
}));

export const pollOptionsRelations = relations(pollOptions, ({ one, many }) => ({
  poll: one(polls, {
    fields: [pollOptions.pollId],
    references: [polls.id],
  }),
  votes: many(pollVotes),
}));

export const pollVotesRelations = relations(pollVotes, ({ one }) => ({
  poll: one(polls, {
    fields: [pollVotes.pollId],
    references: [polls.id],
  }),
  option: one(pollOptions, {
    fields: [pollVotes.optionId],
    references: [pollOptions.id],
  }),
  member: one(members, {
    fields: [pollVotes.memberId],
    references: [members.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  assignee: one(members, {
    fields: [tasks.assigneeId],
    references: [members.id],
    relationName: "taskAssignee",
  }),
  creator: one(members, {
    fields: [tasks.createdBy],
    references: [members.id],
    relationName: "taskCreator",
  }),
  resource: one(resources, {
    fields: [tasks.relatedResourceId],
    references: [resources.id],
  }),
}));
