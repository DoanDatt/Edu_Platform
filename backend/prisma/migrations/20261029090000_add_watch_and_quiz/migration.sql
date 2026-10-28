-- CreateTable
CREATE TABLE "LectureWatch" (
    "userId" INTEGER NOT NULL,
    "lectureId" INTEGER NOT NULL,
    "watchedSec" INTEGER NOT NULL DEFAULT 0,
    "positionSec" INTEGER NOT NULL DEFAULT 0,
    "reportedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LectureWatch_pkey" PRIMARY KEY ("userId","lectureId")
);

-- CreateTable
CREATE TABLE "QuizQuestion" (
    "id" SERIAL NOT NULL,
    "lectureId" INTEGER NOT NULL,
    "question" VARCHAR(1000) NOT NULL,
    "options" TEXT[],
    "correctIndex" INTEGER NOT NULL,
    "explanation" TEXT NOT NULL DEFAULT '',
    "position" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuizQuestion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuizAttempt" (
    "id" SERIAL NOT NULL,
    "userId" INTEGER NOT NULL,
    "lectureId" INTEGER NOT NULL,
    "score" INTEGER NOT NULL,
    "correctCount" INTEGER NOT NULL,
    "totalQuestion" INTEGER NOT NULL,
    "passed" BOOLEAN NOT NULL,
    "answers" JSONB NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "QuizAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "LectureWatch_lectureId_idx" ON "LectureWatch"("lectureId");

-- CreateIndex
CREATE INDEX "QuizQuestion_lectureId_position_idx" ON "QuizQuestion"("lectureId", "position");

-- CreateIndex
CREATE INDEX "QuizAttempt_userId_lectureId_idx" ON "QuizAttempt"("userId", "lectureId");

-- CreateIndex
CREATE INDEX "QuizAttempt_lectureId_idx" ON "QuizAttempt"("lectureId");

-- AddForeignKey
ALTER TABLE "LectureWatch" ADD CONSTRAINT "LectureWatch_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "LectureWatch" ADD CONSTRAINT "LectureWatch_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuizQuestion" ADD CONSTRAINT "QuizQuestion_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "QuizAttempt" ADD CONSTRAINT "QuizAttempt_lectureId_fkey" FOREIGN KEY ("lectureId") REFERENCES "Lecture"("id") ON DELETE CASCADE ON UPDATE NO ACTION;

