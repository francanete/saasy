import { drizzle } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });

export const db = drizzle(pool, {
  schema,
  logger: process.env.DRIZZLE_LOG_QUERIES === "true",
});

export type Database = typeof db;

// Re-export schema for convenience
export * from "./schema";
