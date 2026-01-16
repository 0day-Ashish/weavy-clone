"use server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { generateContentTask } from "@/trigger/generate-content";
import { LLMGenerationSchema } from "@/lib/schemas";

export async function triggerLLMGeneration(
  prompt: string, 
  model: string, 
  systemPrompt?: string, 
  imageUrls: string[] = [] 
) {
  // validate inputs
  const validation = LLMGenerationSchema.safeParse({ prompt, model, systemPrompt, imageUrls });
  if (!validation.success) {
    return { success: false, error: "Validation Failed: " + validation.error.message };
  }

  try {
    const handle = await tasks.trigger<typeof generateContentTask>("generate-content", {
      prompt,
      model,
      systemPrompt,
      imageUrls 
    });
    return { success: true, runId: handle.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
