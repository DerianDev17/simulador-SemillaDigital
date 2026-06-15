import { z } from "zod";
import { correctOptionSchema } from "./validation";

const requiredColumns = {
  categoryName: ["categoria", "category", "category_name", "nombre_categoria"],
  prompt: ["pregunta", "question", "prompt", "enunciado"],
  optionA: ["opcion_a", "opciona", "option_a", "optiona", "a"],
  optionB: ["opcion_b", "opcionb", "option_b", "optionb", "b"],
  optionC: ["opcion_c", "opcionc", "option_c", "optionc", "c"],
  optionD: ["opcion_d", "opciond", "option_d", "optiond", "d"],
  correctOption: ["respuesta_correcta", "opcion_correcta", "correct_option", "correcta", "respuesta", "correct"]
} as const;

const importQuestionSchema = z.object({
  categoryName: z.string().trim().min(2, "La categoria debe tener al menos 2 caracteres.").max(150),
  prompt: z.string().trim().min(8, "La pregunta debe tener al menos 8 caracteres."),
  optionA: z.string().trim().min(1, "La opcion A es obligatoria."),
  optionB: z.string().trim().min(1, "La opcion B es obligatoria."),
  optionC: z.string().trim().min(1, "La opcion C es obligatoria."),
  optionD: z.string().trim().min(1, "La opcion D es obligatoria."),
  correctOption: correctOptionSchema
});

export type ParsedImportQuestion = z.infer<typeof importQuestionSchema>;

export type ImportParseError = {
  line: number;
  message: string;
};

export type ParseQuestionCsvResult =
  | {
      ok: true;
      rows: ParsedImportQuestion[];
      rowCount: number;
    }
  | {
      ok: false;
      errors: ImportParseError[];
      rowCount: number;
    };

type CsvParseResult = {
  rows: string[][];
  error?: ImportParseError;
};

export function isAllowedCsvUpload(file: Pick<File, "name" | "type">): boolean {
  const name = file.name.trim().toLowerCase();
  if (name) {
    return name.endsWith(".csv");
  }

  return ["text/csv", "application/csv", "application/vnd.ms-excel"].includes(file.type.trim().toLowerCase());
}

function normalizeHeader(value: string): string {
  return value
    .replace(/^\uFEFF/, "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/[\s-]+/g, "_");
}

function normalizeOption(value: string): string {
  return value.trim().toUpperCase();
}

function countDelimiter(line: string, delimiter: "," | ";"): number {
  let count = 0;
  let quoted = false;

  for (let index = 0; index < line.length; index += 1) {
    const char = line[index];
    const next = line[index + 1];

    if (char === '"' && quoted && next === '"') {
      index += 1;
    } else if (char === '"') {
      quoted = !quoted;
    } else if (char === delimiter && !quoted) {
      count += 1;
    }
  }

  return count;
}

function detectDelimiter(text: string): "," | ";" {
  const firstLine = text.split(/\r?\n/, 1)[0] ?? "";
  return countDelimiter(firstLine, ";") > countDelimiter(firstLine, ",") ? ";" : ",";
}

function parseCsv(text: string, delimiter: "," | ";"): CsvParseResult {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;
  let line = 1;
  let quoteStartLine = 1;

  for (let index = 0; index < text.length; index += 1) {
    const char = text[index];
    const next = text[index + 1];

    if (char === '"' && quoted && next === '"') {
      cell += '"';
      index += 1;
      continue;
    }

    if (char === '"') {
      if (!quoted) {
        quoteStartLine = line;
      }
      quoted = !quoted;
      continue;
    }

    if ((char === "\n" || char === "\r") && quoted) {
      cell += "\n";
      line += 1;
      if (char === "\r" && next === "\n") {
        index += 1;
      }
      continue;
    }

    if (char === delimiter && !quoted) {
      row.push(cell.trim());
      cell = "";
      continue;
    }

    if ((char === "\n" || char === "\r") && !quoted) {
      row.push(cell.trim());
      rows.push(row);
      row = [];
      cell = "";

      if (char === "\r" && next === "\n") {
        index += 1;
      }
      line += 1;
      continue;
    }

    cell += char;
  }

  if (quoted) {
    return {
      rows,
      error: {
        line: quoteStartLine,
        message: "Hay comillas sin cerrar en el CSV."
      }
    };
  }

  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    rows.push(row);
  }

  return { rows };
}

