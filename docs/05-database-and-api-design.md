# 05. Database Schema & API Architecture

**Status:** Relational Data Model & Drizzle Schema Specification (`[Proposed]`); Runtime Input Validation (`[Implemented]`); In-Memory Contract Tested (`[Implemented]`)

---

## 1. Database Architecture & Technology `[Confirmed]`

The persistent data layer is implemented in **PostgreSQL** hosted on **Neon** and managed via **Drizzle ORM**.
- **PostgreSQL on Neon:** Provides ACID compliance, relational integrity, foreign key cascading, and instant database branching.
- **Drizzle ORM:** Defines schemas directly in TypeScript (`src/db/schema.ts`), generates automated SQL migrations via `drizzle-kit`, and outputs fully typed query results.
- **Neon Serverless Driver:** `@neondatabase/serverless` communicates over HTTP/WebSockets, avoiding persistent connection pool exhaustion on serverless functions.

---

## 2. Proposed Relational Entity Relationship Diagram

```
┌─────────────────┐       ┌───────────────────────┐       ┌────────────────────────┐
│     members     │◀──────│    coding_profiles    │       │         teams          │
│ (Users & Roles) │       └───────────────────────┘       └───────────┬────────────┘
└────────┬────────┘                                                   │
         │ 1                                                          │ 1
         │                                                            │
         │◀───────────────────────────────────────────────────────────┤ M
         │                                                   ┌────────┴────────────┐
         │                                                   │  team_memberships   │
         │                                                   └─────────────────────┘
         │
         ├───────────────────────────┬───────────────────────────┬─────────────────────────┐
         │ 1                         │ 1                         │ 1                       │ 1
         ▼ M                         ▼ M                         ▼ M                       ▼ M
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       ┌─────────────────┐
│    resources    │         │attendance_sess. │         │  progress_items │       │      polls      │
│  (Library/Pub)  │         └────────┬────────┘         └─────────────────┘       └────────┬────────┘
└────────┬────────┘                  │ 1                                                   │ 1
         │ 1                         ▼ M                                                   ▼ M
         ▼ M                ┌─────────────────┐                                   ┌─────────────────┐
┌─────────────────┐         │attendance_recs  │                                   │  poll_options   │
│  resource_assn  │         └─────────────────┘                                   └────────┬────────┘
└─────────────────┘                                                                        │ 1
         ▲                                                                                 ▼ M
         │ 1                                                                      ┌─────────────────┐
         ├────────────────────────────────────────────────────────────────────────│   poll_votes    │
         │ 1                                                                      └─────────────────┘
         ▼ M
┌─────────────────┐         ┌─────────────────┐         ┌─────────────────┐       ┌─────────────────┐
│      tasks      │◀────────│    comments     │         │   invitations   │       │   audit_logs    │
└─────────────────┘         └─────────────────┘         └─────────────────┘       └─────────────────┘
```

---

## 3. Comprehensive Drizzle PostgreSQL Schema `[Proposed]`

