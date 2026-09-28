import { defineConfig } from 'drizzle-kit';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { resolve, dirname } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
// packages/database/ -> ../../.env = workspace root
dotenv.config({ path: resolve(__dirname, '../../.env') });


export default defineConfig({
  schema: './dist/schema/index.js',
  out: './drizzle',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'postgresql://ruralbus_app:app_secure_password@localhost:5432/ruralbus',
  },
  verbose: true,
  strict: true,
});
