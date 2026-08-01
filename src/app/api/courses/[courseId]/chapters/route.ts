import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapters = await db.chapter.findMany({
      where: {
        courseId: params.courseId,
      },
      include: {
        muxData: true,
        attachments: true,
      },
      orderBy: {
        position: "asc",
      },
    });

    return NextResponse.json(chapters);
  } catch (error) {
    console.error("[CHAPTERS_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();
    const { title } = values;

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !String(title).trim()) {
      return new NextResponse("Title is required", { status: 400 });
    }

    const courseOwner = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!courseOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const lastChapter = await db.chapter.findFirst({
      where: {
        courseId: params.courseId,
      },
      orderBy: {
        position: "desc",
      },
    });

    const newPosition = lastChapter ? lastChapter.position + 1 : 1;

    const chapter = await db.chapter.create({
      data: {
        title: String(title).trim(),
        description: values.description || null,
        videoUrl: values.videoUrl || null,
        isFree: Boolean(values.isFree),
        isPublished: Boolean(values.isPublished),
        courseId: params.courseId,
        position: newPosition,
      },
      include: {
        muxData: true,
        attachments: true,
      },
    });

    return NextResponse.json(chapter);
  } catch (error) {
    console.error("[CHAPTERS_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
