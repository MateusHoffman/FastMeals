import { z } from 'zod';
import {
  dateOnlySchema,
  orderStatusSchema,
  phoneSchema,
  uuidSchema,
} from './common.js';

export const ordersQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    status: orderStatusSchema.optional(),
    search: z.string().trim().min(1).max(100).optional(),
    customerPhone: z.string().trim().min(1).max(20).optional(),
    deliveryPersonId: uuidSchema.optional(),
    sortBy: z
      .enum([
        'createdAt',
        'totalAmount',
        'status',
        'customerName',
        'updatedAt',
        'deliveredAt',
      ])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
    startDate: dateOnlySchema.optional(),
    endDate: dateOnlySchema.optional(),
  })
  .strict()
  .refine(
    (q) =>
      !q.startDate ||
      !q.endDate ||
      q.startDate <= q.endDate,
    { message: 'startDate deve ser <= endDate' },
  );

export const createOrderSchema = z
  .object({
    customerName: z.string().trim().min(3).max(100),
    customerPhone: phoneSchema,
    deliveryAddress: z.string().min(10).max(300),
    latitude: z.number().min(-90).max(90),
    longitude: z.number().min(-180).max(180),
    items: z
      .array(
        z
          .object({
            productId: uuidSchema,
            quantity: z.number().int().positive().max(2_147_483_647),
          })
          .strict(),
      )
      .min(1),
  })
  .strict();

export const patchStatusSchema = z
  .object({
    status: orderStatusSchema,
  })
  .strict();

export const assignSchema = z
  .object({
    deliveryPersonId: uuidSchema,
  })
  .strict();

export const acceptAssignmentsBatchSchema = z
  .object({
    assignments: z
      .array(
        z
          .object({
            orderId: uuidSchema,
            deliveryPersonId: uuidSchema,
          })
          .strict(),
      )
      .min(1)
      .max(100),
  })
  .strict();
