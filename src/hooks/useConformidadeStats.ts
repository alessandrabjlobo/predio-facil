import { useMemo } from "react";
import { differenceInDays } from "date-fns";

interface ConformidadeItem {
  id: string;
  proximo: string;
  ultimo: string | null;
  status: string;
  ativos?: {
    ativo_tipos?: {
      sistema_manutencao?: string;
    };
  };
}

export const useConformidadeStats = (itens: ConformidadeItem[] | undefined) => {
  return useMemo(() => {
    if (!itens || itens.length === 0) {
      return {
        total: 0,
        emDia: 0,
        proximas: 0,
        vencidas: 0,
        porcentagemEmDia: 0,
        porSistema: {},
      };
    }

    const hoje = new Date();
    let emDia = 0;
    let proximas = 0;
    let vencidas = 0;
    const sistemaStats: Record<string, { total: number; emDia: number }> = {};

    itens.forEach((item) => {
      const proximaData = new Date(item.proximo);
      const diasAteVencer = differenceInDays(proximaData, hoje);

      // Calcular status
      let statusCalculado: "verde" | "amarelo" | "vermelho";
      if (item.ultimo && diasAteVencer > 15) {
        statusCalculado = "verde";
        emDia++;
      } else if (diasAteVencer > 0 && diasAteVencer <= 15) {
        statusCalculado = "amarelo";
        proximas++;
      } else {
        statusCalculado = "vermelho";
        vencidas++;
      }

      // Agrupar por sistema
      const sistema = item.ativos?.ativo_tipos?.sistema_manutencao || "Outros";
      if (!sistemaStats[sistema]) {
        sistemaStats[sistema] = { total: 0, emDia: 0 };
      }
      sistemaStats[sistema].total++;
      if (statusCalculado === "verde") {
        sistemaStats[sistema].emDia++;
      }
    });

    return {
      total: itens.length,
      emDia,
      proximas,
      vencidas,
      porcentagemEmDia: itens.length > 0 ? Math.round((emDia / itens.length) * 100) : 0,
      porSistema: sistemaStats,
    };
  }, [itens]);
};
