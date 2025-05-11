/*
  Warnings:

  - A unique constraint covering the columns `[storyId,orderInStory]` on the table `Question` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Question_storyId_orderInStory_key" ON "Question"("storyId", "orderInStory");
