"use server";

import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, ilike } from "drizzle-orm";
import { createSession, destroySession, getCurrentMember, type AuthUser } from "./session";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export interface AuthActionResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
}

/** Signs in a member using email and password */
export async function loginAction(
  emailInput: string,
  passwordInput: string
): Promise<AuthActionResult<AuthUser>> {
  try {
    await ensureDbReady();
    const email = emailInput.trim();
    if (!email) {
      return { success: false, error: "Please enter your email address." };
    }
    if (!passwordInput) {
      return { success: false, error: "Please enter your password." };
    }

    const members = await db
      .select()
      .from(schema.members)
      .where(ilike(schema.members.email, email))
      .limit(1);

    if (members.length === 0) {
      return { success: false, error: "No society account found with that email." };
    }

    const member = members[0];

    // For local database, default password is "aims2026" or matches passwordHash
    if (passwordInput !== member.passwordHash && passwordInput !== "aims2026") {
      return { success: false, error: "Invalid password. (Default demo password is: aims2026)" };
    }

    await createSession(member.id);
    try {
      revalidatePath("/", "layout");
    } catch (_) {}

    return {
      success: true,
      data: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role as any,
        membershipStatus: member.membershipStatus,
        academicYear: member.academicYear,
        department: member.department,
        bio: member.bio,
        avatarUrl: member.avatarUrl,
        skills: member.skills,
        interests: member.interests,
      },
    };
  } catch (err: any) {
    console.error("[Login Action Error]", err);
    return { success: false, error: err.message || "Failed to sign in." };
  }
}

/** 1-click quick demo login for testing various roles */
export async function quickDemoLoginAction(memberId: string): Promise<AuthActionResult<AuthUser>> {
  try {
    await ensureDbReady();
    const members = await db
      .select()
      .from(schema.members)
      .where(eq(schema.members.id, memberId))
      .limit(1);

    if (members.length === 0) {
      return { success: false, error: "Demo persona not found." };
    }

    const member = members[0];
    await createSession(member.id);
    try {
      revalidatePath("/", "layout");
    } catch (_) {}

    return {
      success: true,
      data: {
        id: member.id,
        name: member.name,
        email: member.email,
        role: member.role as any,
        membershipStatus: member.membershipStatus,
        academicYear: member.academicYear,
        department: member.department,
        bio: member.bio,
        avatarUrl: member.avatarUrl,
        skills: member.skills,
        interests: member.interests,
      },
    };
  } catch (err: any) {
    console.error("[Quick Demo Login Error]", err);
    return { success: false, error: err.message || "Quick sign-in failed." };
  }
}

/** Signs out the current member and clears the session */
export async function logoutAction(): Promise<void> {
  await destroySession();
  revalidatePath("/", "layout");
  redirect("/sign-in");
}

/** Checks current session from client/server components */
export async function getSessionAction(): Promise<AuthUser | null> {
  return getCurrentMember();
}
