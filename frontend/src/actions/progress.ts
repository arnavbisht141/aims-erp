"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";
import { requireAuth, requireLead } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ResourceProgress } from "@/types";

export interface JuniorProgressSummary {
  id: string;
  name: string;
  academicYear: string;
  department: string | null;
  completed: number;
  inProgress: number;
  notStarted: number;
  total: number;
  percent: number;
  items: Array<{
    id: string;
    title: string;
    status: ResourceProgress;
    dueDate: string | null;
  }>;
}

export async function getJuniorsProgress(): Promise<JuniorProgressSummary[]> {
  await requireLead();
  await ensureDbReady();

  const juniors = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.role, "junior"));

  const allProgressItems = await db.select().from(schema.progressItems);
  const allAssignments = await db.select().from(schema.resourceAssignments);
  const allResources = await db.select().from(schema.resources);

  return juniors.map((j: any) => {
    // 1. Direct progress items
    const directItems = allProgressItems
      .filter((p: any) => p.memberId === j.id)
      .map((p: any) => ({
        id: p.id,
        title: p.title,
        status: p.status as ResourceProgress,
        dueDate: p.dueDate,
      }));

    // 2. Assigned library resources
    const resourceItems = allAssignments
      .filter((a: any) => a.memberId === j.id)
      .map((a: any) => {
        const res = allResources.find((r: any) => r.id === a.resourceId);
        return {
          id: a.id,
          title: res ? res.title : "Assigned Resource",
          status: a.status as ResourceProgress,
          dueDate: null,
        };
      });

    const combined = [...directItems, ...resourceItems];

    let completed = 0;
    let inProgress = 0;
    let notStarted = 0;

    for (const item of combined) {
      if (item.status === "completed") completed++;
      else if (item.status === "in_progress") inProgress++;
      else notStarted++;
    }

    const total = combined.length;
    const percent = total === 0 ? 0 : Math.round((completed / total) * 100);

    return {
      id: j.id,
      name: j.name,
      academicYear: j.academicYear,
      department: j.department,
      completed,
      inProgress,
      notStarted,
      total,
      percent,
      items: combined,
    };
  });
}

export async function getMyProgress() {
  const actor = await requireAuth();
  await ensureDbReady();

  const progressItems = await db
    .select()
    .from(schema.progressItems)
    .where(eq(schema.progressItems.memberId, actor.id));

  const assignments = await db
    .select({
      assignment: schema.resourceAssignments,
      resource: schema.resources,
    })
    .from(schema.resourceAssignments)
    .innerJoin(schema.resources, eq(schema.resourceAssignments.resourceId, schema.resources.id))
    .where(eq(schema.resourceAssignments.memberId, actor.id));

  return {
    progressItems,
    assignments,
  };
}

export async function updateProgressItemStatus(itemId: string, status: ResourceProgress) {
  await requireLead();
  await ensureDbReady();

  // Could be in progressItems or resourceAssignments
  if (itemId.startsWith("asgn-")) {
    await db
      .update(schema.resourceAssignments)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.resourceAssignments.id, itemId));
  } else {
    await db
      .update(schema.progressItems)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.progressItems.id, itemId));
  }

  revalidatePath("/admin/progress");
  return { success: true };
}

export async function addProgressItem(memberId: string, title: string, dueDate?: string) {
  const actor = await requireLead();
  await ensureDbReady();

  const id = `prog-${Date.now()}`;
  await db.insert(schema.progressItems).values({
    id,
    memberId,
    title: title.trim(),
    status: "not_started",
    dueDate: dueDate?.trim() || null,
    assignedBy: actor.id,
  });

  revalidatePath("/admin/progress");
  return { success: true, id };
}
