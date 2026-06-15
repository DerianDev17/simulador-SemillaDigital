import { sqlite } from "../src/db/client";
import { runMigrations } from "../src/db/migrations";

runMigrations(sqlite);
console.log("SQLite schema is up to date.");
