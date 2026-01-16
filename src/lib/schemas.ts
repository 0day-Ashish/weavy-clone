import { z } from "zod";

export const NodeSchema = z.object({
  id: z.string(),
  type: z.string(), 
  position: z.object({
    x: z.number(),
    y: z.number(),
  }),
  data: z.record(z.string(), z.any()), // allows any object inside 'data'
  measured: z.any().optional(), // react flow internal property
  selected: z.boolean().optional(),
  dragging: z.boolean().optional(),
});

export const EdgeSchema = z.object({
  id: z.string(),
  source: z.string(),
  target: z.string(),
  sourceHandle: z.string().optional().nullable(),
  targetHandle: z.string().optional().nullable(),
  animated: z.boolean().optional(),
});

// define history schema
export const HistoryEntrySchema = z.object({
  id: z.string(),
  nodeType: z.string(),
  status: z.enum(['pending', 'success', 'failed']),
  // ensure we always get a Date object back, handling both ISO strings (from JSON) and Date objects
  timestamp: z.preprocess((arg) => {
    if (typeof arg === 'string' || arg instanceof Date) return new Date(arg);
    return arg;
  }, z.date()), 
  details: z.string().optional(),
});

// define the full workflow response
export const WorkflowSchema = z.object({
  nodes: z.array(NodeSchema),
  edges: z.array(EdgeSchema),
  history: z.array(HistoryEntrySchema).optional(), 
});

// new action schemas

export const LLMGenerationSchema = z.object({
  prompt: z.string().min(1, "Prompt cannot be empty"),
  model: z.string(),
  systemPrompt: z.string().optional(),
  imageUrls: z.array(z.string()).optional(),
});

export const CropSchema = z.object({
  imageUrl: z.string().url("Invalid image URL"),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const ExtractSchema = z.object({
  videoUrl: z.string().url("Invalid video URL"),
  timestamp: z.string(), // ffmpeg accepts strings like "00:00:05" or "5"
});
