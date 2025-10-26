export function useManutencoes(filters?: {
  status?: ExecStatus;
  ativo_id?: string;
  condominio_id?: string;
}) {
  return useQuery({
    queryKey: ['manutencoes', filters],
    queryFn: () => listManutencoes(filters),
  });
}
