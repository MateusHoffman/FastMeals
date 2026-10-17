import { describe, it, expect } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './Layout';
import { useAuthStore } from '../stores/authStore';

describe('Layout', () => {
  it('mostra navegacao', () => {
    useAuthStore.setState({
      user: { id: '1', email: 'a@b.com', role: 'admin' },
    });
    render(
      <MemoryRouter initialEntries={['/orders']}>
        <Routes>
          <Route path="/orders" element={<Layout />}>
            <Route index element={<span>Pedidos conteudo</span>} />
          </Route>
        </Routes>
      </MemoryRouter>,
    );
    expect(screen.getByRole('heading', { name: 'Pedidos' })).toBeInTheDocument();
    const sidebar = screen.getByRole('navigation', { name: 'Principal' });
    expect(within(sidebar).getByText('Relatórios')).toBeInTheDocument();
  });
});
