import { auth } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";

export const dynamic = "force-dynamic";

const loadQuestionForOwner = async (questionId: string, userId: string) => {
  const question = await db.question.findUnique({
    where: { id: questionId },
    include: {
      test: { include: { testChapter: { include: { testSeries: { select: { userId: true } } } } } },
    },
  });

  if (!question) return { question: null, isOwner: false };
  return { question, isOwner: question.test.testChapter.testSeries.userId === userId };
};

export async function PATCH(req: Request, { params }: { params: { questionId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { question, isOwner } = await loadQuestionForOwner(params.questionId, userId);
    if (!question) return new NextResponse("Question not found", { status: 404 });
    if (!isOwner) return new NextResponse("Unauthorized", { status: 403 });

    const body = await req.json();
    const data: any = {};

    if (body.questionText !== undefined) data.questionText = body.questionText;
    if (body.questionType !== undefined) data.questionType = body.questionType;
    if (body.marks !== undefined) data.marks = Number(body.marks);
    if (body.negativeMarks !== undefined) data.negativeMarks = Number(body.negativeMarks);
    if (body.explanation !== undefined) data.explanation = body.explanation;
    if (body.imageUrl !== undefined) data.imageUrl = body.imageUrl;
    if (body.position !== undefined) data.position = Number(body.position);

    // Options are replaced wholesale when supplied, which matches how the editor sends them.
    if (Array.isArray(body.options)) {
      const type = body.questionType || question.questionType;
      if (type === "SINGLE_CHOICE" || type === "MULTIPLE_CHOICE" || type === "TRUE_FALSE") {
        if (body.options.length < 2) {
          return new NextResponse("Choice questions need at least two options", { status: 400 });
        }
        if (!body.options.some((option: any) => option.isCorrect)) {
          return new NextResponse("Mark at least one option as correct", { status: 400 });
        }
        if (type === "SINGLE_CHOICE" && body.options.filter((option: any) => option.isCorrect).length > 1) {
          return new NextResponse("Single choice questions allow only one correct option", { status: 400 });
        }
      }

      data.options = {
        deleteMany: {},
        create: body.options.map((option: any, index: number) => ({
          optionText: option.optionText,
          isCorrect: !!option.isCorrect,
          position: index + 1,
        })),
      };
    }

    const updated = await db.question.update({
      where: { id: params.questionId },
      data,
      include: { options: { orderBy: { position: "asc" } } },
    });

    return NextResponse.json(updated);
  } catch (error) {
    console.log("[QUESTION_PATCH]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { questionId: string } }) {
  try {
    const { userId } = auth();
    if (!userId) return new NextResponse("Unauthorized", { status: 401 });

    const { question, isOwner } = await loadQuestionForOwner(params.questionId, userId);
    if (!question) return new NextResponse("Question not found", { status: 404 });
    if (!isOwner) return new NextResponse("Unauthorized", { status: 403 });

    await db.question.delete({ where: { id: params.questionId } });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.log("[QUESTION_DELETE]", error);
    return new NextResponse("Internal Error", { status: 500 });
  }
}
