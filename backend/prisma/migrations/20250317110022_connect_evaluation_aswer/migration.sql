/*
  Warnings:

  - You are about to drop the column `questionId` on the `Evaluation` table. All the data in the column will be lost.
  - Added the required column `answerId` to the `Evaluation` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "Evaluation" DROP CONSTRAINT "Evaluation_questionId_fkey";

-- AlterTable
ALTER TABLE "Evaluation" DROP COLUMN "questionId",
ADD COLUMN     "answerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_answerId_fkey" FOREIGN KEY ("answerId") REFERENCES "Answer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