function rowIsEmpty(row: string[]): boolean {
  return row.every((cell) => cell.trim().length === 0);
}

function findColumn(headers: string[], aliases: readonly string[]): number {
  return headers.findIndex((header) => aliases.includes(header));
}

export function parseQuestionCsv(text: string): ParseQuestionCsvResult {
  const cleanText = text.trim();
  if (!cleanText) {
    return { ok: false, errors: [{ line: 1, message: "El archivo CSV esta vacio." }], rowCount: 0 };
  }

  const delimiter = detectDelimiter(cleanText);
  const parsedCsv = parseCsv(cleanText, delimiter);
  if (parsedCsv.error) {
    return { ok: false, errors: [parsedCsv.error], rowCount: 0 };
  }

  const rows = parsedCsv.rows.filter((row) => !rowIsEmpty(row));
  if (rows.length < 2) {
    return {
      ok: false,
      errors: [{ line: 1, message: "Incluye encabezados y al menos una fila de preguntas." }],
      rowCount: 0
    };
  }

  const headers = (rows[0] ?? []).map(normalizeHeader);
  const columnIndexes = {
    categoryName: findColumn(headers, requiredColumns.categoryName),
    prompt: findColumn(headers, requiredColumns.prompt),
    optionA: findColumn(headers, requiredColumns.optionA),
    optionB: findColumn(headers, requiredColumns.optionB),
    optionC: findColumn(headers, requiredColumns.optionC),
    optionD: findColumn(headers, requiredColumns.optionD),
    correctOption: findColumn(headers, requiredColumns.correctOption)
  };

  const missingColumns = Object.entries(columnIndexes)
    .filter(([, index]) => index === -1)
    .map(([key]) => key);

  if (missingColumns.length > 0) {
    return {
      ok: false,
      errors: [
        {
          line: 1,
          message:
            "Faltan columnas obligatorias: categoria, pregunta, opcion_a, opcion_b, opcion_c, opcion_d, respuesta_correcta."
        }
      ],
      rowCount: rows.length - 1
    };
  }

  const errors: ImportParseError[] = [];
  const parsedRows: ParsedImportQuestion[] = [];
  const seen = new Set<string>();

  for (const [index, row] of rows.slice(1).entries()) {
    const line = index + 2;
    if (row.length !== headers.length) {
      errors.push({
        line,
        message: `La fila tiene ${row.length} columnas y se esperaban ${headers.length}. Usa comillas para textos con separadores.`
      });
      continue;
    }

    const candidate = {
      categoryName: row[columnIndexes.categoryName] ?? "",
      prompt: row[columnIndexes.prompt] ?? "",
      optionA: row[columnIndexes.optionA] ?? "",
      optionB: row[columnIndexes.optionB] ?? "",
      optionC: row[columnIndexes.optionC] ?? "",
      optionD: row[columnIndexes.optionD] ?? "",
      correctOption: normalizeOption(row[columnIndexes.correctOption] ?? "")
    };

    const parsed = importQuestionSchema.safeParse(candidate);
    if (!parsed.success) {
      errors.push({
        line,
        message: parsed.error.issues[0]?.message ?? "Fila invalida."
      });
      continue;
    }

    const duplicateKey = `${parsed.data.categoryName.toLowerCase()}::${parsed.data.prompt.toLowerCase()}`;
    if (seen.has(duplicateKey)) {
      errors.push({
        line,
        message: "La pregunta esta duplicada dentro del archivo."
      });
      continue;
    }

    seen.add(duplicateKey);
    parsedRows.push(parsed.data);
  }

  if (errors.length > 0) {
    return { ok: false, errors, rowCount: rows.length - 1 };
  }

  return { ok: true, rows: parsedRows, rowCount: rows.length - 1 };
}
