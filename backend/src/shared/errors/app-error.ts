export type ErrorCode =
  | 'VALIDATION_ERROR'
  | 'INVALID_CREDENTIALS'
  | 'TOKEN_EXPIRED'
  | 'INVALID_TOKEN'
  | 'INVALID_REFRESH_TOKEN'
  | 'FORBIDDEN'
  | 'PRODUCT_NOT_FOUND'
  | 'ORDER_NOT_FOUND'
  | 'DELIVERY_PERSON_NOT_FOUND'
  | 'ROUTE_NOT_FOUND'
  | 'PRODUCT_IN_USE'
  | 'DELIVERY_PERSON_IN_USE'
  | 'INVALID_STATUS_TRANSITION'
  | 'UNAVAILABLE_PRODUCT'
  | 'DELIVERY_PERSON_UNAVAILABLE'
  | 'RATE_LIMIT_EXCEEDED'
  | 'INTERNAL_ERROR';

export interface ErrorDetail {
  field?: string;
  message?: string;
  productId?: string;
  productName?: string;
  reason?: string;
}

export class AppError extends Error {
  constructor(
    public readonly statusCode: number,
    public readonly code: ErrorCode,
    message: string,
    public readonly details?: ErrorDetail[],
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export function errorEnvelope(
  code: ErrorCode,
  message: string,
  details?: ErrorDetail[],
) {
  return {
    error: {
      code,
      message,
      ...(details && details.length > 0 ? { details } : {}),
    },
  };
}
