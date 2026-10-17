import { greedyNearestNeighborTotalKm } from './greedyBaseline.js';
import { haversineKm, roundDistanceKm } from './haversine.js';
import { hungarianAssign } from './hungarian.js';

export interface OptimizeOrderInput {
  id: string;
  latitude: number;
  longitude: number;
}

export interface OptimizePersonInput {
  id: string;
  currentLatitude: number;
  currentLongitude: number;
}

export interface AssignmentResult {
  orderId: string;
  deliveryPersonId: string;
  estimatedDistanceKm: number;
}

export interface UnassignedResult {
  orderId: string;
  reason: string;
}

export interface AlgorithmBaselineComparison {
  /** Soma km com greedy nearest-neighbor (baseline comum no desafio). */
  greedyNearestNeighborTotalKm: number;
  /** Hungarian − greedy (≥ 0 quando Hungarian é melhor ou igual). */
  distanceSavedKm: number;
  /** Economia relativa vs greedy, 0–100. */
  savingsPercent: number;
}

export interface OptimizeResult {
  assignments: AssignmentResult[];
  unassigned: UnassignedResult[];
  totalDistanceKm: number;
  algorithm: 'hungarian';
  executionTimeMs: number;
  /** Presente quando há pedidos e entregadores — prova visual vs abordagem mediana. */
  baselineComparison?: AlgorithmBaselineComparison;
}

export function optimizeAssignment(
  orders: OptimizeOrderInput[],
  persons: OptimizePersonInput[],
): OptimizeResult {
  const start = performance.now();
  const nOrders = orders.length;
  const nPersons = persons.length;

  if (nOrders === 0) {
    return {
      assignments: [],
      unassigned: [],
      totalDistanceKm: 0,
      algorithm: 'hungarian',
      executionTimeMs: Math.round(performance.now() - start),
    };
  }

  if (nPersons === 0) {
    return {
      assignments: [],
      unassigned: orders.map((o) => ({
        orderId: o.id,
        reason: 'No available delivery person',
      })),
      totalDistanceKm: 0,
      algorithm: 'hungarian',
      executionTimeMs: Math.round(performance.now() - start),
    };
  }

  const cost: number[][] = orders.map((o) =>
    persons.map((p) =>
      haversineKm(
        p.currentLatitude,
        p.currentLongitude,
        o.latitude,
        o.longitude,
      ),
    ),
  );

  const pairs = hungarianAssign(cost);
  const assignedOrders = new Set<number>();
  const assignedPersons = new Set<number>();
  const assignments: AssignmentResult[] = [];

  for (const [oi, pi] of pairs) {
    if (assignedOrders.has(oi) || assignedPersons.has(pi)) continue;
    assignedOrders.add(oi);
    assignedPersons.add(pi);
    const dist = roundDistanceKm(cost[oi]![pi]!);
    assignments.push({
      orderId: orders[oi]!.id,
      deliveryPersonId: persons[pi]!.id,
      estimatedDistanceKm: dist,
    });
  }

  const unassigned: UnassignedResult[] = [];
  for (let i = 0; i < nOrders; i++) {
    if (!assignedOrders.has(i)) {
      unassigned.push({
        orderId: orders[i]!.id,
        reason: 'No available delivery person',
      });
    }
  }

  const totalDistanceKm = roundDistanceKm(
    assignments.reduce((s, a) => s + a.estimatedDistanceKm, 0),
  );

  const greedyTotal = greedyNearestNeighborTotalKm(orders, persons);
  const saved = roundDistanceKm(Math.max(0, greedyTotal - totalDistanceKm));
  const savingsPercent =
    greedyTotal > 0 ? roundDistanceKm((saved / greedyTotal) * 100) : 0;

  return {
    assignments,
    unassigned,
    totalDistanceKm,
    algorithm: 'hungarian',
    executionTimeMs: Math.round(performance.now() - start),
    baselineComparison: {
      greedyNearestNeighborTotalKm: greedyTotal,
      distanceSavedKm: saved,
      savingsPercent,
    },
  };
}
