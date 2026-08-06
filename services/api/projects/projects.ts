import { fetcher } from '@/services/fetcher';
import { ApiResponse } from '@/types/api';
import { ProjectWithRelations } from '@/types/project';
import { getBaseUrl } from '@/utils/base-url';

export const getAllProjects = async () => {
    const response = await fetcher<ApiResponse<ProjectWithRelations[]>>(`${getBaseUrl()}/api/project`);
    return response.data;
}

export const searchProjects = async (query: string, limit = 8) => {
    const params = new URLSearchParams({ q: query, limit: String(limit) });
    const response = await fetcher<ApiResponse<ProjectWithRelations[]>>(`/api/project?${params.toString()}`);
    return response.data;
}

export const getProjectById = async (id: string) => {
    const response = await fetcher<ApiResponse<ProjectWithRelations>>(`${getBaseUrl()}/api/project/${id}`);
    return response.data;
}