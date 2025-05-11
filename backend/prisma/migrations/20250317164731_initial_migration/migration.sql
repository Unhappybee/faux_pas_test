-- AlterTable
ALTER TABLE "Question" ADD COLUMN     "conditionalNextQuestionId" INTEGER,
ADD COLUMN     "defaultNextQuestionId" INTEGER;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_defaultNextQuestionId_fkey" FOREIGN KEY ("defaultNextQuestionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_conditionalNextQuestionId_fkey" FOREIGN KEY ("conditionalNextQuestionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
