import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Save (or clear) the answer to one question.
 *
 * Grading deliberately does not happen here — isCorrect/marksAwarded stay null until the
 * attempt is submitted, so nothing in the response can reveal the answer key mid-test.
 */
export async function PUT(req: Request, { params }: { params: { attemptId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { questionId, selectedAnswer } = await req.json();
    if (!questionId) {
      return new NextResponse("questionId is required", { status: 400 });
    }

    const attempt = await db.testAttempt.findUnique({
      where: { id: params.attemptId },
      select: { id: true, userId: true, isCompleted: true, testId: true },
    });

    if (!attempt) return new NextResponse("Attempt not found", { status: 404 });
    if (attempt.userId !== userId) return new NextResponse("Unauthorized", { status: 403 });
    if (attempt.isCompleted) {
      return new NextResponse("This attempt has already been submitted", { status: 400 });
    }

    // Guard against answering a question that belongs to a different test.
    const question = await db.question.findFirst({
      where: { id: questionId, testId: attempt.testId },
      select: { id: true },
    });
    if (!question) {
      return new NextResponse("Question does not belong to this test", { status: 400 });
    }

    const value = typeof selectedAnswer === "string" ? selectedAnswer : null;

    const answer = await db.answer.upsert({
      where: { testAttemptId_questionId: { testAttemptId: attempt.id, questionId } },
      update: { selectedAnswer: value },
      create: { testAttemptId: attempt.id, questionId, selectedAnswer: value },
    });

    return NextResponse.json({ id: answer.id, questionId, selectedAnswer: answer.selectedAnswer });
  } catch (error) {
    console.log("[ATTEMPT_ANSWER_PUT]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
