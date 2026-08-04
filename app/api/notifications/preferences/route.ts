import { auth } from "@/auth";
import { prisma } from "@/lib/prisma";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";
import { NotificationPreferenceDTO } from "@/types/notification";

const DEFAULT_PREFERENCES: NotificationPreferenceDTO = {
    email: true,
    push: true,
    sms: false,
    slack: false,
};

export async function GET() {
    try {
        const session = await auth();
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const preference = await prisma.notificationPreference.findUnique({
            where: { userId },
        });

        const data: NotificationPreferenceDTO = preference
            ? {
                email: preference.email,
                push: preference.push,
                sms: preference.sms,
                slack: preference.slack,
            }
            : DEFAULT_PREFERENCES;

        return NextResponse.json({ data });
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

export async function PATCH(request: NextRequest) {
    try {
        const session = await auth();
        const userId = (session?.user as { id?: string })?.id;
        if (!userId) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const body: Partial<NotificationPreferenceDTO> = await request.json();
        const patch: Partial<NotificationPreferenceDTO> = {};
        (["email", "push", "sms", "slack"] as const).forEach((key) => {
            if (typeof body[key] === "boolean") patch[key] = body[key];
        });

        const updated = await prisma.notificationPreference.upsert({
            where: { userId },
            create: { userId, ...DEFAULT_PREFERENCES, ...patch },
            update: patch,
        });

        const data: NotificationPreferenceDTO = {
            email: updated.email,
            push: updated.push,
            sms: updated.sms,
            slack: updated.slack,
        };

        return NextResponse.json({ data });
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
