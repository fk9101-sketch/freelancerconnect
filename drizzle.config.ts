import { defineConfig } from "drizzle-kit";

export default defineConfig({
  out: "./migrations",
  schema: "./shared/schema.ts",
  dialect: "postgresql",
  dbCredentials: {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5000'),
    database: process.env.DB_NAME || 'hirelocal',
    user: process.env.DB_USER || 'postgres',
    password: process.env.DB_PASSWORD || 'Jhotwara#321',
    ssl: false,
  },
});
