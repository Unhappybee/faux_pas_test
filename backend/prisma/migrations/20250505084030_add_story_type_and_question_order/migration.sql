/*
  Warnings:

  - You are about to drop the column `exampleAnswer` on the `Question` table. All the data in the column will be lost.
  - The `correctAnswer` column on the `Question` table would be dropped and recreated. This will lead to data loss if there is data in the column.
  - Added the required column `storyType` to the `Story` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "StoryType" AS ENUM ('FAUX_PAS', 'CONTROL');

-- AlterTable
ALTER TABLE "Question" DROP COLUMN "exampleAnswer",
ADD COLUMN     "orderInStory" INTEGER,
DROP COLUMN "correctAnswer",
ADD COLUMN     "correctAnswer" TEXT[];

-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "storyType" "StoryType" NOT NULL;
