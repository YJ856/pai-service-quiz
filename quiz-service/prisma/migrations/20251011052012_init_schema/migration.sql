/*
  Warnings:

  - You are about to drop the `assignments` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the `quizzes` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "quiz"."assignments" DROP CONSTRAINT "assignments_quiz_id_fkey";

-- DropTable
DROP TABLE "quiz"."assignments";

-- DropTable
DROP TABLE "quiz"."quizzes";

-- CreateTable
CREATE TABLE "quiz" (
    "id" SERIAL NOT NULL,
    "parent_profile_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "reward" TEXT,
    "hint" TEXT,
    "publish_date" DATE NOT NULL,
    "status" "QuizStatus" NOT NULL,

    CONSTRAINT "quiz_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignment" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "child_profile_id" INTEGER NOT NULL,
    "is_solved" BOOLEAN NOT NULL DEFAULT false,
    "reward_granted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "assignment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "idx_quiz_parent_profile_id_publish_date" ON "quiz"("parent_profile_id", "publish_date");

-- CreateIndex
CREATE INDEX "idx_assignment_quiz_id_child_profile_id" ON "assignment"("quiz_id", "child_profile_id");

-- CreateIndex
CREATE INDEX "idx_assignment_child_profile_id" ON "assignment"("child_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "uq_assignment_quiz_id_child_profile_id" ON "assignment"("quiz_id", "child_profile_id");

-- AddForeignKey
ALTER TABLE "assignment" ADD CONSTRAINT "assignment_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quiz"("id") ON DELETE CASCADE ON UPDATE CASCADE;
