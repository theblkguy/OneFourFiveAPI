import { neon } from '@neondatabase/serverless';

// Get DATABASE_URL from environment
const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  const msg =
    'DATABASE_URL is not set. Copy .env.example to .env and set DATABASE_URL (get a connection string from https://console.neon.tech).';
  if (process.env.NODE_ENV === 'production') {
    throw new Error(msg);
  }
  throw new Error(msg);
}

// Create Neon SQL client
export const sql = neon(databaseUrl);

// Initialize database schema
export async function initializeDatabase() {
  if (!databaseUrl) {
    console.warn('Skipping database initialization - DATABASE_URL not set');
    return;
  }

  try {
    // Create users table if it doesn't exist
    await sql`
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
