// app/api/testseries/[testSeriesId]/route.ts

import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();

    const testSeries = await db.testSeries.findUnique({
      where: { id: params.testSeriesId },
      include: {
        category: true,
        testChapters: {
          where: userId ? undefined : { isPublished: true },
          orderBy: { position: "asc" },
          include: {
            attachments: true,
            submissions: userId ? { where: { userId } } : false,
            tests: {
              where: userId ? undefined : { isPublished: true },
              orderBy: { position: "asc" },
              include: {
                questions: {
                  orderBy: { position: "asc" },
                  include: { options: { orderBy: { position: "asc" } } },
                },
              },
            },
          },
        },
      },
    });

    if (!testSeries) return new NextResponse("Not found", { status: 404 });

    const isOwner = testSeries.userId === userId;
    if (!testSeries.isPublished && !isOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!isOwner) {
      return NextResponse.json({
        ...testSeries,
        testChapters: testSeries.testChapters.filter((chapter) => chapter.isPublished),
      });
    }

    return NextResponse.json(testSeries);
  } catch (error) {
    console.log("[TEST_SERIES_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const testSeries = await db.testSeries.findUnique({
      where: { id: params.testSeriesId, userId },
    });

    if (!testSeries) return new NextResponse("Not found", { status: 404 });

    const deletedTestSeries = await db.testSeries.delete({
      where: { id: params.testSeriesId },
    });

    return NextResponse.json(deletedTestSeries);
  } catch (error) {
    console.log("[TEST_SERIES_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { testSeriesId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const data: Record<string, unknown> = {};
    if (values.title !== undefined) data.title = values.title;
    if (values.description !== undefined) data.description = values.description || null;
    if (values.imageUrl !== undefined) data.imageUrl = values.imageUrl || null;
    if (values.price !== undefined) data.price = values.price === null || values.price === "" ? null : Number(values.price);
    if (values.categoryId !== undefined) data.categoryId = values.categoryId;
    if (values.isPublished !== undefined) data.isPublished = Boolean(values.isPublished);

    const testSeries = await db.testSeries.update({
      where: { id: params.testSeriesId, userId },
      data,
      include: { category: true, testChapters: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(testSeries);
  } catch (error) {
    console.log("[TEST_SERIES_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
