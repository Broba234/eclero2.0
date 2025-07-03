/*
  Warnings:

  - You are about to drop the column `subjects` on the `Profiles` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Profiles" DROP COLUMN "subjects";

-- CreateTable
CREATE TABLE "Subject" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subject_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProfilesOnSubjects" (
    "profileId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProfilesOnSubjects_pkey" PRIMARY KEY ("profileId","subjectId")
);

-- AddForeignKey
ALTER TABLE "ProfilesOnSubjects" ADD CONSTRAINT "ProfilesOnSubjects_profileId_fkey" FOREIGN KEY ("profileId") REFERENCES "Profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilesOnSubjects" ADD CONSTRAINT "ProfilesOnSubjects_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "Subject"("id") ON DELETE CASCADE ON UPDATE CASCADE;
