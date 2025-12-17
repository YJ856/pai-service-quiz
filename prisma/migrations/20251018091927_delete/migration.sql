/*
  Warnings:

  - You are about to drop the column `status` on the `quiz` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "quiz" DROP COLUMN "status";

-- DropEnum
DROP TYPE "quiz"."QuizStatus";
