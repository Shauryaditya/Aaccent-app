import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const title = searchParams.get("title") || undefined;
    const categoryId = searchParams.get("categoryId") || undefined;
    const mine = searchParams.get("mine") === "true";
    const userId = mine ? auth().userId : null;

    if (mine && !userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const testSeries = await db.testSeries.findMany({
      where: {
        ...(mine ? { userId: userId! } : { isPublished: true }),
        ...(categoryId ? { categoryId } : {}),
        ...(title ? { title: { contains: title, mode: "insensitive" } } : {}),
      },
      include: {
        category: true,
        testChapters: {
          where: mine ? undefined : { isPublished: true },
          orderBy: { position: "asc" },
          include: {
            tests: {
              where: mine ? undefined : { isPublished: true },
              orderBy: { position: "asc" },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(testSeries);
  } catch (error) {
    console.log("[TESTSERIES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const { title, categoryId } = await req.json();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!title || !categoryId) {
      return new NextResponse("Title and Category are required", { status: 400 });
    }

    const testseries = await db.testSeries.create({
      data: {
        userId,
        title,
        categoryId,
      }
    });

    return NextResponse.json(testseries);
  } catch (error) {
    console.log("[TESTSERIES]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
