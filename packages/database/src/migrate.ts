import { migrate } from 'drizzle-orm/node-postgres/migrator';
import { db, sql } from './index.js';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function runMigrations() {
  console.log('🚀 Running PostgreSQL & PostGIS migrations...');
  const migrationsFolder = path.resolve(__dirname, '../drizzle');
  
  try {
    console.log('📦 Ensuring PostgreSQL extensions (uuid-ossp, postgis)...');
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS "uuid-ossp";`);
    await db.execute(sql`CREATE EXTENSION IF NOT EXISTS postgis;`);
    await db.execute(sql`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'OPERATOR_ADMIN';`);
    await db.execute(sql`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'DRIVER';`);
    await db.execute(sql`ALTER TYPE "user_role" ADD VALUE IF NOT EXISTS 'CONDUCTOR';`);
    await db.execute(sql`ALTER TYPE "bus_status" ADD VALUE IF NOT EXISTS 'PENDING_APPROVAL';`);
    await migrate(db, { migrationsFolder });
    await db.execute(sql`ALTER TABLE "operators" ADD COLUMN IF NOT EXISTS "corridor" varchar(200) DEFAULT 'State Rural Corridor' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "operator_members" ADD COLUMN IF NOT EXISTS "bus_id" uuid REFERENCES "buses"("id") ON DELETE SET NULL;`);
    await db.execute(sql`ALTER TABLE "operator_members" ADD COLUMN IF NOT EXISTS "created_by" varchar(50) DEFAULT 'OWNER' NOT NULL;`);
    await db.execute(sql`ALTER TABLE "buses" ADD COLUMN IF NOT EXISTS "amenities" jsonb DEFAULT '[]'::jsonb NOT NULL;`);
    await db.execute(sql`ALTER TABLE "buses" ADD COLUMN IF NOT EXISTS "created_by" varchar(50) DEFAULT 'SUPER_ADMIN' NOT NULL;`);
    console.log('✅ Migrations applied successfully!');
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  }
}

runMigrations()
  .then(() => {
    console.log('Migration process completed.');
    process.exit(0);
  })
  .catch((err) => {
    console.error('Migration process failed:', err);
    process.exit(1);
  });
