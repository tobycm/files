import Database from "bun:sqlite";
import { databasePath } from "./utils";

export default async function setupDatabase() {
  console.log("Setting up database...");

  const db = new Database(databasePath, { create: true });

  db.run(`
    CREATE TABLE IF NOT EXISTS files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      event_date INTEGER,
      file_name TEXT NOT NULL,
      last_modified INTEGER NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    )
  `);

  db.run(`
    CREATE TABLE IF NOT EXISTS pending_files (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      event_date INTEGER,
      file_name TEXT NOT NULL,
      last_modified INTEGER NOT NULL,
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      description TEXT
    )
  `);

  db.run(`
    CREATE INDEX IF NOT EXISTS idx_files_added_at ON files(added_at);
  `);

  console.log("✅ Database tables and indexes created successfully.");

  // 1. Create the FTS virtual table
  // This table will store the text you want to search.
  // - `name`, `title`, `artist`: The columns to index.
  // - `content`: Specifies that this is an index for the 'files' table.
  // - `content_rowid`: Links the index to the 'id' column of the 'files' table.
  db.run(`
    CREATE VIRTUAL TABLE IF NOT EXISTS files_fts USING fts5(
      title,
      description,
      content='files',
      content_rowid='id'
    );
  `);

  console.log("✅ FTS5 table created successfully.");

  // After a song is inserted into 'files', insert it into the FTS index.
  db.run(`
    CREATE TRIGGER IF NOT EXISTS files_after_insert
    AFTER INSERT ON files
    BEGIN
      INSERT INTO files_fts(rowid, title, description)
      VALUES (new.id, new.title, COALESCE(new.description, ''));
    END;
  `);

  // After a song is updated in 'files', update it in the FTS index.
  db.run(`
    CREATE TRIGGER IF NOT EXISTS files_after_update
    AFTER UPDATE ON files
    BEGIN
      INSERT INTO files_fts(files_fts, rowid, title, description)
      VALUES ('delete', old.id, old.title, old.description);
      INSERT INTO files_fts(rowid, title, description)
      VALUES (new.id, new.title, COALESCE(new.description, ''));
    END;
  `);

  // After a song is deleted from 'files', delete it from the FTS index.
  db.run(`
    CREATE TRIGGER IF NOT EXISTS files_after_delete
    AFTER DELETE ON files
    BEGIN
      INSERT INTO files_fts(files_fts, rowid, title, description)
      VALUES ('delete', old.id, old.title, old.description);
    END;
  `);

  console.log("✅ Database triggers created successfully.");

  console.log("Database setup complete.");

  return db;
}
