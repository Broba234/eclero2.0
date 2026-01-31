/*
  Warnings:

  - You are about to drop the `Review` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `Session` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `users` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_sessionId_fkey";

-- DropForeignKey
ALTER TABLE "Review" DROP CONSTRAINT "Review_userId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_studentId_fkey";

-- DropForeignKey
ALTER TABLE "Session" DROP CONSTRAINT "Session_tutorId_fkey";

-- DropTable
DROP TABLE "Review";

-- DropTable
DROP TABLE "Session";

-- DropTable
DROP TABLE "users";

-- DropEnum
DROP TYPE "SessionStatus";

-- DropEnum
DROP TYPE "UserRole";

-- CreateTable
CREATE TABLE "Profiles" (
    "id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" TEXT NOT NULL,
    "bio" TEXT,
    "avatar" TEXT,
    "subjects" TEXT[],
    "hourlyRate" DOUBLE PRECISION,
    "availability" JSONB,
    "isAvailableNow" BOOLEAN,
    "profile_setup" BOOLEAN NOT NULL DEFAULT false,
    "rating" DOUBLE PRECISION,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Profiles_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Profiles_email_key" ON "Profiles"("email");
