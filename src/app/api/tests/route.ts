import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// List tests inside a test chapter.
// Teachers who own the parent series see drafts too; everyone else sees published only.
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const testChapterId = searchParams.get("testChapterId");

    if (!testChapterId) {
      return new NextResponse("testChapterId is required", { status: 400 });
    }

    const testChapter = await db.testChapter.findUnique({
      where: { id: testChapterId },
      include: { testSeries: { select: { userId: true } } },
    });

    if (!testChapter) {
      return new NextResponse("Test chapter not found", { status: 404 });
    }

    const isOwner = testChapter.testSeries.userId === userId;

    const tests = await db.test.findMany({
      where: {
        testChapterId,
        ...(isOwner ? {} : { isPublished: true }),
      },
      include: {
        _count: { select: { questions: true } },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(tests);
  } catch (error) {
    console.log("[TESTS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

// Teacher: create a test inside one of their test chapters.
export async function POST(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const {
      testChapterId,
      title,
      description,
      duration,
      totalMarks,
      passingMarks,
      testMode,
      isFree,
    } = await req.json();

    if (!testChapterId || !title) {
      return new NextResponse("testChapterId and title are required", { status: 400 });
    }

    const testChapter = await db.testChapter.findUnique({
      where: { id: testChapterId },
      include: { testSeries: { select: { userId: true } } },
    });

    if (!testChapter || testChapter.testSeries.userId !== userId) {
      return new NextResponse("Test chapter not found or unauthorized", { status: 404 });
    }

    const lastTest = await db.test.findFirst({
      where: { testChapterId },
      orderBy: { position: "desc" },
    });

    const test = await db.test.create({
      data: {
        testChapterId,
        title,
        description: description || null,
        duration: Number(duration) || 60,
        totalMarks: Number(totalMarks) || 0,
        passingMarks: passingMarks === undefined || passingMarks === null ? null : Number(passingMarks),
        testMode: testMode === "DESCRIPTIVE" ? "DESCRIPTIVE" : "OBJECTIVE",
        isFree: !!isFree,
        position: lastTest ? lastTest.position + 1 : 1,
      },
    });

    return NextResponse.json(test);
  } catch (error) {
    console.log("[TESTS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
