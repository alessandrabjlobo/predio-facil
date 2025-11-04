import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";
import OsForm from "../src/components/os/OsForm";
import * as api from "../src/lib/api";
import type { OSRow } from "../src/lib/api";

// Mock the toast hook
vi.mock("../src/hooks/use-toast", () => ({
  toast: vi.fn(),
}));

describe("OsForm", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates OS with normalized payload", async () => {
    const spy = vi.spyOn(api, "createOS").mockResolvedValue({ 
      id: "test-id",
      titulo: "Manutenção - Rampa",
      tipo_manutencao: "preventiva",
      prioridade: "media",
    } as any);

    const onCreated = vi.fn();
    render(<OsForm mode="create" onCreated={onCreated} />);

    // Fill in the form
    const tituloInput = screen.getByPlaceholderText(/Ex.: Manutenção - Rampa Garagem/i);
    fireEvent.change(tituloInput, { target: { value: "Manutenção - Rampa" } });

    const descricaoInput = screen.getByPlaceholderText(/Descreva os serviços/i);
    fireEvent.change(descricaoInput, { target: { value: "Teste descrição" } });

    // Data prevista
    const dateInputs = screen.getAllByDisplayValue("");
    const dateInput = dateInputs.find(input => input.getAttribute("type") === "date");
    if (dateInput) {
      fireEvent.change(dateInput, { target: { value: "2025-11-04" } });
    }

    // Fornecedor toggle
    const fornecedorLabel = screen.getByText(/Fornecedor Externo/i);
    fireEvent.click(fornecedorLabel);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Empresa XYZ Ltda/i)).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText(/Empresa XYZ Ltda/i), { 
      target: { value: "Empresa XXX" } 
    });
    fireEvent.change(screen.getByPlaceholderText(/\(85\) 00000-0000/i), { 
      target: { value: "85000000000" } 
    });

    // Submit
    const submitButton = screen.getByRole("button", { name: /Criar Ordem de Serviço/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });

    const arg = spy.mock.calls[0][0];
    expect(arg.tipo_manutencao).toBe("preventiva");
    expect(arg.prioridade).toBe("media");
    expect(arg.data_prevista).toBe("2025-11-04");
    expect(arg.fornecedor_nome).toBe("Empresa XXX");
    expect(arg.fornecedor_contato).toBe("85000000000");
  });

  it("clears fornecedor fields when toggle is turned off", async () => {
    render(<OsForm mode="create" />);

    // Turn on fornecedor toggle
    const fornecedorLabel = screen.getByText(/Fornecedor Externo/i);
    fireEvent.click(fornecedorLabel);

    await waitFor(() => {
      expect(screen.getByPlaceholderText(/Empresa XYZ Ltda/i)).toBeInTheDocument();
    });

    // Fill in fornecedor fields
    fireEvent.change(screen.getByPlaceholderText(/Empresa XYZ Ltda/i), { 
      target: { value: "Test Company" } 
    });

    // Turn off toggle
    fireEvent.click(fornecedorLabel);

    await waitFor(() => {
      expect(screen.queryByPlaceholderText(/Empresa XYZ Ltda/i)).not.toBeInTheDocument();
    });
  });

  it("updates OS when in edit mode", async () => {
    const spy = vi.spyOn(api, "updateOS").mockResolvedValue({ 
      id: "test-id",
      titulo: "Updated Title",
      status: "aberta",
    } as OSRow);

    const onUpdated = vi.fn();
    const initial = {
      id: "test-id",
      titulo: "Original Title",
      descricao: "Original Description",
      tipo_manutencao: "corretiva" as const,
      prioridade: "alta" as const,
      status: "aberta" as const,
    };

    render(<OsForm mode="edit" initial={initial} onUpdated={onUpdated} />);

    // Update title
    const tituloInput = screen.getByDisplayValue("Original Title");
    fireEvent.change(tituloInput, { target: { value: "Updated Title" } });

    // Submit
    const submitButton = screen.getByRole("button", { name: /Salvar Alterações/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(spy).toHaveBeenCalled();
    });

    expect(spy.mock.calls[0][0]).toBe("test-id");
    expect(spy.mock.calls[0][1].titulo).toBe("Updated Title");
  });

  it("displays validation error for empty title", async () => {
    render(<OsForm mode="create" />);

    // Try to submit without title
    const submitButton = screen.getByRole("button", { name: /Criar Ordem de Serviço/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(screen.getByText(/Informe um título/i)).toBeInTheDocument();
    });
  });
});
