import { describe, expect, it } from "vitest";
import {
  canAccessAdministration,
  canManageAttendance,
  canManageProgress,
  canManagePolls,
  canReviewResources,
  canEditMemberProfile,
  canViewIndividualAttendance,
  canViewIndividualProgress,
  isLead,
} from "@/lib/permissions";
import { loginAction, googleSsoLoginAction, getDemoAccountsAction } from "@/lib/auth/actions";
import { ensureDbReady } from "@/db";

describe("Rule-Based Access Control (RBAC)", () => {
  it("enforces least-privilege for attendance_manager", () => {
    // Attendance manager CAN access admin area and mark attendance
    expect(canAccessAdministration("attendance_manager")).toBe(true);
    expect(canManageAttendance("attendance_manager")).toBe(true);
    expect(isLead("attendance_manager")).toBe(false);

    // Attendance manager CANNOT manage junior progress, polls, or review resources
    expect(canManageProgress("attendance_manager")).toBe(false);
    expect(canManagePolls("attendance_manager")).toBe(false);
    expect(canReviewResources("attendance_manager")).toBe(false);
  });

  it("permits seniors and admins to manage workflows", () => {
    expect(canAccessAdministration("senior")).toBe(true);
    expect(canAccessAdministration("admin")).toBe(true);
    expect(canManageAttendance("senior")).toBe(true);
    expect(canManageAttendance("admin")).toBe(true);
    expect(canManageProgress("senior")).toBe(true);
    expect(canManageProgress("admin")).toBe(true);
    expect(canManagePolls("senior")).toBe(true);
    expect(canManagePolls("admin")).toBe(true);
  });

  it("restricts juniors and members from administrative functions", () => {
    expect(canAccessAdministration("junior")).toBe(false);
    expect(canAccessAdministration("member")).toBe(false);
    expect(canManageAttendance("junior")).toBe(false);
    expect(canManageAttendance("member")).toBe(false);
    expect(canManageProgress("junior")).toBe(false);
    expect(canManageProgress("member")).toBe(false);
  });

  it("enforces strict privacy boundaries on individual attendance and progress", () => {
    // Member cannot view another member's attendance
    expect(canViewIndividualAttendance("member", "m04", "m06")).toBe(false);
    expect(canViewIndividualAttendance("junior", "m06", "m07")).toBe(false);

    // Member CAN view their own attendance
    expect(canViewIndividualAttendance("member", "m04", "m04")).toBe(true);
    expect(canViewIndividualAttendance("junior", "m06", "m06")).toBe(true);

    // Leads CAN view individual attendance for workshops
    expect(canViewIndividualAttendance("senior", "m02", "m06")).toBe(true);
    expect(canViewIndividualAttendance("attendance_manager", "m13", "m06")).toBe(true);
    expect(canViewIndividualAttendance("admin", "m01", "m06")).toBe(true);

    // Junior progress privacy: only self or lead
    expect(canViewIndividualProgress("junior", "m06", "m06")).toBe(true);
    expect(canViewIndividualProgress("junior", "m06", "m08")).toBe(false);
    expect(canViewIndividualProgress("member", "m04", "m06")).toBe(false);
    expect(canViewIndividualProgress("senior", "m02", "m06")).toBe(true);
    expect(canViewIndividualProgress("admin", "m01", "m06")).toBe(true);
  });

  it("enforces profile edit boundaries", () => {
    expect(canEditMemberProfile("m06", "m06")).toBe(true);
    expect(canEditMemberProfile("m06", "m07")).toBe(false);
  });
});

describe("Authentication & Login Action", () => {
  it("authenticates valid credentials against the local database", async () => {
    await ensureDbReady();

    // Valid admin login with full email
    const adminRes = await loginAction("riya.malhotra@aims.example", "aims2026");
    expect(adminRes.success).toBe(true);
    expect(adminRes.data?.role).toBe("admin");
    expect(adminRes.data?.name).toBe("Riya Malhotra");

    // Shorthand username without domain (e.g. "riya.malhotra")
    const shorthandRes = await loginAction("riya.malhotra", "aims2026");
    expect(shorthandRes.success).toBe(true);
    expect(shorthandRes.data?.id).toBe("m01");

    // Valid junior login
    const juniorRes = await loginAction("arjun.nair@aims.example", "aims2026");
    expect(juniorRes.success).toBe(true);
    expect(juniorRes.data?.role).toBe("junior");

    // Invalid password
    const failRes = await loginAction("riya.malhotra@aims.example", "wrongpassword");
    expect(failRes.success).toBe(false);
    expect(failRes.error).toContain("Invalid password");

    // Non-existent email
    const nonExistent = await loginAction("unknown@dtu.ac.in", "aims2026");
    expect(nonExistent.success).toBe(false);
    expect(nonExistent.error).toContain("No society account found");
  });

  it("authenticates Google / Gmail SSO with Clerk compatibility", async () => {
    await ensureDbReady();

    // Default SSO signs in as primary administrator
    const defaultSso = await googleSsoLoginAction();
    expect(defaultSso.success).toBe(true);
    expect(defaultSso.data?.role).toBe("admin");
    expect(defaultSso.data?.ssoProvider).toBe("google");

    // Matching Gmail address prefix (e.g. kabir.sethi@gmail.com)
    const leadSso = await googleSsoLoginAction("kabir.sethi@gmail.com");
    expect(leadSso.success).toBe(true);
    expect(leadSso.data?.id).toBe("m02");
    expect(leadSso.data?.name).toBe("Kabir Sethi");
  });

  it("retrieves seeded accounts for developer reference", async () => {
    await ensureDbReady();
    const accounts = await getDemoAccountsAction();
    expect(accounts.length).toBeGreaterThanOrEqual(13);
    expect(accounts.some((a: { email: string }) => a.email === "riya.malhotra@aims.example")).toBe(true);
  });
});

