import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Modal } from './Modal';

describe('Modal', () => {
  it('fecha ao clicar no backdrop', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <p>Conteudo</p>
      </Modal>,
    );
    const dialog = screen.getByRole('dialog');
    fireEvent.mouseDown(dialog);
    expect(onClose).toHaveBeenCalled();
  });

  it('nao fecha ao clicar no painel', () => {
    const onClose = vi.fn();
    render(
      <Modal open onClose={onClose}>
        <button type="button">Dentro</button>
      </Modal>,
    );
    fireEvent.mouseDown(screen.getByRole('button', { name: 'Dentro' }));
    expect(onClose).not.toHaveBeenCalled();
  });
});
