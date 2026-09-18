export type KpiInput = {
  name: string;
  baselineValue: string;
  targetValue: string;
  unit?: string | null;
};

export type ValidatedKpi = {
  name: string;
  baselineValue: string;
  targetValue: string;
  unit: string | null;
};

export type ValidateKpisResult = {
  error?: string;
  kpis: ValidatedKpi[];
};

/** Shared by project creation and future KPI editors: validates each KPI row. */
export function validateKpis(kpis: KpiInput[]): ValidateKpisResult {
  const result: ValidatedKpi[] = [];

  for (let i = 0; i < kpis.length; i++) {
    const k = kpis[i];
    if (!k?.name?.trim()) {
      return { error: `Показатель ${i + 1}: укажите наименование.`, kpis: [] };
    }
    if (!k.baselineValue?.trim()) {
      return { error: `Показатель ${i + 1}: укажите исходное значение.`, kpis: [] };
    }
    if (!k.targetValue?.trim()) {
      return { error: `Показатель ${i + 1}: укажите целевое значение.`, kpis: [] };
    }

    result.push({
      name: k.name.trim(),
      baselineValue: k.baselineValue.trim(),
      targetValue: k.targetValue.trim(),
      unit: k.unit?.trim() || null,
    });
  }

  return { kpis: result };
}
