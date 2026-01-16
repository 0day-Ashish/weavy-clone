"use server";

import { auth } from "@clerk/nextjs/server";
import { prisma } from "@/lib/prisma";

export async function listWorkflows() {
  const { userId } = await auth();
  if (!userId) return { success: false, error: "Unauthorized" };

  try {
    const user = await prisma.user.findUnique({
      where: { clerkId: userId },
    });

    if (!user) {
      return { success: false, data: [] };
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: user.id },
      select: {
        id: true,
        name: true,
        updatedAt: true,
      },
      orderBy: { updatedAt: 'desc' },
    });

    return { success: true, data: workflows };
  } catch (error) {
    console.error("Failed to list workflows:", error);
    return { success: false, error: "Database Error" };
  }
}