Below is the concrete Drizzle schema specification proposed for `src/db/schema.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  varchar,
  integer,
  boolean,
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
// 2. MEMBERS & PROFILES
// ---------------------------------------------------------------------------
export const members = pgTable(
  "members",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    clerkUserId: varchar("clerk_user_id", { length: 128 }).notNull().unique(),
    email: varchar("email", { length: 255 }).notNull().unique(),
    name: text("name").notNull(),
    role: userRoleEnum("role").default("member").notNull(),
    membershipStatus: membershipStatusEnum("membership_status").default("active").notNull(),
    academicYear: varchar("academic_year", { length: 32 }).notNull(), // e.g. "2nd Year (2024-2028)"
    department: text("department"), // e.g. "Software Engineering", "Mathematics & Computing"
    bio: text("bio").default("").notNull(),
    avatarUrl: text("avatar_url"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("idx_members_role").on(table.role),
    index("idx_members_academic_year").on(table.academicYear),
  ]
);

export const codingProfiles = pgTable(
  "coding_profiles",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    platform: varchar("platform", { length: 64 }).notNull(), // "GitHub", "LeetCode", "Codeforces"
    url: text("url").notNull(),
  },
  (table) => [index("idx_coding_profiles_member").on(table.memberId)]
);

export const skills = pgTable("skills", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
});

export const memberSkills = pgTable(
  "member_skills",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    skillId: uuid("skill_id").references(() => skills.id, { onDelete: "cascade" }).notNull(),
  },
  (table) => [
    uniqueIndex("uq_member_skill").on(table.memberId, table.skillId),
  ]
);

// ---------------------------------------------------------------------------
// 3. TEAMS & DEPARTMENTS
// ---------------------------------------------------------------------------
export const teams = pgTable("teams", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: varchar("name", { length: 64 }).notNull().unique(),
  description: text("description"),
  leadId: uuid("lead_id").references(() => members.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const teamMemberships = pgTable(
  "team_memberships",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    teamId: uuid("team_id").references(() => teams.id, { onDelete: "cascade" }).notNull(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    roleInTeam: varchar("role_in_team", { length: 64 }).default("member").notNull(),
  },
  (table) => [
    uniqueIndex("uq_team_member").on(table.teamId, table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 4. RESOURCES & LEARNING REPOSITORY
// ---------------------------------------------------------------------------
export const resources = pgTable(
  "resources",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    url: text("url").notNull(),
    type: resourceTypeEnum("type").notNull(),
    category: varchar("category", { length: 64 }).notNull(), // "Machine Learning", "Python", etc.
    submittedBy: uuid("submitted_by").references(() => members.id, { onDelete: "set null" }),
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
    id: uuid("id").primaryKey().defaultRandom(),
    resourceId: uuid("resource_id").references(() => resources.id, { onDelete: "cascade" }).notNull(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    status: resourceProgressEnum("status").default("not_started").notNull(),
    assignedBy: uuid("assigned_by").references(() => members.id, { onDelete: "set null" }),
    assignedAt: timestamp("assigned_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_resource_assignment").on(table.resourceId, table.memberId),
    index("idx_resource_assignment_member").on(table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 5. ATTENDANCE MANAGEMENT
// ---------------------------------------------------------------------------
export const attendanceSessions = pgTable("attendance_sessions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(), // e.g. "Intro to Neural Networks Workshop"
  sessionDate: timestamp("session_date", { withTimezone: true }).notNull(),
  groupLabel: varchar("group_label", { length: 64 }).notNull(), // e.g. "Recruits 2026", "All Society"
  createdBy: uuid("created_by").references(() => members.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const attendanceRecords = pgTable(
  "attendance_records",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    sessionId: uuid("session_id").references(() => attendanceSessions.id, { onDelete: "cascade" }).notNull(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    status: attendanceStatusEnum("status").default("not_marked").notNull(),
    markedBy: uuid("marked_by").references(() => members.id, { onDelete: "set null" }),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    uniqueIndex("uq_session_member_attendance").on(table.sessionId, table.memberId),
    index("idx_attendance_session").on(table.sessionId),
    index("idx_attendance_member").on(table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 6. JUNIOR PROGRESS MILESTONES
// ---------------------------------------------------------------------------
export const progressItems = pgTable(
  "progress_items",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    title: text("title").notNull(),
    status: resourceProgressEnum("status").default("not_started").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    assignedBy: uuid("assigned_by").references(() => members.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_progress_items_member").on(table.memberId)]
);

// ---------------------------------------------------------------------------
// 7. POLLS & DECISIONS
// ---------------------------------------------------------------------------
export const polls = pgTable("polls", {
  id: uuid("id").primaryKey().defaultRandom(),
  question: text("question").notNull(),
  description: text("description"),
  createdBy: uuid("created_by").references(() => members.id, { onDelete: "set null" }),
  status: pollStatusEnum("status").default("open").notNull(),
  closesAt: timestamp("closes_at", { withTimezone: true }),
  resultsVisibility: pollVisibilityEnum("results_visibility").default("after_vote").notNull(),
  outcome: text("outcome"), // summary when closed
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const pollOptions = pgTable("poll_options", {
  id: uuid("id").primaryKey().defaultRandom(),
  pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
  label: text("label").notNull(),
  displayOrder: integer("display_order").default(0).notNull(),
});

export const pollVotes = pgTable(
  "poll_votes",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    pollId: uuid("poll_id").references(() => polls.id, { onDelete: "cascade" }).notNull(),
    optionId: uuid("option_id").references(() => pollOptions.id, { onDelete: "cascade" }).notNull(),
    memberId: uuid("member_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    votedAt: timestamp("voted_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    // CRITICAL: Database-enforced rule preventing duplicate voting per member
    uniqueIndex("uq_poll_member_vote").on(table.pollId, table.memberId),
  ]
);

// ---------------------------------------------------------------------------
// 8. TASKS, COMMENTS & INVITATIONS
// ---------------------------------------------------------------------------
export const tasks = pgTable(
  "tasks",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    title: text("title").notNull(),
    description: text("description").default("").notNull(),
    assigneeId: uuid("assignee_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    createdBy: uuid("created_by").references(() => members.id, { onDelete: "set null" }),
    status: taskStatusEnum("status").default("todo").notNull(),
    dueDate: timestamp("due_date", { withTimezone: true }),
    relatedResourceId: uuid("related_resource_id").references(() => resources.id, { onDelete: "set null" }),
    relatedPollId: uuid("related_poll_id").references(() => polls.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_tasks_assignee").on(table.assigneeId)]
);

export const comments = pgTable(
  "comments",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    parentType: commentParentTypeEnum("parent_type").notNull(),
    parentId: uuid("parent_id").notNull(),
    authorId: uuid("author_id").references(() => members.id, { onDelete: "cascade" }).notNull(),
    text: text("text").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_comments_parent").on(table.parentType, table.parentId)]
);

export const invitations = pgTable("invitations", {
  id: uuid("id").primaryKey().defaultRandom(),
  email: varchar("email", { length: 255 }).notNull().unique(),
  role: userRoleEnum("role").default("member").notNull(),
  token: varchar("token", { length: 128 }).notNull().unique(),
  invitedBy: uuid("invited_by").references(() => members.id, { onDelete: "set null" }),
  status: varchar("status", { length: 32 }).default("pending").notNull(),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});

export const auditLogs = pgTable(
  "audit_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    actorId: uuid("actor_id").references(() => members.id, { onDelete: "set null" }),
    action: varchar("action", { length: 64 }).notNull(), // e.g. "attendance.bulk_mark", "poll.close"
    entityType: varchar("entity_type", { length: 64 }).notNull(),
    entityId: uuid("entity_id"),
    metadata: jsonb("metadata"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [index("idx_audit_logs_actor").on(table.actorId)]
);
```

