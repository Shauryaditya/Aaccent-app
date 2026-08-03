import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { isTeacher } from "@/lib/teacher";

export const dynamic = "force-dynamic";

// Lets the mobile app know which role the signed-in user may actually use, so it can
// hide the teacher portal instead of letting someone in and failing later with a 403.
export async function GET() {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    return NextResponse.json({
      userId,
      isTeacher: isTeacher(userId),
    });
  } catch (error) {
    console.log("[ME_GET]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
