import { z } from 'zod';
import { productCategorySchema } from './common.js';

export const createProductSchema = z
  .object({
    name: z.string().trim().min(3).max(120),
    description: z.string().min(10).max(500),
    price: z.number().positive().max(99_999_999.99),
    category: productCategorySchema,
    imageUrl: z.string().url().max(500).optional(),
    preparationTime: z.number().int().min(1).max(120),
    isAvailable: z.boolean().optional().default(true),
  })
  .strict();

export const updateProductSchema = z
  .object({
    name: z.string().trim().min(3).max(120).optional(),
    description: z.string().min(10).max(500).optional(),
    price: z.number().positive().max(99_999_999.99).optional(),
    category: productCategorySchema.optional(),
    imageUrl: z.string().url().max(500).nullable().optional(),
    preparationTime: z.number().int().min(1).max(120).optional(),
    isAvailable: z.boolean().optional(),
  })
  .strict()
  .refine((obj) => Object.keys(obj).length > 0, {
    message: 'Body nao pode ser vazio',
  });

export const productsQuerySchema = z
  .object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    search: z.string().optional(),
    category: productCategorySchema.optional(),
    isAvailable: z
      .enum(['true', 'false'])
      .optional()
      .transform((v) => (v === undefined ? undefined : v === 'true')),
    minPrice: z.coerce.number().nonnegative().optional(),
    maxPrice: z.coerce.number().positive().optional(),
    sortBy: z
      .enum([
        'name',
        'price',
        'createdAt',
        'category',
        'preparationTime',
        'isAvailable',
      ])
      .optional()
      .default('createdAt'),
    sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  })
  .strict()
  .refine(
    (q) =>
      q.minPrice === undefined ||
      q.maxPrice === undefined ||
      q.minPrice <= q.maxPrice,
    { message: 'minPrice deve ser <= maxPrice' },
  );