---

## 4. API & Mutation Patterns `[Proposed]`

In Next.js App Router, mutations are handled either through **Server Actions** or **Route Handlers** (`/api/...`). Both patterns follow the exact same 6-step request boundary pipeline.

### 4.1 Standardized Request Pipeline

```
  Client Invocation (e.g., markAttendanceAction({ recordId, status }))
                        │
                        ▼
  Step 1: Zod Schema Validation
          • Parse input with RecordStatusInputSchema.parse(input)
          • On failure: throw/return 400 Bad Request
                        │
                        ▼
  Step 2: Authenticate Identity via Clerk
          • const { userId } = await auth();
          • If (!userId): return 401 Unauthorized
                        │
                        ▼
  Step 3: Resolve Member & Check Server Authorization
          • const member = await db.query.members.findFirst({ where: eq(members.clerkUserId, userId) });
          • if (!canManageAttendance(member.role)): return 403 Forbidden
                        │
                        ▼
  Step 4: Execute Drizzle Mutation
          • await db.update(attendanceRecords)...
          • Use db.transaction() if updating multiple records
                        │
                        ▼
  Step 5: Optional Audit Logging
          • await db.insert(auditLogs)...
                        │
                        ▼
  Step 6: Return Typed Result
          • return { success: true, data: updatedRecord }
```

### 4.2 Standard API Response Type Structure

```typescript
export type ApiResponse<T> =
  | {
      success: true;
      data: T;
    }
  | {
      success: false;
      error: {
        code: "UNAUTHORIZED" | "FORBIDDEN" | "VALIDATION_ERROR" | "NOT_FOUND" | "INTERNAL_ERROR";
        message: string;
        fieldErrors?: Record<string, string>;
      };
    };
```
