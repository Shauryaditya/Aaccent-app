import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Teacher: review a chapter submission without needing the course/chapter ids in the path.
export async function PATCH(
  req: Request,
  { params }: { params: { submissionId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { status, feedback, annotatedImages } = await req.json();

    const submission = await db.chapterSubmission.findUnique({
      where: { id: params.submissionId },
      include: { chapter: { select: { course: { select: { userId: true } } } } },
    });

    if (!submission) {
      return new NextResponse("Submission not found", { status: 404 });
    }

    if (submission.chapter.course.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 403 });
    }

    const updated = await db.chapterSubmission.update({
      where: { id: params.submissionId },
      data: {
        ...(status !== undefined ? { status } : {}),
        ...(feedback !== undefined ? { feedback } : {}),
        ...(annotatedImages !== undefined ? { annotatedImages } : {}),
      },
      include: { chapter: { include: { course: { select: { id: true, title: true } } } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[CHAPTER_SUBMISSION_REVIEW]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
