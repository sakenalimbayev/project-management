export type YearlyBudgetInput = {
  year: string | number;
  plannedAmount: string | number;
  actualAmount?: string | number;
};

export type ValidatedYearlyBudget = {
  year: number;
  plannedAmount: string;
  actualAmount: string;
};

export type ValidateYearlyBudgetResult = {
  error?: string;
  entries: ValidatedYearlyBudget[];
};

/** Shared by project creation and future budget editors: validates each yearly budget row. */
export function validateYearlyBudget(
  entries: YearlyBudgetInput[]
): ValidateYearlyBudgetResult {
  const result: ValidatedYearlyBudget[] = [];
  const seenYears = new Set<number>();

  for (let i = 0; i < entries.length; i++) {
    const e = entries[i];
    const year = Number(e?.year);
    if (!Number.isInteger(year) || year < 2000 || year > 2100) {
      return { error: `Бюджет по годам, строка ${i + 1}: укажите корректный год.`, entries: [] };
    }
    if (seenYears.has(year)) {
      return { error: `Бюджет по годам: год ${year} указан более одного раза.`, entries: [] };
    }
    seenYears.add(year);

    const planned = Number(e.plannedAmount);
    if (Number.isNaN(planned) || planned < 0) {
      return {
        error: `Бюджет по годам, ${year}: плановая сумма должна быть неотрицательным числом.`,
        entries: [],
      };
    }

    const actualRaw = e.actualAmount;
    const actual = actualRaw === undefined || actualRaw === "" ? 0 : Number(actualRaw);
    if (Number.isNaN(actual) || actual < 0) {
      return {
        error: `Бюджет по годам, ${year}: фактическая сумма должна быть неотрицательным числом.`,
        entries: [],
      };
    }

    result.push({ year, plannedAmount: planned.toString(), actualAmount: actual.toString() });
  }

  return { entries: result };
}
