"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentMember, requireAuth, requireLead } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { ResourceProgress, ResourceType } from "@/types";

export async function getResources() {
  await ensureDbReady();
  const currentMember = await getCurrentMember();

  const allResources = await db
    .select({
      resource: schema.resources,
      submitterName: schema.members.name,
    })
    .from(schema.resources)
    .leftJoin(schema.members, eq(schema.resources.submittedBy, schema.members.id))
    .orderBy(desc(schema.resources.createdAt));

  const allAssignments = await db.select().from(schema.resourceAssignments);

  // If user is lead or admin, they see published + pending
  // Regular members see published + their own pending submissions
  const isLeadUser = currentMember && (currentMember.role === "admin" || currentMember.role === "senior");

  const filtered = allResources.filter(({ resource }: any) => {
    if (resource.reviewStatus === "published") return true;
    if (isLeadUser) return true;
    return currentMember && resource.submittedBy === currentMember.id;
  });

  return filtered.map(({ resource, submitterName }: any) => {
    const userAssignment = currentMember
      ? allAssignments.find(
          (a: any) => a.resourceId === resource.id && a.memberId === currentMember.id
        )
      : null;

    const assignedCount = allAssignments.filter((a: any) => a.resourceId === resource.id).length;

    return {
      ...resource,
      submitterName: submitterName || "AIMS Lead",
      userProgress: userAssignment ? (userAssignment.status as ResourceProgress) : null,
      assignmentId: userAssignment ? userAssignment.id : null,
      assignedCount,
    };
  });
}

export async function getResourceById(id: string) {
  await ensureDbReady();
  const currentMember = await getCurrentMember();

  const res = await db
    .select({
      resource: schema.resources,
      submitterName: schema.members.name,
    })
    .from(schema.resources)
    .leftJoin(schema.members, eq(schema.resources.submittedBy, schema.members.id))
    .where(eq(schema.resources.id, id))
    .limit(1);

  if (res.length === 0) return null;

  const r = res[0];
  const assignments = await db
    .select({
      id: schema.resourceAssignments.id,
      memberId: schema.resourceAssignments.memberId,
      status: schema.resourceAssignments.status,
      memberName: schema.members.name,
    })
    .from(schema.resourceAssignments)
    .innerJoin(schema.members, eq(schema.resourceAssignments.memberId, schema.members.id))
    .where(eq(schema.resourceAssignments.resourceId, id));

  const myAssignment = currentMember
    ? assignments.find((a: any) => a.memberId === currentMember.id)
    : null;

  return {
    ...r.resource,
    submitterName: r.submitterName || "AIMS Lead",
    assignments,
    myProgress: myAssignment ? (myAssignment.status as ResourceProgress) : null,
    myAssignmentId: myAssignment ? myAssignment.id : null,
  };
}

export async function suggestResource(input: {
  title: string;
  url: string;
  type: ResourceType;
  category: string;
  description: string;
  note?: string;
}) {
  const actor = await requireAuth();
  await ensureDbReady();

  const id = `res-${Date.now()}`;
  const isLeadUser = actor.role === "admin" || actor.role === "senior";

  await db.insert(schema.resources).values({
    id,
    title: input.title.trim(),
    url: input.url.trim(),
    type: input.type,
    category: input.category.trim(),
    description: input.description.trim(),
    note: input.note?.trim() || null,
    submittedBy: actor.id,
    reviewStatus: isLeadUser ? "published" : "pending_review",
  });

  revalidatePath("/resources");
  return { success: true, id };
}

export async function reviewResource(resourceId: string, decision: "publish" | "reject") {
  await requireLead();
  await ensureDbReady();

  if (decision === "publish") {
    await db
      .update(schema.resources)
      .set({ reviewStatus: "published", updatedAt: new Date() })
      .where(eq(schema.resources.id, resourceId));
  } else {
    await db.delete(schema.resources).where(eq(schema.resources.id, resourceId));
  }

  revalidatePath("/resources");
  return { success: true };
}

export async function assignResource(resourceId: string, memberIds: string[]) {
  const actor = await requireLead();
  await ensureDbReady();

  for (const memberId of memberIds) {
    const existing = await db
      .select()
      .from(schema.resourceAssignments)
      .where(eq(schema.resourceAssignments.resourceId, resourceId))
      .where(eq(schema.resourceAssignments.memberId, memberId));

    if (existing.length === 0) {
      await db.insert(schema.resourceAssignments).values({
        id: `asgn-${Date.now()}-${memberId}`,
        resourceId,
        memberId,
        status: "not_started",
        assignedBy: actor.id,
      });
    }
  }

  revalidatePath("/resources");
  revalidatePath(`/resources/${resourceId}`);
  return { success: true };
}

export async function updateResourceProgress(resourceId: string, status: ResourceProgress) {
  const actor = await requireAuth();
  await ensureDbReady();

  const existing = await db
    .select()
    .from(schema.resourceAssignments)
    .where(eq(schema.resourceAssignments.resourceId, resourceId))
    .where(eq(schema.resourceAssignments.memberId, actor.id));

  if (existing.length === 0) {
    // If not formally assigned yet, self-assign to track personal progress
    await db.insert(schema.resourceAssignments).values({
      id: `asgn-${Date.now()}-${actor.id}`,
      resourceId,
      memberId: actor.id,
      status,
      assignedBy: actor.id,
    });
  } else {
    await db
      .update(schema.resourceAssignments)
      .set({ status, updatedAt: new Date() })
      .where(eq(schema.resourceAssignments.id, existing[0].id));
  }

  revalidatePath("/resources");
  revalidatePath(`/resources/${resourceId}`);
  revalidatePath("/profile");
  return { success: true };
}
