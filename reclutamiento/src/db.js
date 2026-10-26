// db.js - Base de datos SQLite (node:sqlite, sin dependencias nativas)
import { DatabaseSync } from 'node:sqlite';
import fs from 'node:fs';
import path from 'node:path';

export const STATUSES = ['nuevo', 'agendado', 'entrevistado', 'seleccionado', 'descartado'];

export function openDb(file) {
  if (file !== ':memory:') fs.mkdirSync(path.dirname(file), { recursive: true });
  const db = new DatabaseSync(file);
  db.exec(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY,
      title TEXT NOT NULL,
      location TEXT NOT NULL DEFAULT '',
      description TEXT NOT NULL DEFAULT '',
      questions TEXT NOT NULL DEFAULT '[]',
      cv_required INTEGER NOT NULL DEFAULT 1,
      active INTEGER NOT NULL DEFAULT 1,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    -- starts_at es hora local de la oficina, formato YYYY-MM-DDTHH:MM
    CREATE TABLE IF NOT EXISTS slots (
      id INTEGER PRIMARY KEY,
      starts_at TEXT NOT NULL,
      duration_min INTEGER NOT NULL,
      capacity INTEGER NOT NULL DEFAULT 1,
      place TEXT NOT NULL DEFAULT '',
      UNIQUE (starts_at, place)
    );

    CREATE TABLE IF NOT EXISTS candidates (
      id INTEGER PRIMARY KEY,
      token TEXT NOT NULL UNIQUE,
      job_id INTEGER REFERENCES jobs(id),
      name TEXT NOT NULL DEFAULT '',
      document_id TEXT NOT NULL DEFAULT '',
      email TEXT NOT NULL DEFAULT '',
      phone TEXT NOT NULL DEFAULT '',
      city TEXT NOT NULL DEFAULT '',
      answers TEXT NOT NULL DEFAULT '{}',
      cv_file TEXT,
      cv_name TEXT,
      slot_id INTEGER REFERENCES slots(id),
      status TEXT NOT NULL DEFAULT 'nuevo',
      source TEXT NOT NULL DEFAULT 'web',
      notes TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      submitted_at TEXT
    );

    CREATE INDEX IF NOT EXISTS idx_candidates_slot ON candidates(slot_id);
    CREATE INDEX IF NOT EXISTS idx_candidates_job ON candidates(job_id);
  `);
  return db;
}

// Ejecuta fn dentro de una transacción; deshace todo si lanza.
export function tx(db, fn) {
  db.exec('BEGIN IMMEDIATE');
  try {
    const result = fn();
    db.exec('COMMIT');
    return result;
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }
}

export function parseJob(row) {
  if (!row) return null;
  return { ...row, active: !!row.active, cv_required: !!row.cv_required, questions: JSON.parse(row.questions) };
}

export function parseCandidate(row) {
  if (!row) return null;
  return { ...row, answers: JSON.parse(row.answers) };
}

// Bloques con cupos tomados (los descartados liberan su cupo)
export const SLOT_USAGE_SQL = `
  SELECT s.*, (
    SELECT COUNT(*) FROM candidates c
    WHERE c.slot_id = s.id AND c.status != 'descartado'
  ) AS taken
  FROM slots s
`;
