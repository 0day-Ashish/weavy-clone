"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { revalidatePath } from "next/cache";

export async function deleteWorkflow(workflowId: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, error: "User not found" };
    }

    // verify ownership before deleting
    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });

    if (!workflow) {
      return { success: false, error: "Workflow not found" };
    }

    if (workflow.userId !== user.id) {
      return { success: false, error: "Unauthorized access to workflow" };
    }

    await prisma.workflow.delete({
      where: { id: workflowId },
    });

    revalidatePath('/'); 
    return { success: true };
    
  } catch (error) {
    console.error("Failed to delete workflow:", error);
    return { success: false, error: "Database Error" };
  }
}
