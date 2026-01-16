"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma"; 
import { WorkflowSchema } from "@/lib/schemas";

export async function saveWorkflow(name: string, nodes: any[], edges: any[], history: any[], workflowId?: string) { 
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

    // validate data with zod
  const validation = WorkflowSchema.safeParse({ nodes, edges, history });
  if (!validation.success) {
    console.error("❌ Validation Failed:", validation.error.format());
    return { success: false, error: "Invalid workflow data. Check console for details." };
  }

  try {
    const sanitizedHistory = Array.isArray(history) ? history.map((entry: any) => ({
      ...entry,
      timestamp: entry.timestamp ? new Date(entry.timestamp).toISOString() : new Date().toISOString()
    })) : [];

    const user = await prisma.user.upsert({
      where: { clerkId: userId },
      update: {}, 
      create: {
        clerkId: userId,
        email: "placeholder@example.com", 
      },
    });

    if (workflowId) {
        const existing = await prisma.workflow.findUnique({
            where: { id: workflowId }
        });

        if (existing && existing.userId === user.id) {
            await prisma.workflow.update({
                where: { id: workflowId },
                // @ts-ignore - Prisma types might be lagging behind schema update
                data: { name, nodes, edges, history: sanitizedHistory }, 
            });
            return { success: true, id: existing.id };
        }
    }

    const workflow = await prisma.workflow.create({
        data: { 
            userId: user.id, 
            name: name || "Untitled Workflow", 
            nodes, 
            edges, 
            // @ts-ignore - Prisma types might be lagging behind schema update
            history: sanitizedHistory 
        }, 
    });
    return { success: true, id: workflow.id };
    
  } catch (error) {
    console.error("Failed to save workflow:", error);
    // return the actual error message for debugging
    return { success: false, error: error instanceof Error ? error.message : "Database Error" };
  }
}
