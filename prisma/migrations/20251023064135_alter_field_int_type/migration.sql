/*
  Warnings:

  - You are about to alter the column `child_profile_id` on the `assignment` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.
  - You are about to alter the column `parent_profile_id` on the `quiz` table. The data in that column could be lost. The data in that column will be cast from `BigInt` to `Integer`.

*/
-- AlterTable
ALTER TABLE "assignment" ALTER COLUMN "child_profile_id" SET DATA TYPE INTEGER;

-- AlterTable
ALTER TABLE "quiz" ALTER COLUMN "parent_profile_id" SET DATA TYPE INTEGER;
