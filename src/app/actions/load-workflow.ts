"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";
import { WorkflowSchema } from "@/lib/schemas"; 

export async function loadWorkflow(workflowId?: string) {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
        where: { clerkId: userId },
    });
  
    if (!user) {
        return { success: false, data: null, error: "User not found" };
    }

    let workflow;
    if (workflowId) {
      workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });
      // verify ownership
      if (workflow && workflow.userId !== user.id) {
        return { success: false, error: "Unauthorized access to workflow" };
      }
    } else {
      workflow = await prisma.workflow.findFirst({
        where: { userId: user.id },
        orderBy: { createdAt: 'desc' },
      });
    }

    if (!workflow) {
      return { success: false, data: null };
    }

    // zod validation start
    // we treat the DB data as "unknown" first, then let Zod parse it
    const cleanData = WorkflowSchema.safeParse({
      nodes: workflow.nodes,
      edges: workflow.edges,
      // @ts-ignore - Prisma types might be lagging behind schema update
      history: workflow.history || [], 
    });

    if (!cleanData.success) {
      console.error("Corrupted Workflow Data:", cleanData.error);
      // return empty instead of crashing the app
      return { success: false, error: "Save file corrupted", data: null };
    }

    // return the guaranteed valid data
    return { 
      success: true, 
      data: {
        id: workflow.id, 
        name: workflow.name, 
        nodes: cleanData.data.nodes, 
        edges: cleanData.data.edges,
        history: cleanData.data.history || [] 
      }
    };
    // zod validation end
    
  } catch (error) {
    console.error("Failed to load workflow:", error);
    return { success: false, error: "Database Error" };
  }
}
