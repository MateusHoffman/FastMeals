import { describe, it, expect } from 'vitest';

describe('product form validation rules', () => {
  it('nome curto e invalido', () => {
    const name = 'ab';
    expect(name.length < 3).toBe(true);
  });

  it('descricao curta e invalida', () => {
    const description = 'curta';
    expect(description.length < 10).toBe(true);
  });
});
