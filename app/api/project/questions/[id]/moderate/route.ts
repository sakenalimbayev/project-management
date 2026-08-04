import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatUserDisplayName, notifyAdmins, notifyUser, resolveActorLabel } from "@/lib/notifications";
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
      select: {
        id: true,
        projectId: true,
        status: true,
        authorId: true,
        author: { select: { name: true, firstName: true, lastName: true, email: true } },
        project: { select: { name: true } },
      },
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

    const actorLabel = resolveActorLabel(
      session?.user as { name?: string | null; email?: string | null; role?: string | null },
      "moderation"
    );
    const authorDisplay = question.author ? formatUserDisplayName(question.author) : "пользователя";

    if (body.action === "reject") {
      const updated = await prisma.question.update({
        where: { id: questionId },
        data: {
          status: "REJECTED",
          approvedById: userId,
          approvedAt: new Date(),
        },
      });

      if (question.authorId) {
        await notifyUser(question.authorId, {
          type: "QUESTION_REJECTED",
          title: "Ответ эксперта",
          message: `Ваш вопрос по проекту "${question.project.name}" был отклонён модератором`,
          category: "Обращения",
          actorLabel,
          important: true,
          projectId: question.projectId,
          questionId: question.id,
        });
      }
      await notifyAdmins({
        type: "QUESTION_REJECTED",
        title: "Ответ эксперта",
        message: `Вопрос пользователя ${authorDisplay} по проекту "${question.project.name}" был отклонён`,
        category: "Обращения",
        actorLabel,
        projectId: question.projectId,
        questionId: question.id,
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

    if (question.authorId) {
      await notifyUser(question.authorId, {
        type: "QUESTION_ANSWERED",
        title: "Ответ эксперта",
        message: `Эксперт ответил на ваш вопрос по проекту "${question.project.name}"`,
        category: "Обращения",
        actorLabel,
        important: true,
        projectId: question.projectId,
        questionId: question.id,
      });
    }
    await notifyAdmins({
      type: "QUESTION_ANSWERED",
      title: "Ответ эксперта",
      message: `Эксперт ответил на вопрос пользователя ${authorDisplay} по проекту "${question.project.name}"`,
      category: "Обращения",
      actorLabel,
      projectId: question.projectId,
      questionId: question.id,
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
