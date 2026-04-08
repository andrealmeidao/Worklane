-- AlterTable
ALTER TABLE "User"
ADD COLUMN "avatarUrl" TEXT,
ADD COLUMN "bio" TEXT,
ADD COLUMN "jobTitle" TEXT,
ADD COLUMN "notificationsEnabled" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN "theme" TEXT NOT NULL DEFAULT 'system';
