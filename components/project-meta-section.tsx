import { Info } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import type {
  ProjectScale,
  ProjectType,
  ProjectVisibility,
} from "@/app/generated/prisma";
import { PROJECT_TYPE_LABELS } from "@/lib/project-type";
import { PROJECT_SCALE_LABELS } from "@/lib/project-scale";
import {
  PROJECT_VISIBILITY_BADGE_CLASSES,
  PROJECT_VISIBILITY_LABELS,
} from "@/lib/project-visibility";

type ProjectMetaSectionProps = {
  shortName: string | null;
  category: string | null;
  projectType: ProjectType | null;
  scale: ProjectScale | null;
  responsibleOrganization: string | null;
  projectManagerName: string | null;
  officialContactEmail: string | null;
  startDate: Date | string | null;
  plannedEndDate: Date | string | null;
  actualEndDate: Date | string | null;
  infoAsOfDate: Date | string | null;
  nextUpdateDate: Date | string | null;
  visibility: ProjectVisibility;
};

function formatDate(value: Date | string | null): string {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("ru-RU");
}

function Row({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-3 py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className="text-right font-medium text-gray-900">{value}</span>
    </div>
  );
}

export function ProjectMetaSection({
  shortName,
  category,
  projectType,
  scale,
  responsibleOrganization,
  projectManagerName,
  officialContactEmail,
  startDate,
  plannedEndDate,
  actualEndDate,
  infoAsOfDate,
  nextUpdateDate,
  visibility,
}: ProjectMetaSectionProps) {
  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="flex items-center gap-2">
            <Info className="h-4 w-4 text-blue-500" />
            Сведения о проекте
          </CardTitle>
          <span
            className={cn(
              "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium whitespace-nowrap",
              PROJECT_VISIBILITY_BADGE_CLASSES[visibility]
            )}
          >
            {PROJECT_VISIBILITY_LABELS[visibility]}
          </span>
        </div>
      </CardHeader>
      <CardContent className="divide-y">
        {shortName && <Row label="Краткое название" value={shortName} />}
        {category && <Row label="Категория" value={category} />}
        {projectType && <Row label="Тип проекта" value={PROJECT_TYPE_LABELS[projectType]} />}
        {scale && <Row label="Масштаб" value={PROJECT_SCALE_LABELS[scale]} />}
        {responsibleOrganization && (
          <Row label="Подведомственная организация" value={responsibleOrganization} />
        )}
        {projectManagerName && <Row label="Руководитель проекта" value={projectManagerName} />}
        {officialContactEmail && <Row label="Официальный контакт" value={officialContactEmail} />}
        <Row label="Дата начала" value={formatDate(startDate)} />
        <Row label="Плановое завершение" value={formatDate(plannedEndDate)} />
        {actualEndDate && <Row label="Фактическое завершение" value={formatDate(actualEndDate)} />}
        <Row label="Актуально на" value={formatDate(infoAsOfDate)} />
        {nextUpdateDate && <Row label="Следующее обновление" value={formatDate(nextUpdateDate)} />}
      </CardContent>
    </Card>
  );
}
