import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('mostra status', () => {
    render(<StatusBadge status="ready" />);
    expect(screen.getByText('Pronto')).toBeInTheDocument();
  });
});
