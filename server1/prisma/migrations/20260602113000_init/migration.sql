CREATE EXTENSION IF NOT EXISTS "pgcrypto";

CREATE TYPE "Role" AS ENUM ('ADMIN', 'INSTRUCTOR', 'STUDENT');

CREATE TABLE "users" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "email" VARCHAR(255) NOT NULL,
  "password_hash" TEXT NOT NULL,
  "first_name" VARCHAR(100),
  "last_name" VARCHAR(100),
  "role" "Role" NOT NULL DEFAULT 'STUDENT',
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "notifications" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "user_id" UUID NOT NULL,
  "title" VARCHAR(160) NOT NULL,
  "message" TEXT NOT NULL,
  "is_read" BOOLEAN NOT NULL DEFAULT false,
  "metadata" JSONB,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "users_email_key" ON "users"("email");
CREATE INDEX "notifications_user_id_is_read_idx" ON "notifications"("user_id", "is_read");
CREATE INDEX "notifications_created_at_idx" ON "notifications"("created_at");

ALTER TABLE "notifications"
  ADD CONSTRAINT "notifications_user_id_fkey"
  FOREIGN KEY ("user_id")
  REFERENCES "users"("id")
  ON DELETE CASCADE
  ON UPDATE CASCADE;
