export interface ProjectData {
    id: string;
    name: string;
    company: string;
    icon: string;
    iconColor: string;
    members: ProjectMember[];
    budget: string;
    completion: number;
    status: 'working' | 'done' | 'cancelled';
}

export interface ProjectMember {
  id: string;
  name: string;
  avatar: string;
  color: string;
}