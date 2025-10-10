-- CreateEnum
CREATE TYPE "QuizStatus" AS ENUM ('SCHEDULED', 'TODAY', 'COMPLETED');

-- CreateTable
CREATE TABLE "quizzes" (
    "id" SERIAL NOT NULL,
    "parent_profile_id" INTEGER NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "reward" TEXT,
    "hint" TEXT,
    "publish_date" DATE NOT NULL,
    "status" "QuizStatus" NOT NULL,

    CONSTRAINT "quizzes_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "assignments" (
    "id" SERIAL NOT NULL,
    "quiz_id" INTEGER NOT NULL,
    "child_profile_id" INTEGER NOT NULL,
    "is_solved" BOOLEAN NOT NULL DEFAULT false,
    "reward_granted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "quizzes_parent_profile_id_publish_date_idx" ON "quizzes"("parent_profile_id", "publish_date");

-- CreateIndex
CREATE INDEX "assignments_quiz_id_child_profile_id_idx" ON "assignments"("quiz_id", "child_profile_id");

-- CreateIndex
CREATE INDEX "assignments_child_profile_id_idx" ON "assignments"("child_profile_id");

-- CreateIndex
CREATE UNIQUE INDEX "assignments_quiz_id_child_profile_id_key" ON "assignments"("quiz_id", "child_profile_id");

-- AddForeignKey
ALTER TABLE "assignments" ADD CONSTRAINT "assignments_quiz_id_fkey" FOREIGN KEY ("quiz_id") REFERENCES "quizzes"("id") ON DELETE CASCADE ON UPDATE CASCADE;
