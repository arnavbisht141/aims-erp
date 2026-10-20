import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { MIGRATION_STATEMENTS } from "./init";
import { seedDatabase } from "./seed";
import path from "node:path";
import fs from "node:fs";

let dbInstance: any = null;
let initializedPromise: Promise<void> | null = null;

async function runAutoMigrationsAndSeed(client: PGlite, db: any) {
  if (client.waitReady) {
    try {
      await client.waitReady;
    } catch (err: any) {
      console.warn("[DB Init] Recreating corrupted PGlite database directory:", err.message);
      const dataDir = path.resolve(process.cwd(), ".data/aims-pglite");
      fs.rmSync(dataDir, { recursive: true, force: true });
      fs.mkdirSync(dataDir, { recursive: true });
      const globalRef = globalThis as unknown as { __aims_pglite_client__?: PGlite };
      const freshClient = new PGlite(dataDir);
      globalRef.__aims_pglite_client__ = freshClient;
      await freshClient.waitReady;
      client = freshClient;
      dbInstance = drizzlePglite(freshClient, { schema });
      db = dbInstance;
    }
  }

  // Execute DDL statements sequentially
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await client.exec(statement);
    } catch (err: any) {
      // Ignore "already exists" errors
      if (!err.message?.includes("already exists")) {
        console.warn("[DB Init warning]", err.message);
      }
    }
  }

  // Seed sample data if database is empty
  try {
    await seedDatabase(db);
  } catch (err: any) {
    console.error("[DB Seed error]", err);
  }
}

function getDatabase() {
  if (dbInstance) return dbInstance;

  // 1. Neon PostgreSQL in cloud (when DATABASE_URL is set)
  const databaseUrl = process.env.DATABASE_URL;
  if (databaseUrl && (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) && !databaseUrl.includes("localhost")) {
    try {
      const { neon } = require("@neondatabase/serverless");
      const { drizzle } = require("drizzle-orm/neon-http");
      const sql = neon(databaseUrl);
      dbInstance = drizzle(sql, { schema });
      return dbInstance;
    } catch (err) {
      console.warn("Could not connect to Neon DB, falling back to local PGlite:", err);
    }
  }

  // 2. Local Embedded PostgreSQL (PGlite)
  let pgliteClient: PGlite;
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    const globalRef = globalThis as unknown as { __aims_pglite_test_client__?: PGlite };
    if (!globalRef.__aims_pglite_test_client__) {
      globalRef.__aims_pglite_test_client__ = new PGlite();
    }
    pgliteClient = globalRef.__aims_pglite_test_client__;
  } else {
    const dataDir = path.resolve(process.cwd(), ".data/aims-pglite");
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    const pidFile = path.join(dataDir, "postmaster.pid");
    if (fs.existsSync(pidFile)) {
      try {
        fs.unlinkSync(pidFile);
      } catch (_) {}
    }

    if (process.env.NODE_ENV === "production") {
      pgliteClient = new PGlite(dataDir);
    } else {
      const globalRef = globalThis as unknown as { __aims_pglite_client__?: PGlite };
      if (!globalRef.__aims_pglite_client__) {
        globalRef.__aims_pglite_client__ = new PGlite(dataDir);
      }
      pgliteClient = globalRef.__aims_pglite_client__;
    }
  }

  dbInstance = drizzlePglite(pgliteClient, { schema });

  if (!initializedPromise) {
    initializedPromise = runAutoMigrationsAndSeed(pgliteClient, dbInstance);
  }

  return dbInstance;
}

export let db = getDatabase();

export async function ensureDbReady() {
  getDatabase();
  if (initializedPromise) {
    await initializedPromise;
  }
  return dbInstance;
}
