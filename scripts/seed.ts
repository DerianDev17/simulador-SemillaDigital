import {
  createCategory,
  createQuestion,
  ensureDefaultSettings,
  findQuestionByCategoryAndPrompt,
  updateQuestion
} from "../src/lib/store";

ensureDefaultSettings();

const categoryId = createCategory("Razonamiento demo");

const demoQuestions = [
  {
    categoryId,
    prompt: "Si una serie aumenta de 3 en 3 y empieza en 4, cual es el cuarto termino?",
    optionA: "10",
    optionB: "12",
    optionC: "13",
    optionD: "15",
    correctOption: "C" as const,
    imagePath: "/demo/questions/156222.png"
  },
  {
    categoryId,
    prompt: "Que opcion completa la analogia: libro es a leer como cuaderno es a...",
    optionA: "escribir",
    optionB: "borrar",
    optionC: "calcular",
    optionD: "subrayar",
    correctOption: "A" as const,
    imagePath: "/demo/questions/200484.png"
  },
  {
    categoryId,
    prompt: "Un estudiante responde 8 de 10 preguntas correctamente. Cual es su porcentaje?",
    optionA: "60%",
    optionB: "70%",
    optionC: "80%",
    optionD: "90%",
    correctOption: "C" as const,
    imagePath: "/demo/questions/244149.png"
  }
];

for (const question of demoQuestions) {
  const existing = findQuestionByCategoryAndPrompt(categoryId, question.prompt);
  if (!existing) {
    createQuestion(question);
  } else if (existing.imagePath !== question.imagePath) {
    updateQuestion(existing.id, question);
  }
}

console.log("Seed completed. Admin user: admin / admin");
