import type { Product } from '@prisma/client';
import { decimalToNumber } from '../../shared/utils/decimal.js';

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
  createdAt: string;
  updatedAt: string;
}

export function toProductDto(product: Product): ProductDto {
  return {
    id: product.id,
    name: product.name,
    description: product.description,
    price: decimalToNumber(product.price),
    category: product.category,
    imageUrl: product.imageUrl,
    isAvailable: product.isAvailable,
    preparationTime: product.preparationTime,
    createdAt: product.createdAt.toISOString(),
    updatedAt: product.updatedAt.toISOString(),
  };
}
