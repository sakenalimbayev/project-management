import { Project, Role } from "@/app/generated/prisma";

export type ProjectWithRelations = Omit<Project, 'budget'> & {
  ministry: {
    name: string;
    id: string;
  };
  location: {
    id: string;
    region: string | null;
    city: string | null;
  };
  members: [{
    id: string;
    projectId: string;
    userId: string;
    joinedAt: Date;
    user: {
      id: string;
      createdAt: Date;
      updatedAt: Date;
      firstName: string;
      lastName: string;
      email: string;
      role: Role;
      projectId: string;
      userId: string;
      joinedAt: Date;
    }
  }];
  budget: string;
}

export interface ProjectMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}