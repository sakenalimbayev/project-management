import { User } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

type CreateUserDTO = Pick<User, "firstName" | "lastName" | "email" | "role">;

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
