/*
  Warnings:

  - The primary key for the `ProfilesOnSubjects` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `createdAt` on the `ProfilesOnSubjects` table. All the data in the column will be lost.
  - You are about to drop the column `profileId` on the `ProfilesOnSubjects` table. All the data in the column will be lost.
  - You are about to drop the column `subjectId` on the `ProfilesOnSubjects` table. All the data in the column will be lost.
  - You are about to drop the `Subject` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `SubjectCategory` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `profile_id` to the `ProfilesOnSubjects` table without a default value. This is not possible if the table is not empty.
  - Added the required column `subject_id` to the `ProfilesOnSubjects` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "ProfilesOnSubjects" DROP CONSTRAINT "ProfilesOnSubjects_profileId_fkey";

-- DropForeignKey
ALTER TABLE "ProfilesOnSubjects" DROP CONSTRAINT "ProfilesOnSubjects_subjectId_fkey";

-- DropForeignKey
ALTER TABLE "Subject" DROP CONSTRAINT "Subject_categoryId_fkey";

-- AlterTable
ALTER TABLE "ProfilesOnSubjects" DROP CONSTRAINT "ProfilesOnSubjects_pkey",
DROP COLUMN "createdAt",
DROP COLUMN "profileId",
DROP COLUMN "subjectId",
ADD COLUMN     "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "profile_id" TEXT NOT NULL,
ADD COLUMN     "subject_id" TEXT NOT NULL,
ADD CONSTRAINT "ProfilesOnSubjects_pkey" PRIMARY KEY ("profile_id", "subject_id");

-- DropTable
DROP TABLE "Subject";

-- DropTable
DROP TABLE "SubjectCategory";

-- CreateTable
CREATE TABLE "Subjects" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "grade" INTEGER,
    "category" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Subjects_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "ProfilesOnSubjects" ADD CONSTRAINT "ProfilesOnSubjects_profile_id_fkey" FOREIGN KEY ("profile_id") REFERENCES "Profiles"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProfilesOnSubjects" ADD CONSTRAINT "ProfilesOnSubjects_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "Subjects"("id") ON DELETE CASCADE ON UPDATE CASCADE;
