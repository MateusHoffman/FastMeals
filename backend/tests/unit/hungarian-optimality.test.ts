import { describe, it, expect } from 'vitest';
import {
  optimizeAssignment,
  type OptimizeOrderInput,
  type OptimizePersonInput,
} from '../../src/algorithms/optimizeAssignment.js';
import { hungarianAssign } from '../../src/algorithms/hungarian.js';
import { haversineKm } from '../../src/algorithms/haversine.js';

function rawKm(
  order: OptimizeOrderInput,
  person: OptimizePersonInput,
): number {
  return haversineKm(
    person.currentLatitude,
    person.currentLongitude,
    order.latitude,
    order.longitude,
  );
}

/** Mesma agregação de pares que `optimizeAssignment`, soma contínua (pré-arredondamento). */
function hungarianRawTotal(
  orders: OptimizeOrderInput[],
  persons: OptimizePersonInput[],
): number {
  const cost = orders.map((o) =>
    persons.map((p) => rawKm(o, p)),
  );
  const pairs = hungarianAssign(cost);
  const assignedOrders = new Set<number>();
  const assignedPersons = new Set<number>();
  let sum = 0;
  for (const [oi, pi] of pairs) {
    if (assignedOrders.has(oi) || assignedPersons.has(pi)) continue;
    assignedOrders.add(oi);
    assignedPersons.add(pi);
    sum += cost[oi]![pi]!;
  }
  return sum;
}

function* combinations(items: number[], k: number): Generator<number[]> {
  if (k === 0) {
    yield [];
    return;
  }
  if (items.length < k) return;
  const [head, ...tail] = items;
  for (const rest of combinations(tail, k - 1)) {
    yield [head!, ...rest];
  }
  yield* combinations(tail, k);
}

function permute(arr: number[]): number[][] {
  if (arr.length <= 1) return [arr];
  const out: number[][] = [];
  for (let i = 0; i < arr.length; i++) {
    const head = arr[i]!;
    const rest = arr.slice(0, i).concat(arr.slice(i + 1));
    for (const p of permute(rest)) {
      out.push([head, ...p]);
    }
  }
  return out;
}

/** Minimum soma Haversine contínua (n,m ≤ 7). */
function bruteForceMinRawTotal(
  orders: OptimizeOrderInput[],
  persons: OptimizePersonInput[],
): number {
  const n = orders.length;
  const m = persons.length;
  if (n === 0 || m === 0) return 0;

  let best = Infinity;

  if (n <= m) {
    const orderIdx = orders.map((_, i) => i);
    for (const personCombo of combinations(
      persons.map((_, i) => i),
      n,
    )) {
      for (const personPerm of permute(personCombo)) {
        let sum = 0;
        for (let i = 0; i < n; i++) {
          sum += rawKm(orders[orderIdx[i]!]!, persons[personPerm[i]!]!);
        }
        best = Math.min(best, sum);
      }
    }
  } else {
    for (const orderCombo of combinations(
      orders.map((_, i) => i),
      m,
    )) {
      const personPerm = persons.map((_, i) => i);
      for (const p of permute(personPerm)) {
        let sum = 0;
        for (let i = 0; i < m; i++) {
          sum += rawKm(orders[orderCombo[i]!]!, persons[p[i]!]!);
        }
        best = Math.min(best, sum);
      }
    }
  }

  return best;
}

function pseudoRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 2 ** 32;
  };
}

function randomScenario(
  seed: number,
  maxOrders: number,
  maxPersons: number,
): { orders: OptimizeOrderInput[]; persons: OptimizePersonInput[] } {
  const rnd = pseudoRandom(seed);
  const n = 1 + Math.floor(rnd() * maxOrders);
  const m = 1 + Math.floor(rnd() * maxPersons);
  const orders: OptimizeOrderInput[] = Array.from({ length: n }, (_, i) => ({
    id: `o-${seed}-${i}`,
    latitude: -23.5 + rnd() * 0.2,
    longitude: -46.6 + rnd() * 0.2,
  }));
  const persons: OptimizePersonInput[] = Array.from({ length: m }, (_, i) => ({
    id: `p-${seed}-${i}`,
    currentLatitude: -23.55 + rnd() * 0.2,
    currentLongitude: -46.65 + rnd() * 0.2,
  }));
  return { orders, persons };
}

describe('optimizeAssignment optimality (brute force)', () => {
  it('matches brute force on fixed small cases', () => {
    const orders: OptimizeOrderInput[] = [
      { id: 'a', latitude: -23.55, longitude: -46.63 },
      { id: 'b', latitude: -23.56, longitude: -46.64 },
    ];
    const persons: OptimizePersonInput[] = [
      {
        id: 'p1',
        currentLatitude: -23.551,
        currentLongitude: -46.631,
      },
      {
        id: 'p2',
        currentLatitude: -23.57,
        currentLongitude: -46.65,
      },
      {
        id: 'p3',
        currentLatitude: -23.54,
        currentLongitude: -46.62,
      },
    ];
    expect(hungarianRawTotal(orders, persons)).toBe(
      bruteForceMinRawTotal(orders, persons),
    );
    expect(optimizeAssignment(orders, persons).assignments).toHaveLength(2);
  });

  it('matches brute force when more orders than couriers', () => {
    const orders: OptimizeOrderInput[] = [
      { id: '1', latitude: -23.55, longitude: -46.63 },
      { id: '2', latitude: -23.56, longitude: -46.64 },
      { id: '3', latitude: -23.57, longitude: -46.65 },
    ];
    const persons: OptimizePersonInput[] = [
      { id: 'a', currentLatitude: -23.551, currentLongitude: -46.631 },
      { id: 'b', currentLatitude: -23.561, currentLongitude: -46.641 },
    ];
    expect(hungarianRawTotal(orders, persons)).toBe(
      bruteForceMinRawTotal(orders, persons),
    );
    expect(optimizeAssignment(orders, persons).unassigned).toHaveLength(1);
  });

  it('matches brute force on pseudo-random scenarios (n,m ≤ 6)', () => {
    for (let seed = 1; seed <= 24; seed++) {
      const { orders, persons } = randomScenario(seed, 6, 6);
      expect(hungarianRawTotal(orders, persons)).toBe(
        bruteForceMinRawTotal(orders, persons),
      );
    }
  });
});
