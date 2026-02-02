/**
 * Database-backed user store using Neon PostgreSQL
 */
import { sql } from '../db';
import type { User } from '../types';

export interface StoredUser extends User {
  passwordHash: string;
}

export async function findById(id: string): Promise<StoredUser | undefined> {
  try {
    const rows = await sql`
      SELECT id, email, password_hash as "passwordHash", created_at as "createdAt"
      FROM users
      WHERE id = ${id}
    `;
    return rows[0] as StoredUser | undefined;
  } catch (error) {
    console.error('Error finding user by id:', error);
    return undefined;
  }
}

export async function findByEmail(email: string): Promise<StoredUser | undefined> {
  try {
    const normalizedEmail = email.trim().toLowerCase();
    const rows = await sql`
      SELECT id, email, password_hash as "passwordHash", created_at as "createdAt"
      FROM users
      WHERE email = ${normalizedEmail}
    `;
    return rows[0] as StoredUser | undefined;
  } catch (error) {
    console.error('Error finding user by email:', error);
    return undefined;
  }
}

export async function createUser(email: string, passwordHash: string): Promise<User> {
  const normalizedEmail = email.trim().toLowerCase();
  
  try {
    const rows = await sql`
      INSERT INTO users (email, password_hash)
      VALUES (${normalizedEmail}, ${passwordHash})
      RETURNING id, email, created_at as "createdAt"
    `;
    
    const user = rows[0];
    return {
      id: String(user.id),
      email: user.email,
      createdAt: user.createdAt,
    };
  } catch (error: any) {
    // Check for unique constraint violation (duplicate email)
    if (error?.code === '23505') {
      throw new Error('EMAIL_TAKEN');
    }
    console.error('Error creating user:', error);
    throw new Error('Failed to create user');
  }
}
