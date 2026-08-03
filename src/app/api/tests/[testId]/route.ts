import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const loadTestForOwner = async (testId: string, userId: string) => {
  const test = await db.test.findUnique({
    where: { id: testId },
    include: { testChapter: { include: { testSeries: { select: { userId: true } } } } },
  });

  if (!test) return { test: null, isOwner: false };
  return { test, isOwner: test.testChapter.testSeries.userId === userId };
};

export async function GET(req: Request, { params }: { params: { testId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { test, isOwner } = await loadTestForOwner(params.testId, userId);
    if (!test) return new NextResponse("Test not found", { status: 404 });
    if (!isOwner && !test.isPublished) {
      return new NextResponse("Test not found", { status: 404 });
    }

    return NextResponse.json(test);
  } catch (error) {
    console.log("[TEST_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(req: Request, { params }: { params: { testId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { test, isOwner } = await loadTestForOwner(params.testId, userId);
    if (!test) return new NextResponse("Test not found", { status: 404 });
    if (!isOwner) return new NextResponse("Unauthorized", { status: 403 });

    const body = await req.json();
    const data: any = {};

    if (body.title !== undefined) data.title = body.title;
    if (body.description !== undefined) data.description = body.description;
    if (body.duration !== undefined) data.duration = Number(body.duration);
    if (body.totalMarks !== undefined) data.totalMarks = Number(body.totalMarks);
    if (body.passingMarks !== undefined) {
      data.passingMarks = body.passingMarks === null ? null : Number(body.passingMarks);
    }
    if (body.testMode !== undefined) data.testMode = body.testMode;
    if (body.isFree !== undefined) data.isFree = !!body.isFree;
    if (body.position !== undefined) data.position = Number(body.position);
    if (body.isPublished !== undefined) data.isPublished = !!body.isPublished;

    const updated = await db.test.update({
      where: { id: params.testId },
      data,
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[TEST_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { testId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { test, isOwner } = await loadTestForOwner(params.testId, userId);
    if (!test) return new NextResponse("Test not found", { status: 404 });
    if (!isOwner) return new NextResponse("Unauthorized", { status: 403 });

    await db.test.delete({ where: { id: params.testId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[TEST_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
