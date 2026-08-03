import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function PATCH(req: Request, { params }: { params: { submissionId: string } }) {
  try {
    const { userId } = auth();
    const { marksAwarded, feedback, annotatedPdfUrl, annotatedImageUrls, status } = await req.json();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const existing = await db.testSubmission.findFirst({
      where: { id: params.submissionId, testChapter: { testSeries: { userId } } },
    });

    if (!existing) return new NextResponse("Not found", { status: 404 });

    const annotatedUrl = Array.isArray(annotatedImageUrls) && annotatedImageUrls.length > 0
      ? JSON.stringify({ type: "images", urls: annotatedImageUrls })
      : annotatedPdfUrl;

    const submission = await db.testSubmission.update({
      where: { id: params.submissionId },
      data: {
        marksAwarded: marksAwarded === undefined || marksAwarded === "" ? undefined : Number(marksAwarded),
        feedback: feedback || null,
        annotatedPdfUrl: annotatedUrl || null,
        status: status || "REVIEWED",
        reviewedBy: userId,
        reviewedAt: new Date(),
      },
      include: { testChapter: { include: { testSeries: true } } },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.log("[TEST_SUBMISSION_REVIEW]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
