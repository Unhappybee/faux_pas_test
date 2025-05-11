/*
  Warnings:

  - You are about to drop the column `booleanAnswer` on the `UserAnswer` table. All the data in the column will be lost.
  - Made the column `answerText` on table `UserAnswer` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "exampleAnswer" TEXT;

-- AlterTable
ALTER TABLE "UserAnswer" DROP COLUMN "booleanAnswer",
ALTER COLUMN "answerText" SET NOT NULL;
