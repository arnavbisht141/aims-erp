import { cookies } from "next/headers";
import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq, and, gt } from "drizzle-orm";
import type { UserRole } from "@/types";
import crypto from "node:crypto";

const SESSION_COOKIE_NAME = "aims_session_token";
const SESSION_MAX_AGE_DAYS = 30;

export interface AuthUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  membershipStatus: string;
  academicYear: string;
  department: string | null;
  bio: string;
  avatarUrl: string | null;
  skills: string[];
  interests: string[];
}

/** Creates a secure cryptographically random session token */
export function generateToken(): string {
  return crypto.randomBytes(32).toString("hex");
}

/** Creates a database session and sets an HTTP-only cookie */
export async function createSession(memberId: string): Promise<string> {
  await ensureDbReady();
  const token = generateToken();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + SESSION_MAX_AGE_DAYS);

  const sessionId = `sess-${Date.now()}-${crypto.randomBytes(4).toString("hex")}`;

  await db.insert(schema.sessions).values({
    id: sessionId,
    memberId,
    token,
    expiresAt,
  });

  try {
    const cookieStore = await cookies();
    cookieStore.set(SESSION_COOKIE_NAME, token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "lax",
      path: "/",
      expires: expiresAt,
    });
  } catch (_e) {
    // Outside of request scope (e.g. in test environment), cookie is skipped
  }

  return token;
}

/** Retrieves the currently authenticated member from the session cookie */
export async function getCurrentMember(): Promise<AuthUser | null> {
  try {
    await ensureDbReady();
    const cookieStore = await cookies();
    const token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
    if (!token) return null;

    const now = new Date();
    const sessionRecord = await db
      .select({
        session: schema.sessions,
        member: schema.members,
      })
      .from(schema.sessions)
      .innerJoin(schema.members, eq(schema.sessions.memberId, schema.members.id))
      .where(
        and(
          eq(schema.sessions.token, token),
          gt(schema.sessions.expiresAt, now)
        )
      )
      .limit(1);

    if (sessionRecord.length === 0) {
      return null;
    }

    const m = sessionRecord[0].member;
    return {
      id: m.id,
      name: m.name,
      email: m.email,
      role: m.role as UserRole,
      membershipStatus: m.membershipStatus,
      academicYear: m.academicYear,
      department: m.department,
      bio: m.bio,
      avatarUrl: m.avatarUrl,
      skills: m.skills,
      interests: m.interests,
    };
  } catch (err) {
    console.error("[Auth] Error fetching current member:", err);
    return null;
  }
}

/** Clears the session cookie and invalidates the session record in DB */
export async function destroySession(): Promise<void> {
  try {
    await ensureDbReady();
    let token: string | undefined;
    try {
      const cookieStore = await cookies();
      token = cookieStore.get(SESSION_COOKIE_NAME)?.value;
      cookieStore.delete(SESSION_COOKIE_NAME);
    } catch (_e) {}

    if (token) {
      await db.delete(schema.sessions).where(eq(schema.sessions.token, token));
    }
  } catch (err) {
    console.error("[Auth] Error destroying session:", err);
  }
}

/** Server-side assertion requiring authentication */
export async function requireAuth(): Promise<AuthUser> {
  const member = await getCurrentMember();
  if (!member) {
    throw new Error("UNAUTHORIZED: Please sign in to access this resource.");
  }
  return member;
}

/** Server-side assertion requiring specific roles */
export async function requireRole(allowedRoles: UserRole[]): Promise<AuthUser> {
  const member = await requireAuth();
  if (!allowedRoles.includes(member.role)) {
    throw new Error(`FORBIDDEN: Access restricted. Requires one of [${allowedRoles.join(", ")}].`);
  }
  return member;
}

/** Server-side assertion requiring leadership or administrative access */
export async function requireLead(): Promise<AuthUser> {
  return requireRole(["senior", "admin", "attendance_manager"]);
}
