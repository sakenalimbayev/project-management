import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type CreateQuestionDTO = {
  projectId: string;
  text: string;
};

export async function POST(request: NextRequest) {
  try {
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
      },
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

