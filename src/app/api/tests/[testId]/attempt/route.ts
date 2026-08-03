import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { loadTestForTaker } from "@/lib/test-access";

export const dynamic = "force-dynamic";

/**
 * Start a test, or resume the one already in progress.
 *
 * TestAttempt is @@unique([userId, testId]), so a student gets exactly one attempt per
 * test. Re-taking would need a schema change; until then a finished attempt is returned
 * as-is and the client sends the student to their result instead.
 */
export async function POST(req: Request, { params }: { params: { testId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { test, canTake } = await loadTestForTaker(params.testId, userId);

    if (!test) return new NextResponse("Test not found", { status: 404 });
    if (!canTake) {
      return new NextResponse("Buy this test series to take the test", { status: 403 });
    }

    const existing = await db.testAttempt.findUnique({
      where: { userId_testId: { userId, testId: params.testId } },
    });

    if (existing) {
      return NextResponse.json({ ...existing, resumed: !existing.isCompleted });
    }

    const attempt = await db.testAttempt.create({
      data: {
        userId,
        testId: params.testId,
        totalMarks: test.totalMarks,
      },
    });

    return NextResponse.json({ ...attempt, resumed: false });
  } catch (error) {
    console.log("[TEST_ATTEMPT_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
