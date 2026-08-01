import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";

import { db } from "@/lib/db";

export async function GET() {
  try {
    const { userId } = auth();

    if (!userId) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const purchases = await db.purchase.findMany({
      where: {
        userId,
      },
      include: {
        course: {
          include: {
            category: true,
            chapters: {
              where: {
                isPublished: true,
              },
              include: {
                userProgress: {
                  where: {
                    userId,
                  },
                },
              },
              orderBy: {
                position: "asc",
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
    });

    return NextResponse.json(purchases.map((purchase) => purchase.course));
  } catch (error) {
    console.log("[PURCHASED_COURSES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
