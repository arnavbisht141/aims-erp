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
    const raw = (emailInput || "").trim();
    if (!raw) {
      return { success: false, error: "Please enter your email address." };
    }
    if (!passwordInput) {
      return { success: false, error: "Please enter your password." };
    }

    const email = raw.includes("@") ? raw : `${raw}@aims.example`;

    let members = await db
      .select()
      .from(schema.members)
      .where(ilike(schema.members.email, email))
      .limit(1);

    if (members.length === 0 && !raw.includes("@")) {
      // Also try matching by id (e.g. m01)
      members = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, raw.toLowerCase()))
        .limit(1);
    }

    if (members.length === 0) {
      return {
        success: false,
        error: "No society account found for this email. Check docs/SEEDED_CREDENTIALS.md for test logins.",
      };
    }

    const member = members[0];

    // For local database, default password is "aims2026" or matches passwordHash
    if (passwordInput !== member.passwordHash && passwordInput !== "aims2026") {
      return { success: false, error: "Invalid password. (Default password for seeded accounts is: aims2026)" };
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
    console.error("[Login Action Error]", err, "Cause:", err?.cause);
    const detail = err?.cause?.message || err?.message || "Failed to sign in.";
    return { success: false, error: detail };
  }
}

/** Signs in via Google / Gmail Single Sign-On (Clerk-compatible prototype bridge) */
export async function googleSsoLoginAction(
  googleEmail?: string
): Promise<AuthActionResult<AuthUser & { ssoProvider?: string }>> {
  try {
    await ensureDbReady();
    let targetMember: typeof schema.members.$inferSelect | undefined;

    if (googleEmail && googleEmail.trim()) {
      const email = googleEmail.trim();
      const prefix = email.split("@")[0].toLowerCase();

      // Try exact email match first
      const exact = await db
        .select()
        .from(schema.members)
        .where(ilike(schema.members.email, email))
        .limit(1);

      if (exact.length > 0) {
        targetMember = exact[0];
      } else {
        // Try matching prefix (e.g. riya.malhotra@gmail.com matches riya.malhotra@aims.example)
        const prefixMatches = await db
          .select()
          .from(schema.members)
          .where(ilike(schema.members.email, `${prefix}@%`))
          .limit(1);

        if (prefixMatches.length > 0) {
          targetMember = prefixMatches[0];
        }
      }
    }

    // Default to Administrator persona (Riya Malhotra) or first member if no specific match
    if (!targetMember) {
      const admins = await db
        .select()
        .from(schema.members)
        .where(eq(schema.members.id, "m01"))
        .limit(1);

      if (admins.length > 0) {
        targetMember = admins[0];
      } else {
        const first = await db.select().from(schema.members).limit(1);
        if (first.length > 0) targetMember = first[0];
      }
    }

    if (!targetMember) {
      return { success: false, error: "No society accounts available to bind Google SSO." };
    }

    await createSession(targetMember.id);
    try {
      revalidatePath("/", "layout");
    } catch (_) {}

    return {
      success: true,
      data: {
        id: targetMember.id,
        name: targetMember.name,
        email: targetMember.email,
        role: targetMember.role as any,
        membershipStatus: targetMember.membershipStatus,
        academicYear: targetMember.academicYear,
        department: targetMember.department,
        bio: targetMember.bio,
        avatarUrl: targetMember.avatarUrl,
        skills: targetMember.skills,
        interests: targetMember.interests,
        ssoProvider: "google",
      },
    };
  } catch (err: any) {
    console.error("[Google SSO Action Error]", err);
    return { success: false, error: err?.message || "Google SSO authentication failed." };
  }
}

export interface DemoAccountSummary {
  id: string;
  name: string;
  email: string;
  role: string;
  academicYear: string;
  department: string | null;
}

/** Returns seeded accounts for the credentials reference drawer */
export async function getDemoAccountsAction(): Promise<DemoAccountSummary[]> {
  try {
    await ensureDbReady();
    return await db
      .select({
        id: schema.members.id,
        name: schema.members.name,
        email: schema.members.email,
        role: schema.members.role,
        academicYear: schema.members.academicYear,
        department: schema.members.department,
      })
      .from(schema.members)
      .orderBy(schema.members.id);
  } catch (err) {
    console.error("[Get Demo Accounts Error]", err);
    return [];
  }
}

/** 1-click quick demo login for testing various roles (kept for programmatic testing) */
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
    console.error("[Quick Demo Login Error]", err, "Cause:", err?.cause);
    const detail = err?.cause?.message || err?.message || "Quick sign-in failed.";
    return { success: false, error: detail };
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
