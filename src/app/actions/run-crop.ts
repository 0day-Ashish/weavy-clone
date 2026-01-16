"use server";
import { tasks } from "@trigger.dev/sdk/v3";
import type { cropImageTask } from "@/trigger/crop-image";
import { CropSchema } from "@/lib/schemas";

export async function triggerCrop(imageUrl: string, cropData: { x: number, y: number, width: number, height: number }) {
  // validate inputs
  const validation = CropSchema.safeParse({ imageUrl, ...cropData });
  if (!validation.success) {
    return { success: false, error: "Validation Failed: " + validation.error.message };
  }

  try {
    const handle = await tasks.trigger<typeof cropImageTask>("crop-image", {
      imageUrl,
      ...cropData
    });
    return { success: true, runId: handle.id };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}