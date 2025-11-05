import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { BrowserRouter } from 'react-router-dom';
import OSNovo from '@/pages/OSNovo';
import * as api from '@/lib/api';

vi.mock('@/lib/api', () => ({
  createOS: vi.fn(),
}));

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
    useSearchParams: () => [new URLSearchParams('title=Test+OS&asset=asset-123&condo=condo-456&origin=plan&due=2025-12-31&priority=alta&description=Test+description')],
  };
});

describe('OSNovo', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should prefill form from query params', () => {
    render(
      <BrowserRouter>
        <OSNovo />
      </BrowserRouter>
    );

    expect(screen.getByLabelText(/Título/i)).toHaveValue('Test OS');
    expect(screen.getByLabelText(/Descrição detalhada/i)).toHaveValue('Test description');
    expect(screen.getByLabelText(/Data Prevista/i)).toHaveValue('2025-12-31');
  });

  it('should call createOS on submit with normalized payload', async () => {
    const mockCreateOS = vi.mocked(api.createOS);
    mockCreateOS.mockResolvedValue({ id: 'new-os-id', ativo_id: 'asset-123' } as any);

    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <OSNovo />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Criar Ordem de Serviço/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateOS).toHaveBeenCalledWith(
        expect.objectContaining({
          titulo: 'Test OS',
          descricao: 'Test description',
          tipo_manutencao: 'preventiva',
          prioridade: 'alta',
          data_prevista: '2025-12-31',
          ativo_id: 'asset-123',
          condominio_id: 'condo-456',
          origem: 'plan',
        })
      );
    });
  });

  it('should navigate to /os after successful creation', async () => {
    const mockCreateOS = vi.mocked(api.createOS);
    mockCreateOS.mockResolvedValue({ id: 'new-os-id', ativo_id: 'asset-123' } as any);

    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <OSNovo />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Criar Ordem de Serviço/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/os?ativo=asset-123');
    });
  });

  it('should handle errors gracefully', async () => {
    const mockCreateOS = vi.mocked(api.createOS);
    mockCreateOS.mockRejectedValue(new Error('Database error'));

    const user = userEvent.setup();

    render(
      <BrowserRouter>
        <OSNovo />
      </BrowserRouter>
    );

    const submitButton = screen.getByRole('button', { name: /Criar Ordem de Serviço/i });
    await user.click(submitButton);

    await waitFor(() => {
      expect(mockCreateOS).toHaveBeenCalled();
    });
  });
});
