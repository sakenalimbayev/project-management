import { User } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type CreateUserDTO = Omit<User, "createdAt" | "updatedAt" | "id">;

export async function GET() {
  try {
    const users = await prisma.user.findMany();

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
