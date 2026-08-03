import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

// Student: list their own chapter submissions, optionally scoped to one chapter.
export async function GET(req: Request) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { searchParams } = new URL(req.url);
    const chapterId = searchParams.get("chapterId") || undefined;

    const submissions = await db.chapterSubmission.findMany({
      where: {
        userId,
        ...(chapterId ? { chapterId } : {}),
      },
      include: { chapter: { include: { course: { select: { id: true, title: true } } } } },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(submissions);
  } catch (error) {
    console.log("[CHAPTER_SUBMISSIONS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
