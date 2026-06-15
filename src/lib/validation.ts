import { z } from "zod";

export const correctOptionSchema = z.enum(["A", "B", "C", "D"]);

export const categorySchema = z.object({
  name: z.string().trim().min(2, "El nombre debe tener al menos 2 caracteres.").max(150)
});

export const questionSchema = z.object({
  categoryId: z.coerce.number().int().positive("Selecciona una categoria."),
  prompt: z.string().trim().min(8, "La pregunta debe tener al menos 8 caracteres."),
  optionA: z.string().trim().min(1, "La opcion A es obligatoria."),
  optionB: z.string().trim().min(1, "La opcion B es obligatoria."),
  optionC: z.string().trim().min(1, "La opcion C es obligatoria."),
  optionD: z.string().trim().min(1, "La opcion D es obligatoria."),
  correctOption: correctOptionSchema
});

export const settingsSchema = z.object({
  adminUsername: z.string().trim().min(3, "El usuario debe tener al menos 3 caracteres.").max(100),
  password: z
    .string()
    .trim()
    .optional()
    .refine((value) => !value || value.length >= 8, "La nueva contrasena debe tener al menos 8 caracteres."),
  questionsPerGame: z.coerce.number().int().min(1).max(100)
});

export function formString(formData: FormData, key: string): string {
  const value = formData.get(key);
  return typeof value === "string" ? value : "";
}
