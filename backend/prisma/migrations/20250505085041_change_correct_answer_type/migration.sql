-- AlterTable
ALTER TABLE "Question" ALTER COLUMN "correctAnswer" DROP NOT NULL,
ALTER COLUMN "correctAnswer" SET DATA TYPE TEXT;
