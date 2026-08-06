/** Minimal RFC4180-ish CSV parser: handles quoted fields, embedded commas/newlines, and doubled-quote escaping. */
export function parseCSV(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  const s = text.replace(/\r\n/g, "\n").replace(/\r/g, "\n");

  for (let i = 0; i < s.length; i++) {
    const char = s[i];
    if (inQuotes) {
      if (char === '"') {
        if (s[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      row.push(field);
      field = "";
    } else if (char === "\n") {
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((r) => !(r.length === 1 && r[0].trim() === ""));
}

export function escapeCSVField(value: string): string {
  return `"${value.replace(/"/g, '""')}"`;
}

export function stringifyCSV(headers: string[], rows: string[][]): string {
  const lines = [headers.map(escapeCSVField).join(",")];
  for (const r of rows) lines.push(r.map((v) => escapeCSVField(v)).join(","));
  return lines.join("\n");
}
