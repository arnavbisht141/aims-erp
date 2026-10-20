"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { requireAuth, requireLead } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";
import type { AttendanceStatus } from "@/types";

export interface AttendanceSessionSummary {
  id: string;
  title: string;
  sessionDate: string;
  groupLabel: string;
  counts: {
    present: number;
    absent: number;
    notMarked: number;
    total: number;
  };
}

export async function getAttendanceSessions(): Promise<AttendanceSessionSummary[]> {
  await ensureDbReady();
  const sessions = await db
    .select()
    .from(schema.attendanceSessions)
    .orderBy(desc(schema.attendanceSessions.sessionDate));

  const allRecords = await db.select().from(schema.attendanceRecords);

  return sessions.map((s: any) => {
    const sessionRecords = allRecords.filter((r: any) => r.sessionId === s.id);
    let present = 0;
    let absent = 0;
    let notMarked = 0;

    for (const r of sessionRecords) {
      if (r.status === "present") present++;
      else if (r.status === "absent") absent++;
      else notMarked++;
    }

    return {
      id: s.id,
      title: s.title,
      sessionDate: s.sessionDate,
      groupLabel: s.groupLabel,
      counts: {
        present,
        absent,
        notMarked,
        total: sessionRecords.length,
      },
    };
  });
}

export async function getSessionAttendance(sessionId: string) {
  await requireLead();
  await ensureDbReady();

  const session = await db
    .select()
    .from(schema.attendanceSessions)
    .where(eq(schema.attendanceSessions.id, sessionId))
    .limit(1);

  if (session.length === 0) {
    throw new Error("Attendance session not found");
  }

  const records = await db
    .select({
      id: schema.attendanceRecords.id,
      sessionId: schema.attendanceRecords.sessionId,
      memberId: schema.attendanceRecords.memberId,
      status: schema.attendanceRecords.status,
      memberName: schema.members.name,
      memberRole: schema.members.role,
      memberCohort: schema.members.academicYear,
    })
    .from(schema.attendanceRecords)
    .innerJoin(schema.members, eq(schema.attendanceRecords.memberId, schema.members.id))
    .where(eq(schema.attendanceRecords.sessionId, sessionId));

  return {
    session: session[0],
    records,
  };
}

export async function setAttendanceRecord(recordId: string, status: AttendanceStatus) {
  const actor = await requireLead();
  await ensureDbReady();

  await db
    .update(schema.attendanceRecords)
    .set({
      status,
      markedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(schema.attendanceRecords.id, recordId));

  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function bulkMarkPresent(sessionId: string) {
  const actor = await requireLead();
  await ensureDbReady();

  // Snapshot before update for undo capability
  const prev = await db
    .select({ id: schema.attendanceRecords.id, status: schema.attendanceRecords.status })
    .from(schema.attendanceRecords)
    .where(eq(schema.attendanceRecords.sessionId, sessionId));

  await db
    .update(schema.attendanceRecords)
    .set({
      status: "present",
      markedBy: actor.id,
      updatedAt: new Date(),
    })
    .where(eq(schema.attendanceRecords.sessionId, sessionId));

  revalidatePath("/admin/attendance");
  return { success: true, previousRecords: prev };
}

export async function restoreAttendanceRecords(records: { id: string; status: AttendanceStatus }[]) {
  await requireLead();
  await ensureDbReady();

  for (const r of records) {
    await db
      .update(schema.attendanceRecords)
      .set({ status: r.status, updatedAt: new Date() })
      .where(eq(schema.attendanceRecords.id, r.id));
  }

  revalidatePath("/admin/attendance");
  return { success: true };
}

export async function createAttendanceSession(title: string, sessionDate: string, groupLabel: string) {
  const actor = await requireLead();
  await ensureDbReady();

  const sessionId = `s-${Date.now()}`;
  await db.insert(schema.attendanceSessions).values({
    id: sessionId,
    title,
    sessionDate,
    groupLabel,
    createdBy: actor.id,
  });

  // Create attendance record rows for all active members
  const allMembers = await db.select().from(schema.members);
  for (const m of allMembers) {
    await db.insert(schema.attendanceRecords).values({
      id: `rec-${sessionId}-${m.id}`,
      sessionId,
      memberId: m.id,
      status: "not_marked",
    });
  }

  revalidatePath("/admin/attendance");
  return { success: true, sessionId };
}
