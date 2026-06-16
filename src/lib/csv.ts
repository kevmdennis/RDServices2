export const PLACE_ID_COLUMN_ALIASES = [
  "place_id",
  "google_id",
  "google_place_id",
  "placeid",
] as const;

export type CsvRow = Record<string, string>;

export type ParsedCsv = {
  headers: string[];
  rows: CsvRow[];
  placeIdColumn: string | null;
};

export type RowValidation = {
  row: CsvRow;
  index: number;
  placeId: string | null;
  isValid: boolean;
};

export function normalizeColumnName(name: string): string {
  return name.trim().toLowerCase().replace(/\s+/g, "_");
}

export function findPlaceIdColumn(headers: string[]): string | null {
  const normalizedHeaders = headers.map((header) => ({
    original: header,
    normalized: normalizeColumnName(header),
  }));

  for (const alias of PLACE_ID_COLUMN_ALIASES) {
    const match = normalizedHeaders.find((header) => header.normalized === alias);
    if (match) {
      return match.original;
    }
  }

  return null;
}

export function parseCsv(text: string): ParsedCsv {
  const rows = parseCsvRows(text);

  if (rows.length === 0) {
    return { headers: [], rows: [], placeIdColumn: null };
  }

  const headers = rows[0];
  const dataRows = rows.slice(1).map((cells) => {
    const row: CsvRow = {};
    headers.forEach((header, index) => {
      row[header] = cells[index] ?? "";
    });
    return row;
  });

  return {
    headers,
    rows: dataRows,
    placeIdColumn: findPlaceIdColumn(headers),
  };
}

export function validateRows(
  rows: CsvRow[],
  placeIdColumn: string | null,
): RowValidation[] {
  return rows.map((row, index) => {
    const placeId =
      placeIdColumn !== null ? row[placeIdColumn]?.trim() ?? "" : "";

    return {
      row,
      index,
      placeId: placeId || null,
      isValid: placeId.length > 0,
    };
  });
}

function parseCsvRows(text: string): string[][] {
  const rows: string[][] = [];
  let currentRow: string[] = [];
  let currentCell = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const char = text[i];
    const nextChar = text[i + 1];

    if (inQuotes) {
      if (char === '"' && nextChar === '"') {
        currentCell += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        currentCell += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ",") {
      currentRow.push(currentCell);
      currentCell = "";
    } else if (char === "\r" && nextChar === "\n") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
      i++;
    } else if (char === "\n" || char === "\r") {
      currentRow.push(currentCell);
      rows.push(currentRow);
      currentRow = [];
      currentCell = "";
    } else {
      currentCell += char;
    }
  }

  if (currentCell.length > 0 || currentRow.length > 0) {
    currentRow.push(currentCell);
    rows.push(currentRow);
  }

  return rows.filter((row) => row.some((cell) => cell.trim().length > 0));
}
