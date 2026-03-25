import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type ModerateBody = {
  answer?: string;
  action: "approve" | "reject";
};

export async function PATCH(
  request: NextRequest,
  ctx: { params: Promise<{ id: string }> }
) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    const globalRole = (session?.user as { role?: string })?.role;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id: questionId } = await ctx.params;
    const body: ModerateBody = await request.json();

    if (!body?.action || !["approve", "reject"].includes(body.action)) {
      return NextResponse.json(
        { error: "Invalid action. Use approve or reject." },
        { status: 400 }
      );
    }

    const question = await prisma.question.findUnique({
      where: { id: questionId },
      select: { id: true, projectId: true, status: true },
    });

    if (!question) {
      return NextResponse.json({ error: "Question not found" }, { status: 404 });
    }

    const isGlobalAdmin = globalRole === "ADMIN";
    const membership = await prisma.projectMember.findFirst({
      where: {
        projectId: question.projectId,
        userId,
        role: "PROJECT_ADMINISTRATOR",
      },
    });

    if (!isGlobalAdmin && !membership) {
      return NextResponse.json(
        { error: "Only project administrators can moderate questions." },
        { status: 403 }
      );
    }

    if (body.action === "reject") {
      const updated = await prisma.question.update({
        where: { id: questionId },
        data: {
          status: "REJECTED",
          approvedById: userId,
          approvedAt: new Date(),
        },
      });
      return NextResponse.json({ data: updated });
    }

    const answerTrimmed = body.answer?.trim() ?? "";
    const updated = await prisma.question.update({
      where: { id: questionId },
      data: {
        status: "APPROVED",
        answer: answerTrimmed.length > 0 ? answerTrimmed : null,
        approvedById: userId,
        approvedAt: new Date(),
      },
    });

    return NextResponse.json({ data: updated });
  } catch (error) {
    if (isPrismaError(error)) {
      return NextResponse.json(
        {
          error: "Database error",
          code: error.code,
          message: error.message,
        },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
