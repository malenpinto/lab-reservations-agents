import { mkdirSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { DatabaseSync } from "node:sqlite";

export type SqliteDatabase = DatabaseSync;

export function openDatabase(path: string): SqliteDatabase {
  if (path !== ":memory:") mkdirSync(dirname(path), { recursive: true });
  const database = new DatabaseSync(path);
  database.exec(`
    PRAGMA foreign_keys = ON;
    CREATE TABLE IF NOT EXISTS reservations (
      id TEXT PRIMARY KEY,
      equipment_id TEXT NOT NULL CHECK (equipment_id IN ('MIC-01', 'MIC-02', 'OSC-01', 'MUL-01', 'FUE-01')),
      requester TEXT NOT NULL CHECK (length(trim(requester)) > 0),
      start TEXT NOT NULL,
      end TEXT NOT NULL,
      status TEXT NOT NULL CHECK (status IN ('ACTIVE', 'CANCELLED')),
      CHECK (start < end)
    );
    CREATE INDEX IF NOT EXISTS reservations_equipment_status_interval
      ON reservations (equipment_id, status, start, end);
  `);
  return database;
}

export function openPersistentDatabase(): SqliteDatabase {
  const path = fileURLToPath(new URL("../../data/reservations.sqlite", import.meta.url));
  return openDatabase(resolve(path));
}
