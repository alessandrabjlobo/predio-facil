export function usePlanos(ativo_id?: string) {
  return useQuery({
    queryKey: ['planos', ativo_id],
    queryFn: () => ativo_id 
      ? listPlanosByAtivo(ativo_id) 
      : listPlanos(),
  });
}
