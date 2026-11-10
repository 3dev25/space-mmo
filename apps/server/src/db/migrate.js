import pg from 'pg';
import { readFile } from 'node:fs/promises';
import 'dotenv/config';
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL });
try {
  const sql = await readFile(new URL('../../../../database/migrations/001_initial.sql', import.meta.url), 'utf8');
  await pool.query(sql);
  console.log('Migration 001 applied.');
} finally { await pool.end(); }
