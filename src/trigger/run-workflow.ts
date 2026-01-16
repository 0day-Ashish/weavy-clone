import { task } from "@trigger.dev/sdk/v3";
import { GoogleGenerativeAI } from "@google/generative-ai";


const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export const runWorkflowTask = task({
  id: "run-workflow",
  run: async (payload: { prompt: string, model: string }, { ctx }) => {

    console.info("Starting Workflow", { payload });

    const model = genAI.getGenerativeModel({ model: payload.model });
    const result = await model.generateContent(payload.prompt);
    const text = result.response.text();

    return { output: text };
  },
});