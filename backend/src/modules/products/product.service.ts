import { Prisma } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
import { toProductDto, type ProductDto } from './product.mapper.js';
import type { z } from 'zod';
import type {
  createProductSchema,
  productsQuerySchema,
  updateProductSchema,
} from '../../shared/validation/index.js';

type CreateInput = z.infer<typeof createProductSchema>;
type UpdateInput = z.infer<typeof updateProductSchema>;
type QueryInput = z.infer<typeof productsQuerySchema>;

export async function listProducts(query: QueryInput): Promise<{
  data: ProductDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}> {
  const where: Prisma.ProductWhereInput = {
    deletedAt: null,
    ...(query.category ? { category: query.category } : {}),
    ...(query.isAvailable !== undefined
      ? { isAvailable: query.isAvailable }
      : {}),
    ...(query.search
      ? { name: { contains: query.search, mode: 'insensitive' } }
      : {}),
    ...(query.minPrice !== undefined || query.maxPrice !== undefined
      ? {
          price: {
            ...(query.minPrice !== undefined
              ? { gte: new Prisma.Decimal(query.minPrice) }
              : {}),
            ...(query.maxPrice !== undefined
              ? { lte: new Prisma.Decimal(query.maxPrice) }
              : {}),
          },
        }
      : {}),
  };

  const orderBy: Prisma.ProductOrderByWithRelationInput[] = [
    { [query.sortBy]: query.sortOrder },
    { id: query.sortOrder },
  ];

  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy,
      skip: (query.page - 1) * query.limit,
      take: query.limit,
    }),
  ]);

  return {
    data: rows.map(toProductDto),
    pagination: {
      page: query.page,
      limit: query.limit,
      total,
      totalPages: Math.ceil(total / query.limit) || 1,
    },
  };
}

export async function getProductById(id: string): Promise<ProductDto> {
  const product = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!product) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto nao encontrado');
  }
  return toProductDto(product);
}

export async function createProduct(input: CreateInput): Promise<ProductDto> {
  const product = await prisma.product.create({
    data: {
      name: input.name,
      description: input.description,
      price: new Prisma.Decimal(input.price),
      category: input.category,
      imageUrl: input.imageUrl ?? null,
      isAvailable: input.isAvailable,
      preparationTime: input.preparationTime,
    },
  });
  return toProductDto(product);
}

export async function updateProduct(
  id: string,
  input: UpdateInput,
): Promise<ProductDto> {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto nao encontrado');
  }

  const product = await prisma.product.update({
    where: { id },
    data: {
      ...(input.name !== undefined ? { name: input.name } : {}),
      ...(input.description !== undefined
        ? { description: input.description }
        : {}),
      ...(input.price !== undefined
        ? { price: new Prisma.Decimal(input.price) }
        : {}),
      ...(input.category !== undefined ? { category: input.category } : {}),
      ...(input.imageUrl !== undefined ? { imageUrl: input.imageUrl } : {}),
      ...(input.isAvailable !== undefined
        ? { isAvailable: input.isAvailable }
        : {}),
      ...(input.preparationTime !== undefined
        ? { preparationTime: input.preparationTime }
        : {}),
    },
  });
  return toProductDto(product);
}

export async function deleteProduct(id: string): Promise<void> {
  const existing = await prisma.product.findFirst({
    where: { id, deletedAt: null },
  });
  if (!existing) {
    throw new AppError(404, 'PRODUCT_NOT_FOUND', 'Produto nao encontrado');
  }

  const inUse = await prisma.order.count({
    where: {
      status: { in: ['pending', 'preparing'] },
      items: { some: { productId: id } },
    },
  });
  if (inUse > 0) {
    throw new AppError(
      409,
      'PRODUCT_IN_USE',
      "Nao e possivel deletar este produto pois ele esta vinculado a pedidos com status 'pending' ou 'preparing'",
    );
  }

  await prisma.product.update({
    where: { id },
    data: { deletedAt: new Date(), isAvailable: false },
  });
}
