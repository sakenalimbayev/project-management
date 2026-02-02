import { Ministry } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type CreateMinistryDTO = Omit<Ministry, "createdAt" | "updatedAt" | "id">;

export async function GET(request: NextRequest) {
    try {
        const ministries = await prisma.ministry.findMany();

        return NextResponse.json({ data: ministries })
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
        const body: CreateMinistryDTO = await request.json();
        const project = await prisma.ministry.create({
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
