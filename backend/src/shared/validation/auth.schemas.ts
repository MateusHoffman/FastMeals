import { z } from 'zod';
import { emailSchema, passwordSchema } from './common.js';

export const loginBodySchema = z
  .object({
    email: emailSchema,
    password: passwordSchema,
  })
  .strict();

export const refreshBodySchema = z
  .object({
    refreshToken: z.string().min(1),
  })
  .strict();
