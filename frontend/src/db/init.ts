export const MIGRATION_STATEMENTS = [
  `CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'not_marked');`,
  `CREATE TYPE "public"."comment_parent_type" AS ENUM('resource', 'task', 'poll');`,
  `CREATE TYPE "public"."membership_status" AS ENUM('active', 'alumni', 'inactive');`,
  `CREATE TYPE "public"."poll_status" AS ENUM('open', 'closed');`,
  `CREATE TYPE "public"."poll_visibility" AS ENUM('after_vote', 'always', 'after_close');`,
  `CREATE TYPE "public"."resource_progress" AS ENUM('not_started', 'in_progress', 'completed');`,
  `CREATE TYPE "public"."resource_type" AS ENUM('blog', 'paper', 'video', 'course', 'documentation', 'competition', 'opportunity', 'other');`,
  `CREATE TYPE "public"."review_status" AS ENUM('published', 'pending_review');`,
  `CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done');`,
  `CREATE TYPE "public"."user_role" AS ENUM('member', 'junior', 'senior', 'admin', 'attendance_manager');`,
  `CREATE TABLE IF NOT EXISTS "announcements" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "body" text NOT NULL,
    "author_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "attendance_records" (
    "id" text PRIMARY KEY NOT NULL,
    "session_id" text NOT NULL,
    "member_id" text NOT NULL,
    "status" "attendance_status" DEFAULT 'not_marked' NOT NULL,
    "marked_by" text,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "attendance_sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "session_date" text NOT NULL,
    "group_label" varchar(64) NOT NULL,
    "created_by" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "audit_logs" (
    "id" text PRIMARY KEY NOT NULL,
    "actor_id" text,
    "action" varchar(64) NOT NULL,
    "entity_type" varchar(64) NOT NULL,
    "entity_id" text,
    "metadata" jsonb,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "coding_profiles" (
    "id" text PRIMARY KEY NOT NULL,
    "member_id" text NOT NULL,
    "platform" varchar(64) NOT NULL,
    "url" text NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "comments" (
    "id" text PRIMARY KEY NOT NULL,
    "parent_type" "comment_parent_type" NOT NULL,
    "parent_id" text NOT NULL,
    "author_id" text NOT NULL,
    "text" text NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "invitations" (
    "id" text PRIMARY KEY NOT NULL,
    "email" varchar(255) NOT NULL,
    "role" "user_role" DEFAULT 'member' NOT NULL,
    "token" varchar(128) NOT NULL,
    "invited_by" text,
    "status" varchar(32) DEFAULT 'pending' NOT NULL,
    "expires_at" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "invitations_email_unique" UNIQUE("email"),
    CONSTRAINT "invitations_token_unique" UNIQUE("token")
  );`,
  `CREATE TABLE IF NOT EXISTS "members" (
    "id" text PRIMARY KEY NOT NULL,
    "email" varchar(255) NOT NULL,
    "password_hash" text DEFAULT 'aims2026' NOT NULL,
    "name" text NOT NULL,
    "role" "user_role" DEFAULT 'member' NOT NULL,
    "membership_status" "membership_status" DEFAULT 'active' NOT NULL,
    "academic_year" varchar(64) NOT NULL,
    "department" text,
    "bio" text DEFAULT '' NOT NULL,
    "skills" text[] DEFAULT '{}' NOT NULL,
    "interests" text[] DEFAULT '{}' NOT NULL,
    "avatar_url" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "members_email_unique" UNIQUE("email")
  );`,
  `CREATE TABLE IF NOT EXISTS "sessions" (
    "id" text PRIMARY KEY NOT NULL,
    "member_id" text NOT NULL,
    "token" text NOT NULL,
    "expires_at" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    CONSTRAINT "sessions_token_unique" UNIQUE("token")
  );`,
  `CREATE TABLE IF NOT EXISTS "poll_options" (
    "id" text PRIMARY KEY NOT NULL,
    "poll_id" text NOT NULL,
    "label" text NOT NULL,
    "display_order" integer DEFAULT 0 NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "poll_votes" (
    "id" text PRIMARY KEY NOT NULL,
    "poll_id" text NOT NULL,
    "option_id" text NOT NULL,
    "member_id" text NOT NULL,
    "voted_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "polls" (
    "id" text PRIMARY KEY NOT NULL,
    "question" text NOT NULL,
    "description" text,
    "created_by" text,
    "status" "poll_status" DEFAULT 'open' NOT NULL,
    "closes_at" text,
    "results_visibility" "poll_visibility" DEFAULT 'after_vote' NOT NULL,
    "outcome" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "progress_items" (
    "id" text PRIMARY KEY NOT NULL,
    "member_id" text NOT NULL,
    "title" text NOT NULL,
    "status" "resource_progress" DEFAULT 'not_started' NOT NULL,
    "due_date" text,
    "assigned_by" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "resource_assignments" (
    "id" text PRIMARY KEY NOT NULL,
    "resource_id" text NOT NULL,
    "member_id" text NOT NULL,
    "status" "resource_progress" DEFAULT 'not_started' NOT NULL,
    "assigned_by" text,
    "assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "resources" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "url" text NOT NULL,
    "type" "resource_type" NOT NULL,
    "category" varchar(64) NOT NULL,
    "submitted_by" text,
    "review_status" "review_status" DEFAULT 'published' NOT NULL,
    "note" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE TABLE IF NOT EXISTS "tasks" (
    "id" text PRIMARY KEY NOT NULL,
    "title" text NOT NULL,
    "description" text DEFAULT '' NOT NULL,
    "assignee_id" text NOT NULL,
    "created_by" text,
    "status" "task_status" DEFAULT 'todo' NOT NULL,
    "due_date" text,
    "related_resource_id" text,
    "related_poll_id" text,
    "created_at" timestamp with time zone DEFAULT now() NOT NULL,
    "updated_at" timestamp with time zone DEFAULT now() NOT NULL
  );`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_session_member_attendance" ON "attendance_records" USING btree ("session_id","member_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_poll_member_vote" ON "poll_votes" USING btree ("poll_id","member_id");`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "uq_resource_assignment" ON "resource_assignments" USING btree ("resource_id","member_id");`
];
