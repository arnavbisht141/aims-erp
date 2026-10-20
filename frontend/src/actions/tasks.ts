"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentMember, requireAuth, requireLead } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { TaskStatus } from "@/types";

export interface TaskRecord {
  id: string;
  title: string;
  description: string;
  status: TaskStatus;
  dueDate: string | null;
  assigneeId: string;
  assigneeName: string;
  createdById: string | null;
  creatorName: string;
  relatedResourceId: string | null;
  relatedPollId: string | null;
  createdAt: Date;
}

export async function getTasks(): Promise<TaskRecord[]> {
  await ensureDbReady();
  const currentMember = await getCurrentMember();

  const allTasks = await db
    .select({
      task: schema.tasks,
      assigneeName: schema.members.name,
    })
    .from(schema.tasks)
    .innerJoin(schema.members, eq(schema.tasks.assigneeId, schema.members.id))
    .orderBy(desc(schema.tasks.createdAt));

  const allMembers = await db.select().from(schema.members);

  return allTasks.map(({ task, assigneeName }: any) => {
    const creator = allMembers.find((m: any) => m.id === task.createdBy);
    return {
      id: task.id,
      title: task.title,
      description: task.description,
      status: task.status as TaskStatus,
      dueDate: task.dueDate,
      assigneeId: task.assigneeId,
      assigneeName,
      createdById: task.createdBy,
      creatorName: creator ? creator.name : "AIMS Lead",
      relatedResourceId: task.relatedResourceId,
      relatedPollId: task.relatedPollId,
      createdAt: task.createdAt,
    };
  });
}

export async function createTask(input: {
  title: string;
  description: string;
  assigneeId: string;
  dueDate?: string;
  relatedResourceId?: string;
}) {
  const actor = await requireLead();
  await ensureDbReady();

  if (!input.title.trim()) {
    throw new Error("Task title is required.");
  }
  if (!input.assigneeId) {
    throw new Error("Please choose an assignee.");
  }

  const taskId = `t-${Date.now()}`;
  await db.insert(schema.tasks).values({
    id: taskId,
    title: input.title.trim(),
    description: input.description.trim(),
    assigneeId: input.assigneeId,
    createdBy: actor.id,
    status: "todo",
    dueDate: input.dueDate?.trim() || null,
    relatedResourceId: input.relatedResourceId || null,
  });

  revalidatePath("/tasks");
  return { success: true, taskId };
}

export async function updateTaskStatus(taskId: string, status: TaskStatus) {
  const actor = await requireAuth();
  await ensureDbReady();

  // Assignee, creator, or lead can update status
  const task = await db
    .select()
    .from(schema.tasks)
    .where(eq(schema.tasks.id, taskId))
    .limit(1);

  if (task.length === 0) {
    throw new Error("Task not found.");
  }

  const t = task[0];
  const isLead = actor.role === "admin" || actor.role === "senior";
  if (t.assigneeId !== actor.id && t.createdBy !== actor.id && !isLead) {
    throw new Error("FORBIDDEN: You do not have permission to update this task.");
  }

  await db
    .update(schema.tasks)
    .set({ status, updatedAt: new Date() })
    .where(eq(schema.tasks.id, taskId));

  revalidatePath("/tasks");
  return { success: true };
}

export async function updateTaskDetails(
  taskId: string,
  changes: {
    title?: string;
    description?: string;
    assigneeId?: string;
    dueDate?: string;
    relatedResourceId?: string;
  }
) {
  const actor = await requireLead();
  await ensureDbReady();

  await db
    .update(schema.tasks)
    .set({ ...changes, updatedAt: new Date() })
    .where(eq(schema.tasks.id, taskId));

  revalidatePath("/tasks");
  return { success: true };
}
