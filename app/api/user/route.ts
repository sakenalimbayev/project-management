import { User } from "@/app/generated/prisma";
import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type CreateUserDTO = Omit<User, "createdAt" | "updatedAt" | "id">;

const userListSelect = {
  id: true,
  firstName: true,
  lastName: true,
  name: true,
  email: true,
  avatar: true,
  image: true,
  role: true,
} as const;

export async function GET(request: NextRequest) {
  try {
    const session = await auth();
    if (!(session?.user as { id?: string })?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const q = request.nextUrl.searchParams.get("q")?.trim();

    const users = await prisma.user.findMany({
      where: q
        ? {
            OR: [
              { firstName: { contains: q, mode: "insensitive" } },
              { lastName: { contains: q, mode: "insensitive" } },
              { name: { contains: q, mode: "insensitive" } },
              { email: { contains: q, mode: "insensitive" } },
            ],
          }
        : undefined,
      select: userListSelect,
      take: q ? 20 : undefined,
    });

    return NextResponse.json({ data: users })
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
    const body: CreateUserDTO = await request.json();
    const user = await prisma.user.create({
      data: body,
    });

    return NextResponse.json({ user });
  } catch (error) {
    return NextResponse.json(
      { error: "Internal Server Error", details: (error as Error).message },
      { status: 500 }
    );
  }
}
