import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL ? {
    url: process.env.DATABASE_URL || process.env.NEON_DATABASE_URL,
  } : {
    host: process.env.NEON_HOST || process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.NEON_PORT || process.env.DB_PORT || '5432'),
    database: process.env.NEON_DATABASE || process.env.DB_NAME || 'hirelocal',
    user: process.env.NEON_USER || process.env.DB_USER || 'postgres',
    password: process.env.NEON_PASSWORD || process.env.DB_PASSWORD,
    ssl: process.env.NEON_HOST ? { rejectUnauthorized: false } : false,
  },
});
