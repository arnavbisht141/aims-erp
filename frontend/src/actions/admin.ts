"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireRole } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { UserRole } from "@/types";

export interface AdminStats {
  memberCount: number;
  resourceCount: number;
  openPollsCount: number;
  totalSessionsCount: number;
}

export async function getAdminStats(): Promise<AdminStats> {
  await requireRole(["admin", "senior", "attendance_manager"]);
  await ensureDbReady();

  const members = await db.select().from(schema.members);
  const resources = await db.select().from(schema.resources);
  const polls = await db.select().from(schema.polls).where(eq(schema.polls.status, "open"));
  const sessions = await db.select().from(schema.attendanceSessions);

  return {
    memberCount: members.length,
    resourceCount: resources.length,
    openPollsCount: polls.length,
    totalSessionsCount: sessions.length,
  };
}

export async function getInvitations() {
  await requireRole(["admin"]);
  await ensureDbReady();

  return db.select().from(schema.invitations).orderBy(desc(schema.invitations.createdAt));
}

export async function createInvitation(email: string, role: UserRole) {
  const actor = await requireRole(["admin"]);
  await ensureDbReady();

  const id = `inv-${Date.now()}`;
  const token = `tok-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  await db.insert(schema.invitations).values({
    id,
    email: email.trim().toLowerCase(),
    role,
    token,
    invitedBy: actor.id,
    status: "pending",
  });

  revalidatePath("/admin");
  return { success: true, token };
}
