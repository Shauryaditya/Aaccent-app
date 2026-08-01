import Mux from "@mux/mux-node";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

const mux = new Mux({
  tokenId: process.env["MUX_TOKEN_ID"],
  tokenSecret: process.env["MUX_TOKEN_SECRET"],
});

const isYouTubeUrl = (url: string) => /(?:youtube\.com|youtu\.be)/i.test(url);

export async function GET(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();

    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      include: {
        muxData: true,
        attachments: true,
        userProgress: userId ? { where: { userId } } : false,
        course: {
          select: {
            userId: true,
            isPublished: true,
          },
        },
      },
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    const isOwner = chapter.course.userId === userId;
    if ((!chapter.course.isPublished || !chapter.isPublished) && !isOwner) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[COURSE_CHAPTER_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const chapter = await db.chapter.findUnique({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      include: {
        muxData: true,
      },
    });

    if (!chapter) {
      return new NextResponse("Chapter not found", { status: 404 });
    }

    if (chapter.muxData?.assetId) {
      try {
        await mux.video.assets.delete(chapter.muxData.assetId);
      } catch (error) {
        console.log("[MUX_ASSET_DELETE_ERROR]", error);
      }
    }

    const deletedChapter = await db.chapter.delete({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
    });

    const publishedChaptersInCourse = await db.chapter.findMany({
      where: {
        courseId: params.courseId,
        isPublished: true,
      },
    });

    if (!publishedChaptersInCourse.length) {
      await db.course.update({
        where: {
          id: params.courseId,
        },
        data: {
          isPublished: false,
        },
      });
    }

    return NextResponse.json(deletedChapter);
  } catch (error) {
    console.log("[CHAPTER_ID_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const ownCourse = await db.course.findUnique({
      where: {
        id: params.courseId,
        userId,
      },
    });

    if (!ownCourse) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const data: Record<string, unknown> = {};
    if (values.title !== undefined) data.title = values.title;
    if (values.description !== undefined) data.description = values.description || null;
    if (values.videoUrl !== undefined) data.videoUrl = values.videoUrl || null;
    if (values.isFree !== undefined) data.isFree = Boolean(values.isFree);
    if (values.isPublished !== undefined) data.isPublished = Boolean(values.isPublished);

    const chapter = await db.chapter.update({
      where: {
        id: params.chapterId,
        courseId: params.courseId,
      },
      data,
      include: {
        muxData: true,
        attachments: true,
      },
    });

    if (values.videoUrl && !isYouTubeUrl(values.videoUrl)) {
      const existingMuxData = await db.muxData.findFirst({
        where: {
          chapterId: params.chapterId,
        },
      });

      if (existingMuxData) {
        try {
          await mux.video.assets.delete(existingMuxData.assetId);
        } catch (error) {
          console.log("[MUX_ASSET_REPLACE_ERROR]", error);
        }
        await db.muxData.delete({
          where: {
            id: existingMuxData.id,
          },
        });
      }

      const asset = await mux.video.assets.create({
        input: values.videoUrl,
        playback_policy: ["public"],
        test: false,
      });

      await db.muxData.create({
        data: {
          chapterId: params.chapterId,
          assetId: asset.id,
          playbackId: asset.playback_ids?.[0]?.id,
        },
      });
    }

    return NextResponse.json(chapter);
  } catch (error) {
    console.log("[COURSES_CHAPTER_ID]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

