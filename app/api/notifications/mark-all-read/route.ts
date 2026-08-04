import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextResponse } from "next/server";

export async function POST() {
    try {
        const session = await auth();
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        await prisma.notification.updateMany({
            where: { recipientId: userId, readAt: null },
            data: { readAt: new Date() },
        });

        return NextResponse.json({ data: { success: true } });
    } catch (error) {
        if (isPrismaError(error)) {
            return NextResponse.json(
                { error: "Database error", code: error.code, message: error.message },
                { status: 400 }
            );
        }
        return NextResponse.json(
            { error: "Internal Server Error", details: (error as Error).message },
            { status: 500 }
        );
    }
}
