// BDD: @fe-login
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent, cleanup } from '@testing-library/react';
import { afterEach } from 'vitest';
import { BrowserRouter } from 'react-router-dom';
import { LoginPage } from './Login';

describe('LoginPage', () => {
  afterEach(() => cleanup());

  it('renderiza titulo e campos', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );
    expect(screen.getByText('FastMeals')).toBeInTheDocument();
    expect(screen.getByLabelText(/^email$/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^senha$/i)).toBeInTheDocument();
  });

  it('alterna visibilidade da senha', () => {
    render(
      <BrowserRouter>
        <LoginPage />
      </BrowserRouter>,
    );
    const input = document.getElementById('password') as HTMLInputElement;
    expect(input.type).toBe('password');
    fireEvent.click(screen.getByRole('button', { name: 'Mostrar senha' }));
    expect(input.type).toBe('text');
    fireEvent.click(screen.getByRole('button', { name: 'Ocultar senha' }));
    expect(input.type).toBe('password');
  });
});
