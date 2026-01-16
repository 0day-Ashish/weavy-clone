"use server";

import { runs } from "@trigger.dev/sdk/v3";

export async function checkRunStatus(runId: string) {
  try {
    const run = await runs.retrieve(runId);

    if (run.status === "COMPLETED") {
      return { 
        status: "COMPLETED", 
        output: run.output 
      };
    } else if (run.status === "FAILED" || run.status === "CANCELED") {
      return { status: "FAILED", error: run.error };
    }

    return { status: "PENDING" };
    
  } catch (error) {
    return { status: "ERROR", error: "Failed to fetch status" };
  }
}
