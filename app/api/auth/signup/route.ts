import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";

type SignupBody = {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
};

export async function POST(request: NextRequest) {
  try {
    const body: SignupBody = await request.json();
    const email = body.email?.trim().toLowerCase();
    const password = body.password;

    if (!email || !password) {
      return NextResponse.json(
        { error: "Email and password are required" },
        { status: 400 }
      );
    }

    const existing = await prisma.user.findUnique({
      where: { email },
    });

    if (existing) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        firstName: body.firstName?.trim() || null,
        lastName: body.lastName?.trim() || null,
        name:
          [body.firstName, body.lastName]
            .filter((p) => p && p.trim().length > 0)
            .join(" ") || null,
        // role defaults to USER via Prisma
      },
    });

    return NextResponse.json(
      {
        data: { id: user.id, email: user.email },
        message: "User created successfully",
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

