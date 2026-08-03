import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Teacher: list every chapter submission across the courses they own.
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status") || undefined;
    const chapterId = searchParams.get("chapterId") || undefined;

    const submissions = await db.chapterSubmission.findMany({
      where: {
        ...(status ? { status: status as any } : {}),
        ...(chapterId ? { chapterId } : {}),
        chapter: { course: { userId } },
      },
      include: { chapter: { include: { course: { select: { id: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.log("[ALL_CHAPTER_SUBMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
