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
