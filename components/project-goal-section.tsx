import { Target } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ProjectWithRelations } from "@/types/project";

type ProjectGoalSectionProps = {
  goal: string | null;
  kpis: NonNullable<ProjectWithRelations["kpis"]>;
};

export function ProjectGoalSection({ goal, kpis }: ProjectGoalSectionProps) {
  if (!goal && kpis.length === 0) return null;

  return (
    <Card className="mx-auto w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="h-4 w-4 text-blue-500" />
          Цель проекта и показатели
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {goal && <p className="text-sm leading-7 text-gray-700">{goal}</p>}
        {kpis.length > 0 && (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[420px] text-left text-sm">
              <thead>
                <tr className="border-b text-xs text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">Показатель</th>
                  <th className="py-2 pr-3 font-medium">Исходное</th>
                  <th className="py-2 pr-3 font-medium">Целевое</th>
                  <th className="py-2 font-medium">Ед. изм.</th>
                </tr>
              </thead>
              <tbody>
                {kpis.map((kpi) => (
                  <tr key={kpi.id} className="border-b last:border-0">
                    <td className="py-2 pr-3">{kpi.name}</td>
                    <td className="py-2 pr-3">{kpi.baselineValue}</td>
                    <td className="py-2 pr-3">{kpi.targetValue}</td>
                    <td className="py-2 text-muted-foreground">{kpi.unit ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
