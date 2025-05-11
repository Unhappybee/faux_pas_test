/*
  Warnings:

  - A unique constraint covering the columns `[userId,questionId]` on the table `UserAnswer` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "UserAnswer_userId_questionId_key" ON "UserAnswer"("userId", "questionId");
