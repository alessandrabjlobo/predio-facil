import { describe, it, expect, vi } from 'vitest';
import { render, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { CreateOSDialog } from '@/components/maintenance/CreateOSDialog';

const mockNavigate = vi.fn();
vi.mock('react-router-dom', async () => {
  const actual = await vi.importActual('react-router-dom');
  return {
    ...actual,
    useNavigate: () => mockNavigate,
  };
});

vi.mock('@/hooks/useCondominioAtual', () => ({
  useCondominioAtual: () => ({
    condominio: { id: 'test-condo-id', nome: 'Test Condo' },
  }),
}));

describe('CreateOSDialog', () => {
  it('should redirect to /os/new when opened with an asset', async () => {
    const mockOnOpenChange = vi.fn();
    const mockAtivo = {
      id: 'test-asset-id',
      nome: 'Test Asset',
    };

    render(
      <BrowserRouter>
        <CreateOSDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          ativo={mockAtivo}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockOnOpenChange).toHaveBeenCalledWith(false);
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringContaining('/os/new?')
      );
    });
  });

  it('should include plan data in query params when plan is provided', async () => {
    const mockOnOpenChange = vi.fn();
    const mockAtivo = {
      id: 'test-asset-id',
      nome: 'Test Asset',
    };
    const mockPlano = {
      id: 'test-plan-id',
      titulo: 'Test Plan',
      descricao: 'Plan description',
      prioridade: 'alta',
      vencimento: '2025-12-31',
    };

    render(
      <BrowserRouter>
        <CreateOSDialog
          open={true}
          onOpenChange={mockOnOpenChange}
          ativo={mockAtivo}
          plano={mockPlano}
        />
      </BrowserRouter>
    );

    await waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/\/os\/new\?.*origin=plan/)
      );
      expect(mockNavigate).toHaveBeenCalledWith(
        expect.stringMatching(/plan=test-plan-id/)
      );
    });
  });

  it('should render nothing (return null)', () => {
    const mockOnOpenChange = vi.fn();
    const mockAtivo = {
      id: 'test-asset-id',
      nome: 'Test Asset',
    };

    const { container } = render(
      <BrowserRouter>
        <CreateOSDialog
          open={false}
          onOpenChange={mockOnOpenChange}
          ativo={mockAtivo}
        />
      </BrowserRouter>
    );

    expect(container.firstChild).toBeNull();
  });
});
