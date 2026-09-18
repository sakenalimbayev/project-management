import { Download, FileText } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UploadProjectDocumentsDialog } from "@/components/dialog/upload-project-documents-dialog";
import { formatFileSize } from "@/lib/format-file-size";
import type { ProjectWithRelations } from "@/types/project";

type ProjectDocumentsSectionProps = {
  projectId: string;
  documents: NonNullable<ProjectWithRelations["documents"]>;
  canEdit: boolean;
};

export function ProjectDocumentsSection({
  projectId,
  documents,
  canEdit,
}: ProjectDocumentsSectionProps) {
  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle>Подтверждающие документы</CardTitle>
          {canEdit ? <UploadProjectDocumentsDialog projectId={projectId} /> : null}
        </div>
      </CardHeader>
      <CardContent>
        {documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">Документы не загружены.</p>
        ) : (
          <ul className="space-y-2">
            {documents.map((doc) => (
              <li
                key={doc.id}
                className="flex items-center justify-between gap-3 rounded-md border p-3"
              >
                <div className="flex min-w-0 items-center gap-3">
                  <FileText className="h-5 w-5 shrink-0 text-blue-500" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium">{doc.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {doc.documentType ? `${doc.documentType} · ` : ""}
                      {formatFileSize(doc.fileSize)} ·{" "}
                      {new Date(doc.createdAt).toLocaleDateString("ru-RU")}
                    </p>
                  </div>
                </div>
                <a
                  href={doc.fileUrl}
                  download={doc.fileName}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="shrink-0 rounded-md p-2 text-muted-foreground hover:bg-accent hover:text-foreground"
                  aria-label={`Скачать ${doc.fileName}`}
                >
                  <Download className="h-4 w-4" />
                </a>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
