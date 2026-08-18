import { z } from 'zod';

export const TaskSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1, "Title is required"),
  completed: z.boolean().default(false),
  createdAt: z.number(),
});

export type Task = z.infer<typeof TaskSchema>;
