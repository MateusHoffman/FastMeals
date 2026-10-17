export interface OrderItemDto {
  id: string;
  product: { id: string; name: string };
  quantity: number;
  unitPrice: number;
}

export interface OrderDto {
  id: string;
  customerName: string;
  customerPhone: string;
  deliveryAddress: string;
  latitude: number;
  longitude: number;
  status: string;
  totalAmount: number;
  deliveryPerson: {
    id: string;
    name: string;
    phone: string;
    vehicleType: string;
  } | null;
  items: OrderItemDto[];
  createdAt: string;
  updatedAt: string;
}

export interface PaginatedOrdersDto {
  data: OrderDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface OrderStatusHistoryDto {
  id: string;
  fromStatus: string | null;
  toStatus: string;
  changedByUserId: string | null;
  changedByEmail: string | null;
  createdAt: string;
}

export interface ProductDto {
  id: string;
  name: string;
  description: string;
  price: number;
  category: string;
  imageUrl: string | null;
  isAvailable: boolean;
  preparationTime: number;
}

export interface DeliveryPersonDto {
  id: string;
  name: string;
  phone: string;
  vehicleType: string;
  isActive: boolean;
  currentLatitude: number | null;
  currentLongitude: number | null;
  currentOrderId: string | null;
}

export interface PaginatedDeliveryPersonsDto {
  data: DeliveryPersonDto[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

export interface AssignmentSuggestion {
  orderId: string;
  deliveryPersonId: string;
  estimatedDistanceKm: number;
  orderAddress?: string;
  deliveryPersonName?: string;
}

export interface AlgorithmBaselineComparisonDto {
  greedyNearestNeighborTotalKm: number;
  distanceSavedKm: number;
  savingsPercent: number;
}

export interface OptimizeAssignmentResult {
  assignments: AssignmentSuggestion[];
  unassigned: Array<{ orderId: string; reason: string; orderAddress?: string }>;
  totalDistanceKm: number;
  algorithm: string;
  executionTimeMs: number;
  baselineComparison?: AlgorithmBaselineComparisonDto;
}

export interface AcceptAssignmentsBatchResult {
  accepted: string[];
  failed: Array<{ orderId: string; code: string; message: string }>;
}
