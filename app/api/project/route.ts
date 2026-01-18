import { Project } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type CreateProjectDTO = Pick<Project, "name" | "description" | "ownerId">;

export async function POST(request: NextRequest) {
  try {
    const body: CreateProjectDTO = await request.json();
    const project = await prisma.project.create({
      data: body,
    });

    return NextResponse.json({ project });
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
