import { ApiResponse } from "@/types/api";
import { ProjectWithRelations } from "@/types/project";

type ProjectDocument = NonNullable<ProjectWithRelations["documents"]>[number];

export const uploadProjectDocuments = async (
  projectId: string,
  files: File[],
  documentTypes?: (string | null)[]
) => {
  const formData = new FormData();
  files.forEach((file) => formData.append("files", file));
  if (documentTypes) {
    formData.append("documentTypes", JSON.stringify(documentTypes));
  }

  const res = await fetch(`/api/project/${projectId}/documents`, {
    method: "POST",
    body: formData,
  });

  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(body?.error ?? `Request failed (${res.status})`);
  }

  return (body as ApiResponse<ProjectDocument[]>).data;
};
