import { describe, it, expect } from 'vitest';
import { ApiError } from './api';

describe('ApiError', () => {
  it('expoe codigo e status', () => {
    const err = new ApiError(403, 'FORBIDDEN', 'Negado');
    expect(err.code).toBe('FORBIDDEN');
    expect(err.status).toBe(403);
  });
});
