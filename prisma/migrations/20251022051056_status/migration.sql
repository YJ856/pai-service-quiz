/*
  Warnings:

  - The primary key for the `assignment` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - The primary key for the `quiz` table will be changed. If it partially fails, the table could be left without primary key constraint.

*/
-- DropForeignKey
ALTER TABLE "quiz"."assignment" DROP CONSTRAINT "assignment_quiz_id_fkey";

-- AlterTable
ALTER TABLE "assignment" DROP CONSTRAINT "assignment_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ALTER COLUMN "quiz_id" SET DATA TYPE BIGINT,
ALTER COLUMN "child_profile_id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "assignment_pkey" PRIMARY KEY ("id");

-- AlterTable
ALTER TABLE "quiz" DROP CONSTRAINT "quiz_pkey",
ALTER COLUMN "id" SET DATA TYPE BIGINT,
ALTER COLUMN "parent_profile_id" SET DATA TYPE BIGINT,
ADD CONSTRAINT "quiz_pkey" PRIMARY KEY ("id");

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
