import { describe, expect, it } from "vitest";
import { isAllowedCsvUpload, parseQuestionCsv } from "../src/lib/questionImport";

describe("question CSV import parser", () => {
  it("parses comma CSV with quoted cells", () => {
    const result = parseQuestionCsv(
      [
        "categoria,pregunta,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta",
        'Lectura,"Que opcion contiene una coma, y sigue valida?",Uno,Dos,Tres,Cuatro,C'
      ].join("\n")
    );

    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.rows).toHaveLength(1);
      expect(result.rows[0]).toMatchObject({
        categoryName: "Lectura",
        prompt: "Que opcion contiene una coma, y sigue valida?",
        correctOption: "C"
      });
    }
  });

  it("parses semicolon CSV and reports invalid rows", () => {
    const result = parseQuestionCsv(
      [
        "categoria;pregunta;opcion_a;opcion_b;opcion_c;opcion_d;respuesta_correcta",
        "Matematica;Corta;A;B;C;D;Z"
      ].join("\n")
    );

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]).toMatchObject({ line: 2 });
    }
  });

  it("requires all expected headers", () => {
    const result = parseQuestionCsv(["categoria,pregunta", "Lectura,Texto suficiente para validar"].join("\n"));

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.errors[0]?.message).toContain("Faltan columnas");
    }
  });

  it("rejects malformed quotes and mismatched column counts", () => {
    const unclosedQuote = parseQuestionCsv(
      [
        "categoria,pregunta,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta",
        'Lectura,"Pregunta con comilla abierta,Uno,Dos,Tres,Cuatro,A'
      ].join("\n")
    );

    expect(unclosedQuote.ok).toBe(false);
    if (!unclosedQuote.ok) {
      expect(unclosedQuote.errors[0]?.message).toContain("comillas sin cerrar");
    }

    const extraColumn = parseQuestionCsv(
      [
        "categoria,pregunta,opcion_a,opcion_b,opcion_c,opcion_d,respuesta_correcta",
        "Lectura,Pregunta valida para columnas,Uno,Dos,Tres,Cuatro,A,columna extra"
      ].join("\n")
    );

    expect(extraColumn.ok).toBe(false);
    if (!extraColumn.ok) {
      expect(extraColumn.errors[0]?.message).toContain("se esperaban");
    }
  });

  it("accepts only CSV uploads by extension when a filename is present", () => {
    expect(isAllowedCsvUpload({ name: "preguntas.csv", type: "application/octet-stream" })).toBe(true);
    expect(isAllowedCsvUpload({ name: "preguntas.txt", type: "text/csv" })).toBe(false);
    expect(isAllowedCsvUpload({ name: "", type: "text/csv" })).toBe(true);
  });
});
