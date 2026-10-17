import { z } from 'zod';

export const uuidSchema = z.string().uuid();

export const emailSchema = z
  .string()
  .email()
  .transform((s) => s.toLowerCase().trim());

export const passwordSchema = z.string().min(1).max(128);

export const phoneSchema = z
  .string()
  .regex(/^\(\d{2}\) \d{5}-\d{4}$/, 'Telefone invalido');

export const productCategorySchema = z.enum([
  'meal',
  'drink',
  'dessert',
  'side',
]);

export const vehicleTypeSchema = z.enum(['bicycle', 'motorcycle', 'car']);

export const orderStatusSchema = z.enum([
  'pending',
  'preparing',
  'ready',
  'delivering',
  'delivered',
  'cancelled',
]);

export const dateOnlySchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/)
  .refine((d) => !Number.isNaN(Date.parse(`${d}T00:00:00.000Z`)), {
    message: 'Data invalida',
  });
