// dotenv does not override existing env vars — keep tests on custom JWT auth
process.env.NEON_AUTH_URL = '';
