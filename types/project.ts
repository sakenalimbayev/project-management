import { Project, Role, ProjectMemberRole, QuestionStatus } from "@/app/generated/prisma";

export type ProjectStageStatus = "PLANNED" | "IN_PROGRESS" | "COMPLETED";

export type ProjectWithRelations = Omit<Project, 'budget'> & {
  ministry: {
    name: string;
    id: string;
  };
  location: {
    id: string;
    region: string | null;
    city: string | null;
    latitude: number | null;
    longitude: number | null;
  };
  members: {
    id: string;
    projectId: string;
    userId: string;
    joinedAt: Date;
    role: ProjectMemberRole;
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      firstName: string | null;
      lastName: string | null;
      name?: string | null;
      email: string;
      role: Role;
      avatar: string | null;
      image?: string | null;
      projectId: string;
      userId: string;
      joinedAt: Date;
    };
  }[];
  questions: {
    id: string;
    projectId: string;
    authorId: string | null;
    text: string;
    answer: string | null;
    status: QuestionStatus;
    approvedAt: Date | null;
    approvedById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }[];
  stages?: {
    id: string;
    projectId: string;
    label: string;
    startDate: string;
    endDate: string;
    status: ProjectStageStatus;
    sortOrder: number;
    createdAt: Date;
    updatedAt: Date;
  }[];
  budget: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}