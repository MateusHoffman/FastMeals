import { describe, it, expect } from 'vitest';
import { greedyNearestNeighborTotalKm } from '../../src/algorithms/greedyBaseline.js';
import { optimizeAssignment } from '../../src/algorithms/optimizeAssignment.js';

describe('greedy baseline vs Hungarian', () => {
  it('Hungarian total km <= greedy nearest-neighbor', () => {
    const orders = [
      { id: 'o1', latitude: -23.55, longitude: -46.63 },
      { id: 'o2', latitude: -23.56, longitude: -46.64 },
      { id: 'o3', latitude: -23.57, longitude: -46.65 },
    ];
    const persons = [
      { id: 'p1', currentLatitude: -23.54, currentLongitude: -46.62 },
      { id: 'p2', currentLatitude: -23.58, currentLongitude: -46.66 },
    ];
    const hungarian = optimizeAssignment(orders, persons);
    const greedy = greedyNearestNeighborTotalKm(orders, persons);
    expect(hungarian.totalDistanceKm).toBeLessThanOrEqual(greedy);
    expect(hungarian.baselineComparison?.greedyNearestNeighborTotalKm).toBe(
      greedy,
    );
  });
});
