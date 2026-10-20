import { describe, expect, it } from "vitest";
import { db, ensureDbReady } from "@/db";
import * as schema from "@/db/schema";
import { eq } from "drizzle-orm";

describe("local database with PGlite", () => {
  it("initializes tables and seeds initial data", async () => {
    await ensureDbReady();
    const members = await db.select().from(schema.members);
    expect(members.length).toBeGreaterThan(0);

    // Verify key personas exist with proper roles
    const admin = await db.query.members?.findFirst({
      where: eq(schema.members.id, "m01"),
    }) || members.find((m: any) => m.id === "m01");
    expect(admin).toBeDefined();
    expect(admin?.role).toBe("admin");

    const senior = members.find((m: any) => m.id === "m02");
    expect(senior).toBeDefined();
    expect(senior?.role).toBe("senior");

    const junior = members.find((m: any) => m.id === "m06");
    expect(junior).toBeDefined();
    expect(junior?.role).toBe("junior");

    // Verify resources seeded
    const resources = await db.select().from(schema.resources);
    expect(resources.length).toBeGreaterThan(0);

    // Verify attendance sessions seeded
    const sessions = await db.select().from(schema.attendanceSessions);
    expect(sessions.length).toBeGreaterThan(0);

    // Verify polls seeded
    const polls = await db.select().from(schema.polls);
    expect(polls.length).toBeGreaterThan(0);
  });
});
