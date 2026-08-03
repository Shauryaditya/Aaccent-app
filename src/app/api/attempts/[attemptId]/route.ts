import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

/**
 * Fetch an attempt with its answers.
 *
 * While the attempt is in progress the answer key is withheld, so a student cannot read
 * the correct options out of the network response mid-test. Once submitted, the full
 * question data (correct options and explanations) is returned for the review screen.
 */
export async function GET(req: Request, { params }: { params: { attemptId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const attempt = await db.testAttempt.findUnique({
      where: { id: params.attemptId },
      include: {
        test: { select: { id: true, title: true, duration: true, totalMarks: true, passingMarks: true } },
        answers: {
          include: {
            question: { include: { options: { orderBy: { position: "asc" } } } },
          },
        },
      },
    });

    if (!attempt) return new NextResponse("Attempt not found", { status: 404 });
    if (attempt.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    if (attempt.isCompleted) {
      return NextResponse.json(attempt);
    }

    const safeAnswers = attempt.answers.map((answer) => ({
      ...answer,
      isCorrect: null,
      marksAwarded: null,
      question: {
        ...answer.question,
        explanation: null,
        options: answer.question.options.map(({ isCorrect, ...option }) => option),
      },
    }));

    return NextResponse.json({ ...attempt, answers: safeAnswers });
  } catch (error) {
    console.log("[ATTEMPT_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
