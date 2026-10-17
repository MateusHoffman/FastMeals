import { describe, it, expect } from 'vitest';
import { haversineKm } from '../../src/algorithms/haversine.js';

describe('haversine', () => {
  it('returns zero for same point', () => {
    expect(haversineKm(-23.5, -46.6, -23.5, -46.6)).toBe(0);
  });

  it('returns positive distance for distinct points', () => {
    const d = haversineKm(-23.5489, -46.6388, -23.5891, -46.6378);
    expect(d).toBeGreaterThan(0);
  });
});
