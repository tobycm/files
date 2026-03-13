import { t } from "elysia";

// CREATE TABLE IF NOT EXISTS files (
//   id INTEGER PRIMARY KEY AUTOINCREMENT,
//   title TEXT NOT NULL,
//   event_date INTEGER,
//   file_name TEXT NOT NULL,
//   last_modified INTEGER NOT NULL,
//   added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
//   description TEXT
// )

export interface TobyFile {
  id: number;
  title: string;
  event_date?: number;
  file_name: string;
  last_modified: number;
  added_at: string;
  description?: string;
}

export const TDatabaseFields = t.Union([
  t.Literal("id"),
  t.Literal("title"),
  t.Literal("event_date"),
  t.Literal("file_name"),
  t.Literal("last_modified"),
  t.Literal("added_at"),
  t.Literal("description"),
]);
