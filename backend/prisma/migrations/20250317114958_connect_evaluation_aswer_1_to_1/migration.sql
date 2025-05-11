/*
  Warnings:

  - A unique constraint covering the columns `[answerId]` on the table `Evaluation` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_answerId_key" ON "Evaluation"("answerId");
