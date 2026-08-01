import { db } from "@/lib/db";
import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: { courseId: string; chapterId: string } }
) {
  try {
    const { userId } = auth();
    const { url, name } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!url || !String(url).trim()) {
      return new NextResponse("Attachment URL is required", { status: 400 });
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

    const attachment = await db.attachment.create({
      data: {
        url: String(url).trim(),
        name: name?.trim() || String(url).split("/").pop() || "Attachment",
        courseId: params.courseId,
        chapterId: params.chapterId,
      },
    });

    return NextResponse.json(attachment);
  } catch (error) {
    console.log("COURSE_ATTACHMENT_ERROR:", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
