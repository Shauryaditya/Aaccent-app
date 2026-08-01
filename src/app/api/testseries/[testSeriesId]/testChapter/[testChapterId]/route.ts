// app/api/testseries/[testSeriesId]/chapters/[testChapterId]/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
  try {
    const { userId } = auth();

    const testChapter = await db.testChapter.findUnique({
      where: { id: params.testChapterId, testSeriesId: params.testSeriesId },
      include: {
        attachments: true,
        submissions: userId ? { where: { userId }, orderBy: { createdAt: "desc" } } : false,
        tests: { orderBy: { position: "asc" } },
        testSeries: { select: { userId: true, isPublished: true } },
      },
    });

    if (!testChapter) return new NextResponse("Not Found", { status: 404 });

    const isOwner = testChapter.testSeries.userId === userId;
    if ((!testChapter.testSeries.isPublished || !testChapter.isPublished) && !isOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(testChapter);
  } catch (error) {
    console.log("[TEST_CHAPTER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const testSeriesOwner = await db.testSeries.findUnique({
      where: { id: params.testSeriesId, userId },
    });

    if (!testSeriesOwner) return new NextResponse("Unauthorized", { status: 401 });

    const testChapter = await db.testChapter.findUnique({
      where: { id: params.testChapterId, testSeriesId: params.testSeriesId },
    });

    if (!testChapter) return new NextResponse("Not Found", { status: 404 });

    const deletedChapter = await db.testChapter.delete({ where: { id: params.testChapterId } });

    const publishedChaptersInTestSeries = await db.testChapter.findMany({
      where: { testSeriesId: params.testSeriesId, isPublished: true },
    });

    if (!publishedChaptersInTestSeries.length) {
      await db.testSeries.update({ where: { id: params.testSeriesId }, data: { isPublished: false } });
    }

    return NextResponse.json(deletedChapter);
  } catch (error) {
    console.log("[TEST_CHAPTER_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { testSeriesId: string; testChapterId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const testSeriesOwner = await db.testSeries.findUnique({
      where: { id: params.testSeriesId, userId },
    });

    if (!testSeriesOwner) return new NextResponse("Unauthorized", { status: 401 });

    const data: Record<string, unknown> = {};
    if (values.title !== undefined) data.title = values.title;
    if (values.description !== undefined) data.description = values.description || null;
    if (values.isPublished !== undefined) data.isPublished = Boolean(values.isPublished);

    const testChapter = await db.testChapter.update({
      where: { id: params.testChapterId, testSeriesId: params.testSeriesId },
      data,
      include: { attachments: true, tests: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(testChapter);
  } catch (error) {
    console.log("[TEST_CHAPTER_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
