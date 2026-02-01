/**
 * In-memory user store. Replace with a database in production.
 */
import type { User } from '../types';

export interface StoredUser extends User {
  passwordHash: string;
}

const users = new Map<string, StoredUser>();
const byEmail = new Map<string, string>(); // email (lowercase) -> id

let nextId = 1;

function nextUserId(): string {
  return String(nextId++);
}

export function findById(id: string): StoredUser | undefined {
  return users.get(id);
}

export function findByEmail(email: string): StoredUser | undefined {
  const id = byEmail.get(email.trim().toLowerCase());
  return id ? users.get(id) : undefined;
}

export function createUser(email: string, passwordHash: string): User {
  const normalizedEmail = email.trim().toLowerCase();
  if (byEmail.has(normalizedEmail)) {
    throw new Error('EMAIL_TAKEN');
  }
  const id = nextUserId();
  const now = new Date().toISOString();
  const stored: StoredUser = {
    id,
    email: normalizedEmail,
    passwordHash,
    createdAt: now,
  };
  users.set(id, stored);
  byEmail.set(normalizedEmail, id);
  return { id, email: stored.email, createdAt: stored.createdAt };
}
