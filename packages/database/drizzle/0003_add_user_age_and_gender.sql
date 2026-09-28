ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "age" integer;
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "gender" varchar(20);
