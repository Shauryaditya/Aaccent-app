// app/api/testseries/[testSeriesId]/chapters/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    const series = await db.testSeries.findUnique({
      where: { id: params.testSeriesId },
      select: { userId: true, isPublished: true },
    });

    if (!series) return new NextResponse("Not found", { status: 404 });

    const isOwner = series.userId === userId;
    if (!series.isPublished && !isOwner) return new NextResponse("Unauthorized", { status: 401 });

    const chapters = await db.testChapter.findMany({
      where: {
        testSeriesId: params.testSeriesId,
        ...(isOwner ? {} : { isPublished: true }),
      },
      include: {
        attachments: true,
        submissions: userId ? { where: { userId } } : false,
        tests: {
          where: isOwner ? undefined : { isPublished: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: { position: "asc" },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.log("[TEST_CHAPTERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();
    const { title } = values;

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });
    if (!title || !String(title).trim()) return new NextResponse("Title is required", { status: 400 });

    const testSeriesOwner = await db.testSeries.findUnique({
      where: { id: params.testSeriesId, userId },
    });

    if (!testSeriesOwner) return new NextResponse("Unauthorized", { status: 401 });

    const lastChapter = await db.testChapter.findFirst({
      where: { testSeriesId: params.testSeriesId },
      orderBy: { position: "desc" },
    });

    const chapter = await db.testChapter.create({
      data: {
        title: String(title).trim(),
        description: values.description || null,
        isPublished: Boolean(values.isPublished),
        testSeriesId: params.testSeriesId,
        position: lastChapter ? lastChapter.position + 1 : 1,
      },
      include: { attachments: true, tests: true },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[TEST_CHAPTERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
