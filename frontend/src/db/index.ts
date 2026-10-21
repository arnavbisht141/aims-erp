import { PGlite } from "@electric-sql/pglite";
import { drizzle as drizzlePglite } from "drizzle-orm/pglite";
import * as schema from "./schema";
import { MIGRATION_STATEMENTS } from "./init";
import { seedDatabase } from "./seed";
import path from "node:path";
import fs from "node:fs";

interface GlobalDatabaseScope {
  __aims_pglite_client__?: PGlite;
  __aims_db_instance__?: any;
  __aims_db_init_promise__?: Promise<void>;
  __aims_pglite_test_client__?: PGlite;
}

const globalRef = globalThis as unknown as GlobalDatabaseScope;

function resolveDataDir(): string {
  const cwd = process.cwd();
  if (fs.existsSync(path.resolve(cwd, "frontend/.data"))) {
    return path.resolve(cwd, "frontend/.data/aims-pglite");
  }
  return path.resolve(cwd, ".data/aims-pglite");
}

function ensureWritableDirectory(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;
  try {
    fs.chmodSync(dirPath, 0o777);
  } catch (_) {}

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      const fullPath = path.join(dirPath, entry.name);
      try {
        fs.chmodSync(fullPath, entry.isDirectory() ? 0o777 : 0o666);
      } catch (_) {}
      if (entry.isDirectory()) {
        ensureWritableDirectory(fullPath);
      }
    }
  } catch (_) {}
}

function wipeDirectorySafely(dirPath: string) {
  if (!fs.existsSync(dirPath)) return;
  try {
    ensureWritableDirectory(dirPath);
    fs.rmSync(dirPath, { recursive: true, force: true });
  } catch (err) {
    console.warn("[DB Safe Wipe warning]", err);
  }
}

async function runAutoMigrationsAndSeed(client: PGlite, db: any): Promise<void> {
  // Execute DDL statements sequentially
  for (const statement of MIGRATION_STATEMENTS) {
    try {
      await client.exec(statement);
    } catch (err: any) {
      // Ignore "already exists" errors
      const msg = err?.message || "";
      if (!msg.includes("already exists") && !msg.includes("duplicate key")) {
        console.warn("[DB Init warning]", msg);
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

function getDatabase(): any {
  if (globalRef.__aims_db_instance__) {
    return globalRef.__aims_db_instance__;
  }

  // 1. Neon PostgreSQL in cloud (when DATABASE_URL is set)
  const databaseUrl = process.env.DATABASE_URL;
  if (
    databaseUrl &&
    (databaseUrl.startsWith("postgres://") || databaseUrl.startsWith("postgresql://")) &&
    !databaseUrl.includes("localhost")
  ) {
    try {
      const { neon } = require("@neondatabase/serverless");
      const { drizzle } = require("drizzle-orm/neon-http");
      const sql = neon(databaseUrl);
      const instance = drizzle(sql, { schema });
      globalRef.__aims_db_instance__ = instance;
      return instance;
    } catch (err) {
      console.warn("Could not connect to Neon DB, falling back to local PGlite:", err);
    }
  }

  // 2. Local Embedded PostgreSQL (PGlite)
  let pgliteClient: PGlite;
  if (process.env.NODE_ENV === "test" || process.env.VITEST) {
    if (!globalRef.__aims_pglite_test_client__) {
      globalRef.__aims_pglite_test_client__ = new PGlite();
    }
    pgliteClient = globalRef.__aims_pglite_test_client__;
  } else {
    if (!globalRef.__aims_pglite_client__) {
      const dataDir = resolveDataDir();
      try {
        if (!fs.existsSync(dataDir)) {
          fs.mkdirSync(dataDir, { recursive: true });
        }
        ensureWritableDirectory(dataDir);

        const pidFile = path.join(dataDir, "postmaster.pid");
        if (fs.existsSync(pidFile)) {
          try {
            fs.chmodSync(pidFile, 0o666);
            fs.unlinkSync(pidFile);
          } catch (_) {}
        }

        globalRef.__aims_pglite_client__ = new PGlite(dataDir);
      } catch (err: any) {
        console.warn("[DB Init] Failed to initialize disk PGlite, falling back to in-memory:", err?.message);
        globalRef.__aims_pglite_client__ = new PGlite();
      }
    }
    pgliteClient = globalRef.__aims_pglite_client__;
  }

  const instance = drizzlePglite(pgliteClient, { schema });
  globalRef.__aims_db_instance__ = instance;

  if (!globalRef.__aims_db_init_promise__) {
    globalRef.__aims_db_init_promise__ = (async () => {
      try {
        if (pgliteClient.waitReady) {
          try {
            await pgliteClient.waitReady;
          } catch (initErr: any) {
            console.warn("[DB Init] Client waitReady failed, attempting recovery:", initErr?.message);
            const dataDir = resolveDataDir();
            wipeDirectorySafely(dataDir);
            try {
              fs.mkdirSync(dataDir, { recursive: true });
              const freshClient = new PGlite(dataDir);
              await freshClient.waitReady;
              globalRef.__aims_pglite_client__ = freshClient;
              pgliteClient = freshClient;
            } catch (diskFallbackErr: any) {
              console.warn("[DB Init] Disk recreate failed, using in-memory fallback:", diskFallbackErr?.message);
              const memClient = new PGlite();
              await memClient.waitReady;
              globalRef.__aims_pglite_client__ = memClient;
              pgliteClient = memClient;
            }
            const recoveredDb = drizzlePglite(pgliteClient, { schema });
            globalRef.__aims_db_instance__ = recoveredDb;
          }
        }
        await runAutoMigrationsAndSeed(pgliteClient, globalRef.__aims_db_instance__);
      } catch (e) {
        console.error("[DB Init Fatal]", e);
      }
    })();
  }

  return instance;
}

export const db: any = new Proxy({} as any, {
  get(_target, prop) {
    const instance = getDatabase();
    const value = instance[prop];
    return typeof value === "function" ? value.bind(instance) : value;
  },
});

export async function ensureDbReady(): Promise<any> {
  const instance = getDatabase();
  if (globalRef.__aims_db_init_promise__) {
    await globalRef.__aims_db_init_promise__;
  }
  return globalRef.__aims_db_instance__ || instance;
}

