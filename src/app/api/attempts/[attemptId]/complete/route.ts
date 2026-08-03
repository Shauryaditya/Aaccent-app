import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { scoreAnswer } from "@/lib/grade-test";

export const dynamic = "force-dynamic";

/**
 * Submit an attempt and grade it server-side.
 *
 * Idempotent: submitting an already-completed attempt returns the existing result rather
 * than re-grading, so a double tap or a retried request cannot change a score.
 */
export async function POST(req: Request, { params }: { params: { attemptId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const attempt = await db.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: {
          include: { questions: { include: { options: true } } },
        },
        answers: true,
      },
    });

    if (!attempt) return new NextResponse("Attempt not found", { status: 404 });
    if (attempt.userId !== userId) return new NextResponse("Unauthorized", { status: 403 });

    if (attempt.isCompleted) {
      return NextResponse.json({
        id: attempt.id,
        score: attempt.score,
        totalMarks: attempt.totalMarks,
        percentage: attempt.percentage,
        isPassed: attempt.isPassed,
        isCompleted: true,
        alreadySubmitted: true,
      });
    }

    const answersByQuestion = new Map(attempt.answers.map((answer) => [answer.questionId, answer]));

    let score = 0;
    const updates: Array<{ id: string; isCorrect: boolean; marksAwarded: number }> = [];

    for (const question of attempt.test.questions) {
      const answer = answersByQuestion.get(question.id);
      if (!answer) continue;

      const { isCorrect, marksAwarded } = scoreAnswer(question, answer.selectedAnswer);
      score += marksAwarded;
      updates.push({ id: answer.id, isCorrect, marksAwarded });
    }

    // A heavily negative-marked paper should floor at zero rather than go negative.
    score = Math.max(0, score);

    const totalMarks = attempt.test.totalMarks || attempt.totalMarks || 0;
    const percentage = totalMarks > 0 ? Math.round((score / totalMarks) * 10000) / 100 : 0;
    const isPassed =
      attempt.test.passingMarks == null ? null : score >= attempt.test.passingMarks;

    const [updated] = await db.$transaction([
      db.testAttempt.update({
        where: { id: attempt.id },
        data: {
          score,
          totalMarks,
          percentage,
          isPassed,
          isCompleted: true,
          completedAt: new Date(),
        },
      }),
      ...updates.map((update) =>
        db.answer.update({
          where: { id: update.id },
          data: { isCorrect: update.isCorrect, marksAwarded: update.marksAwarded },
        })
      ),
    ]);

    return NextResponse.json({ ...updated, alreadySubmitted: false });
  } catch (error) {
    console.log("[ATTEMPT_COMPLETE_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
