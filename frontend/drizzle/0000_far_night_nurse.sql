CREATE TYPE "public"."attendance_status" AS ENUM('present', 'absent', 'not_marked');--> statement-breakpoint
CREATE TYPE "public"."comment_parent_type" AS ENUM('resource', 'task', 'poll');--> statement-breakpoint
CREATE TYPE "public"."membership_status" AS ENUM('active', 'alumni', 'inactive');--> statement-breakpoint
CREATE TYPE "public"."poll_status" AS ENUM('open', 'closed');--> statement-breakpoint
CREATE TYPE "public"."poll_visibility" AS ENUM('after_vote', 'always', 'after_close');--> statement-breakpoint
CREATE TYPE "public"."resource_progress" AS ENUM('not_started', 'in_progress', 'completed');--> statement-breakpoint
CREATE TYPE "public"."resource_type" AS ENUM('blog', 'paper', 'video', 'course', 'documentation', 'competition', 'opportunity', 'other');--> statement-breakpoint
CREATE TYPE "public"."review_status" AS ENUM('published', 'pending_review');--> statement-breakpoint
CREATE TYPE "public"."task_status" AS ENUM('todo', 'in_progress', 'done');--> statement-breakpoint
CREATE TYPE "public"."user_role" AS ENUM('member', 'junior', 'senior', 'admin', 'attendance_manager');--> statement-breakpoint
CREATE TABLE "announcements" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"body" text NOT NULL,
	"author_id" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_records" (
	"id" text PRIMARY KEY NOT NULL,
	"session_id" text NOT NULL,
	"member_id" text NOT NULL,
	"status" "attendance_status" DEFAULT 'not_marked' NOT NULL,
	"marked_by" text,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "attendance_sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"title" text NOT NULL,
	"session_date" text NOT NULL,
	"group_label" varchar(64) NOT NULL,
	"created_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "audit_logs" (
	"id" text PRIMARY KEY NOT NULL,
	"actor_id" text,
	"action" varchar(64) NOT NULL,
	"entity_type" varchar(64) NOT NULL,
	"entity_id" text,
	"metadata" jsonb,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "coding_profiles" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"platform" varchar(64) NOT NULL,
	"url" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "comments" (
	"id" text PRIMARY KEY NOT NULL,
	"parent_type" "comment_parent_type" NOT NULL,
	"parent_id" text NOT NULL,
	"author_id" text NOT NULL,
	"text" text NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "invitations" (
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
);
--> statement-breakpoint
CREATE TABLE "members" (
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
);
--> statement-breakpoint
CREATE TABLE "poll_options" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"label" text NOT NULL,
	"display_order" integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE "poll_votes" (
	"id" text PRIMARY KEY NOT NULL,
	"poll_id" text NOT NULL,
	"option_id" text NOT NULL,
	"member_id" text NOT NULL,
	"voted_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "polls" (
	"id" text PRIMARY KEY NOT NULL,
	"question" text NOT NULL,
	"description" text,
	"created_by" text,
	"status" "poll_status" DEFAULT 'open' NOT NULL,
	"closes_at" text,
	"results_visibility" "poll_visibility" DEFAULT 'after_vote' NOT NULL,
	"outcome" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "progress_items" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"title" text NOT NULL,
	"status" "resource_progress" DEFAULT 'not_started' NOT NULL,
	"due_date" text,
	"assigned_by" text,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resource_assignments" (
	"id" text PRIMARY KEY NOT NULL,
	"resource_id" text NOT NULL,
	"member_id" text NOT NULL,
	"status" "resource_progress" DEFAULT 'not_started' NOT NULL,
	"assigned_by" text,
	"assigned_at" timestamp with time zone DEFAULT now() NOT NULL,
	"updated_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "resources" (
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
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"id" text PRIMARY KEY NOT NULL,
	"member_id" text NOT NULL,
	"token" text NOT NULL,
	"expires_at" timestamp with time zone NOT NULL,
	"created_at" timestamp with time zone DEFAULT now() NOT NULL,
	CONSTRAINT "sessions_token_unique" UNIQUE("token")
);
--> statement-breakpoint
CREATE TABLE "tasks" (
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
);
--> statement-breakpoint
ALTER TABLE "announcements" ADD CONSTRAINT "announcements_author_id_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_session_id_attendance_sessions_id_fk" FOREIGN KEY ("session_id") REFERENCES "public"."attendance_sessions"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_records" ADD CONSTRAINT "attendance_records_marked_by_members_id_fk" FOREIGN KEY ("marked_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "attendance_sessions" ADD CONSTRAINT "attendance_sessions_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_members_id_fk" FOREIGN KEY ("actor_id") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "coding_profiles" ADD CONSTRAINT "coding_profiles_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "comments" ADD CONSTRAINT "comments_author_id_members_id_fk" FOREIGN KEY ("author_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "invitations" ADD CONSTRAINT "invitations_invited_by_members_id_fk" FOREIGN KEY ("invited_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_options" ADD CONSTRAINT "poll_options_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_poll_id_polls_id_fk" FOREIGN KEY ("poll_id") REFERENCES "public"."polls"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_option_id_poll_options_id_fk" FOREIGN KEY ("option_id") REFERENCES "public"."poll_options"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "poll_votes" ADD CONSTRAINT "poll_votes_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "polls" ADD CONSTRAINT "polls_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_items" ADD CONSTRAINT "progress_items_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "progress_items" ADD CONSTRAINT "progress_items_assigned_by_members_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_resource_id_resources_id_fk" FOREIGN KEY ("resource_id") REFERENCES "public"."resources"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resource_assignments" ADD CONSTRAINT "resource_assignments_assigned_by_members_id_fk" FOREIGN KEY ("assigned_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "resources" ADD CONSTRAINT "resources_submitted_by_members_id_fk" FOREIGN KEY ("submitted_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "sessions" ADD CONSTRAINT "sessions_member_id_members_id_fk" FOREIGN KEY ("member_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_assignee_id_members_id_fk" FOREIGN KEY ("assignee_id") REFERENCES "public"."members"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_created_by_members_id_fk" FOREIGN KEY ("created_by") REFERENCES "public"."members"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_related_resource_id_resources_id_fk" FOREIGN KEY ("related_resource_id") REFERENCES "public"."resources"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "tasks" ADD CONSTRAINT "tasks_related_poll_id_polls_id_fk" FOREIGN KEY ("related_poll_id") REFERENCES "public"."polls"("id") ON DELETE set null ON UPDATE no action;--> statement-breakpoint
CREATE UNIQUE INDEX "uq_session_member_attendance" ON "attendance_records" USING btree ("session_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_session" ON "attendance_records" USING btree ("session_id");--> statement-breakpoint
CREATE INDEX "idx_attendance_member" ON "attendance_records" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_audit_logs_actor" ON "audit_logs" USING btree ("actor_id");--> statement-breakpoint
CREATE INDEX "idx_coding_profiles_member" ON "coding_profiles" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_comments_parent" ON "comments" USING btree ("parent_type","parent_id");--> statement-breakpoint
CREATE INDEX "idx_members_role" ON "members" USING btree ("role");--> statement-breakpoint
CREATE INDEX "idx_members_email" ON "members" USING btree ("email");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_poll_member_vote" ON "poll_votes" USING btree ("poll_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_progress_items_member" ON "progress_items" USING btree ("member_id");--> statement-breakpoint
CREATE UNIQUE INDEX "uq_resource_assignment" ON "resource_assignments" USING btree ("resource_id","member_id");--> statement-breakpoint
CREATE INDEX "idx_resource_assignment_member" ON "resource_assignments" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_resources_category" ON "resources" USING btree ("category");--> statement-breakpoint
CREATE INDEX "idx_resources_review_status" ON "resources" USING btree ("review_status");--> statement-breakpoint
CREATE INDEX "idx_sessions_token" ON "sessions" USING btree ("token");--> statement-breakpoint
CREATE INDEX "idx_sessions_member" ON "sessions" USING btree ("member_id");--> statement-breakpoint
CREATE INDEX "idx_tasks_assignee" ON "tasks" USING btree ("assignee_id");