import { drizzle } from 'drizzle-orm/neon-serverless';
import { Pool, neonConfig } from '@neondatabase/serverless';
import { drizzle as drizzlePg } from 'drizzle-orm/node-postgres';
import pkg from 'pg';
import ws from "ws";

const { Pool: PgPool } = pkg;
import * as schema from "@shared/schema";

// Configure database based on environment
const isProduction = process.env.NODE_ENV === 'production';
const hasReplitDb = process.env.DATABASE_URL && !process.env.DATABASE_URL.includes('localhost');
const hasExternalDb = process.env.DATABASE_URL && 
  (process.env.DATABASE_URL.includes('neon') || 
   process.env.DATABASE_URL.includes('supabase') ||
   process.env.DATABASE_URL.includes('planetscale'));

let db: ReturnType<typeof drizzle> | ReturnType<typeof drizzlePg>;

// Use the database URL from environment variable
console.log('Using database from environment variable');
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  throw new Error('DATABASE_URL environment variable is required');
}

// Detect database type and use appropriate driver
if (DATABASE_URL.includes('neon') || DATABASE_URL.includes('@db.')) {
  // Use Neon serverless for Neon databases
  neonConfig.webSocketConstructor = ws;
  const pool = new Pool({ connectionString: DATABASE_URL });
  db = drizzle({ client: pool, schema });
  console.log('Using Neon serverless driver');
} else {
  // Use regular PostgreSQL driver for VM and other databases
  const pgPool = new PgPool({ connectionString: DATABASE_URL });
  db = drizzlePg(pgPool, { schema });
  console.log('Using PostgreSQL driver');
}

export { db };