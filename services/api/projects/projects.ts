import { fetcher } from '@/services/fetcher';
import { ApiResponse } from '@/types/api';
import { ProjectWithRelations } from '@/types/project';
import { getBaseUrl } from '@/utils/base-url';

export const getAllProjects = async () => {
    const response = await fetcher<ApiResponse<ProjectWithRelations[]>>(`${getBaseUrl()}/api/project`);
    return response.data;
}