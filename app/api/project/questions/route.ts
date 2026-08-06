import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { formatUserDisplayName, notifyAdmins, notifyUser } from "@/lib/notifications";
import { recordAuditLog } from "@/lib/audit-log";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type CreateQuestionDTO = {
  projectId: string;
  text: string;
};

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    const userId = (session?.user as { id?: string })?.id;
    if (!userId) {
      return NextResponse.json(
        { error: "You must be signed in to ask a question." },
        { status: 401 }
      );
    }

    const body: CreateQuestionDTO = await request.json();

    if (!body.projectId || !body.text?.trim()) {
      return NextResponse.json(
        { error: "Missing required fields: projectId and text" },
        { status: 400 }
      );
    }

    const project = await prisma.project.findUnique({
      where: { id: body.projectId },
    });

    if (!project) {
      return NextResponse.json(
        { error: "Project not found" },
        { status: 404 }
      );
    }

    const question = await prisma.question.create({
      data: {
        projectId: body.projectId,
        text: body.text.trim(),
        authorId: userId,
        status: "PENDING",
      },
    });

    const author = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true, firstName: true, lastName: true, email: true },
    });

    await notifyUser(userId, {
      type: "QUESTION_SUBMITTED",
      title: "Вопрос отправлен",
      message: "Ваш вопрос находится на рассмотрении",
      category: "Обращения",
      actorLabel: "system",
      projectId: body.projectId,
      questionId: question.id,
    });

    await notifyAdmins({
      type: "QUESTION_SUBMITTED",
      title: "Новое обращение",
      message: `Поступило новое обращение от пользователя ${author ? formatUserDisplayName(author) : "неизвестного пользователя"}`,
      category: "Обращения",
      actorLabel: "user",
      projectId: body.projectId,
      questionId: question.id,
    });

    await recordAuditLog({
      action: "QUESTION_ADDED",
      projectId: body.projectId,
      questionId: question.id,
      summary: `Новый вопрос по проекту "${project.name}" от ${author ? formatUserDisplayName(author) : "неизвестного пользователя"}`,
      actorLabel: author ? formatUserDisplayName(author) : "user",
      actorId: userId,
    });

    return NextResponse.json(
      {
        data: question,
        message: "Question created successfully",
      },
      { status: 201 }
    );
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
      {
        error: "Internal Server Error",
        details: (error as Error).message,
      },
      { status: 500 }
    );
  }
}

