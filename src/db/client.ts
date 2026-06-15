import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { runMigrations } from "./migrations";
import * as schema from "./schema";

const dbPath = resolve(process.env.DATABASE_URL ?? "data/app.db");
mkdirSync(dirname(dbPath), { recursive: true });

export const sqlite = new Database(dbPath);
sqlite.pragma("foreign_keys = ON");
runMigrations(sqlite);

export const db = drizzle(sqlite, { schema });

export type AppDb = typeof db;
