/*
  Warnings:

  - A unique constraint covering the columns `[storyNumber]` on the table `Story` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Story" ADD COLUMN     "storyNumber" INTEGER;

-- CreateIndex
CREATE UNIQUE INDEX "Story_storyNumber_key" ON "Story"("storyNumber");
