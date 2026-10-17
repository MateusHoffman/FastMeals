import { z } from 'zod';
import { phoneSchema, vehicleTypeSchema } from './common.js';

export const createDeliveryPersonSchema = z
  .object({
    name: z.string().trim().min(3).max(100),
    phone: phoneSchema,
    vehicleType: vehicleTypeSchema,
    isActive: z.boolean().optional(),
    currentLatitude: z.number().min(-90).max(90).nullable().optional(),
    currentLongitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict()
  .refine(
    (d) => {
      const lat = d.currentLatitude;
      const lng = d.currentLongitude;
      if (lat === undefined && lng === undefined) return true;
      if (lat === null && lng === null) return true;
      if (lat != null && lng != null) return true;
      return false;
    },
    { message: 'Coordenadas devem ser ambas nulas ou ambas preenchidas' },
  );

export const updateDeliveryPersonSchema = z
  .object({
    name: z.string().trim().min(3).max(100).optional(),
    phone: phoneSchema.optional(),
    vehicleType: vehicleTypeSchema.optional(),
    isActive: z.boolean().optional(),
    currentLatitude: z.number().min(-90).max(90).nullable().optional(),
    currentLongitude: z.number().min(-180).max(180).nullable().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Body nao pode ser vazio',
  });

export const deliveryPersonsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    isActive: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
    available: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
    sortBy: z
      .enum(['name', 'createdAt', 'vehicleType'])
      .optional()
      .default('name'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  })
  .strict();
