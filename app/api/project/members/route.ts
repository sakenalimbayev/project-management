import { Project } from "@/app/generated/prisma";
import { prisma } from "@/lib/prisma";
import { ProjectWithRelations } from "@/types/project";
import { isPrismaError } from "@/utils/is-prisma-error";
import { NextRequest, NextResponse } from "next/server";

type AddTeamMemberDTO = {
    projectId: string;
    userId: string;
}

export async function POST(request: NextRequest) {
    try {
        const body: AddTeamMemberDTO = await request.json();

        // Validate required fields
        if (!body.projectId || !body.userId) {
            return NextResponse.json(
                { error: "Missing required fields: projectId and userId" },
                { status: 400 }
            );
        }

        // Verify project exists
        const project = await prisma.project.findUnique({
            where: { id: body.projectId }
        });

        if (!project) {
            return NextResponse.json(
                { error: "Project not found" },
                { status: 404 }
            );
        }

        // Verify user exists
        const user = await prisma.user.findUnique({
            where: { id: body.userId }
        });

        if (!user) {
            return NextResponse.json(
                { error: "User not found" },
                { status: 404 }
            );
        }

        // Add user to project
        const projectMember = await prisma.projectMember.create({
            data: {
                projectId: body.projectId,
                userId: body.userId
            },
            include: {
                user: true
            }
        });

        return NextResponse.json({ 
            data: projectMember,
            message: "Team member added successfully" 
        }, { status: 201 });
    } catch (error) {
        if (isPrismaError(error)) {
            // Handle unique constraint violation (user already a member)
            if (error.code === 'P2002') {
                return NextResponse.json(
                    { error: "User is already a member of this project" },
                    { status: 409 }
                );
            }
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
