import { haversineKm, roundDistanceKm } from './haversine.js';
import type { OptimizeOrderInput, OptimizePersonInput } from './optimizeAssignment.js';

/**
 * Baseline típico de entregas do desafio: nearest-neighbor greedy por ordem de fila.
 * Usado só para comparação educativa (não é o algoritmo de produção).
 */
export function greedyNearestNeighborTotalKm(
  orders: OptimizeOrderInput[],
  persons: OptimizePersonInput[],
): number {
  if (orders.length === 0 || persons.length === 0) return 0;

  const used = new Set<number>();
  let total = 0;
  const limit = Math.min(orders.length, persons.length);

  for (let i = 0; i < limit; i++) {
    const o = orders[i]!;
    let bestIdx = -1;
    let bestKm = Infinity;
    for (let j = 0; j < persons.length; j++) {
      if (used.has(j)) continue;
      const p = persons[j]!;
      const km = haversineKm(
        p.currentLatitude,
        p.currentLongitude,
        o.latitude,
        o.longitude,
      );
      if (km < bestKm) {
        bestKm = km;
        bestIdx = j;
      }
    }
    if (bestIdx >= 0) {
      used.add(bestIdx);
      total += bestKm;
    }
  }

  return roundDistanceKm(total);
}
