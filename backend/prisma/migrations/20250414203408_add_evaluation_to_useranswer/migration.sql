/*
  Warnings:

  - You are about to drop the column `evaluation` on the `Question` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Question" DROP COLUMN "evaluation";

-- AlterTable
ALTER TABLE "UserAnswer" ADD COLUMN     "evaluation" INTEGER;
