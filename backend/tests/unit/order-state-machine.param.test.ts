import { describe, it, expect } from 'vitest';
import { canTransition } from '../../src/modules/orders/order-state-machine.js';
import type { OrderStatus } from '@prisma/client';

const valid: Array<[OrderStatus, OrderStatus, boolean]> = [
  ['pending', 'preparing', false],
  ['pending', 'cancelled', false],
  ['preparing', 'ready', false],
  ['ready', 'cancelled', false],
  ['ready', 'delivering', true],
  ['delivering', 'delivered', true],
];

describe('state machine parametrizada', () => {
  it.each(valid)('%s → %s (person=%s)', (from, to, hasPerson) => {
    expect(canTransition(from, to, hasPerson)).toBe(true);
  });

  it('ready → delivering sem entregador', () => {
    expect(canTransition('ready', 'delivering', false)).toBe(false);
  });

  it('delivered → pending', () => {
    expect(canTransition('delivered', 'pending', true)).toBe(false);
  });

  it('delivering → cancelled', () => {
    expect(canTransition('delivering', 'cancelled', true)).toBe(false);
  });
});
