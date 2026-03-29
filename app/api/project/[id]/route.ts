import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  ctx: RouteContext<"/api/project/[id]">
) {
  try {
    const { id } = await ctx.params;
    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        members: {
          include: {
            user: true
          }
        },
        ministry: true,
        location: true,
        stages: {
          orderBy: { sortOrder: "asc" },
        },
        questions: {
          where: { status: "APPROVED" },
          orderBy: { createdAt: "desc" },
        },
      }
    });

    if (!project) {
      return NextResponse.json({
        error: 'Project not found',
        message: `Project with ID ${id} was not found`
      }, {
        status: 404
      })
    }

    const serializedProject = {
      ...project,
      totalBudget: project.totalBudget.toString(),
      spentAmount: project.spentAmount.toString(),
    };

    return NextResponse.json({ data: serializedProject });
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
