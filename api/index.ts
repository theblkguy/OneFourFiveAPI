import app, { ensureDatabaseReady } from '../src/app';

// Warm DB schema check during cold start (overlaps with function boot; auth routes also guard)
void ensureDatabaseReady().catch((err) => {
  console.error('Database warm-up failed:', err);
});

export default app;
