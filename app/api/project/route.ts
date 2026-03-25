import { Project, ProjectStatus } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/auth";

type CreateProjectDTO = Omit<Project, "createdAt" | "updatedAt" | "id">;

export async function GET() {
  try {
    const projects = await prisma.project.findMany({
      include: {
        members: {
          include: {
            user: true
          }
        },
        ministry: true,
        location: true
      }
    });

    const serializedProjects = projects.map(project => ({
      ...project,
      budget: project.budget.toString(),
    }));

    return NextResponse.json({ data: serializedProjects })
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

export async function POST(request: NextRequest) {
  try {
    const session = await auth();

    if (!session?.user || (session.user as any).role !== "ADMIN") {
      return NextResponse.json(
        { error: "Not authorized" },
        { status: 403 }
      );
    }

    const body: CreateProjectDTO = await request.json();

    // Ensure ownerId comes from the authenticated admin user
    const ownerId = (session.user as any).id as string | undefined;
    if (!ownerId) {
      return NextResponse.json(
        { error: "Owner information missing" },
        { status: 400 }
      );
    }

    const project = await prisma.project.create({
      data: {
        ...body,
        ownerId,
        status: (body as any).status ?? ProjectStatus.PLANNED,
      },
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
