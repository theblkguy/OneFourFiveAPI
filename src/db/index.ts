import { neon, type NeonQueryFunction } from '@neondatabase/serverless';

const missingDatabaseUrlMessage =
  'DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL (get a connection string from https://console.neon.tech).';

let sqlClient: NeonQueryFunction<false, false> | null = null;

function getDatabaseUrl(): string {
  const databaseUrl = process.env.DATABASE_URL;
  if (!databaseUrl) {
    throw new Error(missingDatabaseUrlMessage);
  }
  return databaseUrl;
}

function getSqlClient(): NeonQueryFunction<false, false> {
  if (!sqlClient) {
    sqlClient = neon(getDatabaseUrl());
  }
  return sqlClient;
}

/** Lazy Neon client — avoids crashing at import time when DATABASE_URL is unset (e.g. during Vercel cold start). */
export const sql = ((strings: TemplateStringsArray, ...values: unknown[]) =>
  getSqlClient()(strings, ...values)) as NeonQueryFunction<false, false>;

// Initialize database schema
export async function initializeDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn('Skipping database initialization - DATABASE_URL not set');
    return;
  }

  try {
    // Create users table if it doesn't exist
    await getSqlClient()`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('Database initialized successfully');
  } catch (error) {
    console.error('Database initialization failed:', error);
    throw error;
  }
}
