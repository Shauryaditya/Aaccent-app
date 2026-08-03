

import { NextResponse } from "next/server";
import { auth } from "@clerk/nextjs";
import { db } from "@/lib/db";
import { isTeacher } from "@/lib/teacher";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category") || undefined;
    const type = searchParams.get("type") || undefined;
    const subject = searchParams.get("subject") || undefined;
    const grade = searchParams.get("grade") || undefined;
    const year = searchParams.get("year");
    const title = searchParams.get("title") || undefined;

    const resources = await db.resource.findMany({
      where: {
        ...(category ? { category: category as any } : {}),
        ...(type ? { type: type as any } : {}),
        ...(subject ? { subject: { equals: subject, mode: "insensitive" } } : {}),
        ...(grade ? { grade } : {}),
        ...(year ? { year: Number(year) } : {}),
        ...(title ? { title: { contains: title, mode: "insensitive" } } : {}),
      },
      orderBy: [{ year: "desc" }, { createdAt: "desc" }],
    });

    return NextResponse.json(resources);
  } catch (error) {
    console.log("[RESOURCES_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const { userId } = auth();
    const values = await req.json();

    if (!userId || !isTeacher(userId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    const resource = await db.resource.create({
      data: {
        ...values,
      },
    });

    return NextResponse.json(resource);
  } catch (error) {
    console.log("[RESOURCES_POST]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { resourceId: string } }
) {
  try {
    const { userId } = auth();
    const { searchParams } = new URL(req.url);
    const resourceId = searchParams.get("resourceId");

    if (!userId || !isTeacher(userId)) {
      return new NextResponse("Unauthorized", { status: 401 });
    }

    if (!resourceId) {
        return new NextResponse("Resource ID missing", { status: 400 });
    }

    const deletedResource = await db.resource.delete({
      where: {
        id: resourceId,
      },
    });

    return NextResponse.json(deletedResource);
  } catch (error) {
    console.log("[RESOURCE_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
