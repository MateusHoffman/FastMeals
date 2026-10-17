import { describe, it, expect } from 'vitest';
import { formatBrl } from './format';

describe('formatBrl', () => {
  it('formata com R$ e virgula decimal', () => {
    expect(formatBrl(65.8)).toMatch(/R\$\s*65,80/);
  });

  it('formata zero', () => {
    expect(formatBrl(0)).toMatch(/R\$\s*0,00/);
  });
});
