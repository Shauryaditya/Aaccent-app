import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const testChapterId = searchParams.get("testChapterId") || undefined;

    const submissions = await db.testSubmission.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(testChapterId ? { testChapterId } : {}),
        testChapter: { testSeries: { userId } },
      },
      include: { testChapter: { include: { testSeries: true } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.log("[ALL_TEST_SUBMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
