"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, desc } from "drizzle-orm";
import { getCurrentMember, requireAuth } from "@/lib/auth/session";
import { revalidatePath } from "next/cache";

export interface MemberDetail {
  id: string;
  name: string;
  email: string;
  role: string;
  membershipStatus: string;
  academicYear: string;
  department: string | null;
  bio: string;
  avatarUrl: string | null;
  skills: string[];
  interests: string[];
  codingProfiles: Array<{ platform: string; url: string }>;
}

export async function getMembers(): Promise<MemberDetail[]> {
  await ensureDbReady();
  const members = await db
    .select()
    .from(schema.members)
    .orderBy(schema.members.name);

  const profiles = await db.select().from(schema.codingProfiles);

  return members.map((m: any) => ({
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    membershipStatus: m.membershipStatus,
    academicYear: m.academicYear,
    department: m.department,
    bio: m.bio,
    avatarUrl: m.avatarUrl,
    skills: m.skills || [],
    interests: m.interests || [],
    codingProfiles: profiles
      .filter((p: any) => p.memberId === m.id)
      .map((p: any) => ({ platform: p.platform, url: p.url })),
  }));
}

export async function getMemberById(id: string): Promise<MemberDetail | null> {
  await ensureDbReady();
  const members = await db
    .select()
    .from(schema.members)
    .where(eq(schema.members.id, id))
    .limit(1);

  if (members.length === 0) return null;

  const m = members[0];
  const profiles = await db
    .select()
    .from(schema.codingProfiles)
    .where(eq(schema.codingProfiles.memberId, id));

  return {
    id: m.id,
    name: m.name,
    email: m.email,
    role: m.role,
    membershipStatus: m.membershipStatus,
    academicYear: m.academicYear,
    department: m.department,
    bio: m.bio,
    avatarUrl: m.avatarUrl,
    skills: m.skills || [],
    interests: m.interests || [],
    codingProfiles: profiles.map((p: any) => ({ platform: p.platform, url: p.url })),
  };
}

export async function updateProfile(
  targetMemberId: string,
  changes: {
    name: string;
    bio: string;
    skills: string[];
    interests: string[];
    codingProfiles: Array<{ label: string; url: string }>;
  }
) {
  const actor = await requireAuth();
  await ensureDbReady();

  // Non-admins can ONLY edit their own profile
  if (actor.id !== targetMemberId && actor.role !== "admin") {
    throw new Error("FORBIDDEN: You cannot edit another member's profile.");
  }

  await db
    .update(schema.members)
    .set({
      name: changes.name.trim(),
      bio: changes.bio.trim(),
      skills: changes.skills,
      interests: changes.interests,
      updatedAt: new Date(),
    })
    .where(eq(schema.members.id, targetMemberId));

  // Update coding profiles
  await db.delete(schema.codingProfiles).where(eq(schema.codingProfiles.memberId, targetMemberId));
  for (const cp of changes.codingProfiles) {
    if (cp.label.trim() && cp.url.trim()) {
      await db.insert(schema.codingProfiles).values({
        id: `${targetMemberId}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        memberId: targetMemberId,
        platform: cp.label.trim(),
        url: cp.url.trim(),
      });
    }
  }

  revalidatePath("/profile");
  revalidatePath("/people");
  revalidatePath(`/people/${targetMemberId}`);
  return { success: true };
}
