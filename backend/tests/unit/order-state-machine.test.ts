// BDD: STATE-*
import { describe, it, expect } from 'vitest';
import { assertTransition } from '../../src/modules/orders/order-state-machine.js';
import { AppError } from '../../src/shared/errors/app-error.js';

describe('order state machine', () => {
  it('allows pending to preparing', () => {
    expect(() => assertTransition('pending', 'preparing', false)).not.toThrow();
  });

  it('blocks delivered to pending', () => {
    expect(() => assertTransition('delivered', 'pending', true)).toThrow(AppError);
  });
});
