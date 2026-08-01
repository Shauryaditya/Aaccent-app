import Mux from "@mux/mux-node";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const mux = new Mux({
  tokenId: process.env["MUX_TOKEN_ID"],
  tokenSecret: process.env["MUX_TOKEN_SECRET"],
});

export async function GET(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
      },
      include: {
        category: true,
        attachments: true,
        purchases: userId ? { where: { userId } } : false,
        chapters: {
          include: {
            muxData: true,
            attachments: true,
            userProgress: userId ? { where: { userId } } : false,
          },
          orderBy: {
            position: "asc",
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    if (!course.isPublished && course.userId !== userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const publishedChapters = course.chapters.filter((chapter) => chapter.isPublished);
    const completedChapters = publishedChapters.filter(
      (chapter) => chapter.userProgress?.[0]?.isCompleted
    );
    const progress = publishedChapters.length === 0
      ? 0
      : Math.round((completedChapters.length / publishedChapters.length) * 100);
    const canAccessProgress = course.userId === userId || course.purchases.length > 0;

    return NextResponse.json({
      ...course,
      progress: canAccessProgress ? progress : undefined,
    });
  } catch (error) {
    console.log("[COURSE_ID_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
      include: {
        chapters: {
          include: {
            muxData: true,
          },
        },
      },
    });

    if (!course) {
      return new NextResponse("Course not found", { status: 404 });
    }

    for (const chapter of course.chapters) {
      if (chapter.muxData?.assetId) {
        try {
          await mux.video.assets.delete(chapter.muxData.assetId);
        } catch (error) {
          console.log("[MUX_ASSET_DELETE_ERROR]", error);
        }
      }
    }

    const deletedCourse = await db.course.delete({
      where: {
        id: params.courseId,
      },
    });

    return NextResponse.json(deletedCourse);
  } catch (error) {
    console.log("[COURSE_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const course = await db.course.update({
      where: {
        id: params.courseId,
        userId,
      },
      data: {
        ...values,
      },
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSE_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
