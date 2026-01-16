"use server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { extractFrameTask } from "@/trigger/extract-frame";
import { ExtractSchema } from "@/lib/schemas";

export async function triggerExtract(videoUrl: string, timestamp: string) {
  // validate inputs
  const validation = ExtractSchema.safeParse({ videoUrl, timestamp });
  if (!validation.success) {
    return { success: false, error: "Validation Failed: " + validation.error.message };
  }

  try {
    const handle = await tasks.trigger<typeof extractFrameTask>("extract-frame", {
      videoUrl,
      timestamp
    });
    return { success: true, runId: handle.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}
