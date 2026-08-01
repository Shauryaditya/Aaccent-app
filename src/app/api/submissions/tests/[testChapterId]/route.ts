import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request, { params }: { params: { testChapterId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const submissions = await db.testSubmission.findMany({
      where: { userId, testChapterId: params.testChapterId },
      include: { testChapter: { include: { testSeries: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.log("[TEST_SUBMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request, { params }: { params: { testChapterId: string } }) {
  try {
    const { userId } = auth();
    const { pdfUrl, imageUrls, fileName, fileSize } = await req.json();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const urls = Array.isArray(imageUrls) && imageUrls.length > 0 ? imageUrls : undefined;
    const storedUrl = urls ? JSON.stringify({ type: "images", urls }) : pdfUrl;
    if (!storedUrl) return new NextResponse("Submission file is required", { status: 400 });

    const lastSubmission = await db.testSubmission.findFirst({
      where: { userId, testChapterId: params.testChapterId },
      orderBy: { attemptNo: "desc" },
    });

    const submission = await db.testSubmission.create({
      data: {
        userId,
        testChapterId: params.testChapterId,
        pdfUrl: storedUrl,
        fileName: fileName || (urls ? `${urls.length} photos` : undefined),
        fileSize: fileSize || undefined,
        attemptNo: lastSubmission ? lastSubmission.attemptNo + 1 : 1,
        status: "SUBMITTED",
      },
      include: { testChapter: { include: { testSeries: true } } },
    });

    return NextResponse.json(submission);
  } catch (error) {
    console.log("[TEST_SUBMISSION_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
