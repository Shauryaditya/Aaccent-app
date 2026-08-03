import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";
export async function GET(
  req: Request,
) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const mine = searchParams.get("mine") === "true";
    const userId = mine ? auth().userId : null;

    if (mine && !userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const courses = await db.course.findMany({
      where: {
        ...(mine ? { userId: userId! } : { isPublished: true }),
        ...(categoryId ? { categoryId } : {}),
        ...(title ? { title: { contains: title, mode: "insensitive" } } : {}),
      },
      include: {
        category: true,
        chapters: {
          where: mine ? undefined : { isPublished: true },
          orderBy: { position: "asc" },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(courses);
  } catch (error) {
    console.log("[COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}


export async function POST(
  req: Request,
) {
  try {
    const { userId } = auth();
    const { title } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    // Nested routes derive permission from owning the parent course, but creation has
    // no parent — without this check any signed-in user could create courses.
    if (!isTeacher(userId)) {
      return new NextResponse("Only teachers can create courses", { status: 403 });
    }

    const course = await db.course.create({
      data: {
        userId,
        title,
      }
    });

    return NextResponse.json(course);
  } catch (error) {
    console.log("[COURSES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
