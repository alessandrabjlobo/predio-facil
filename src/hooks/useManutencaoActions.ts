export function useManutencaoActions() {
  const queryClient = useQueryClient();
  
  const concluir = useMutation({
    mutationFn: async ({ id, anexo }: { id: string; anexo?: File }) => {
      if (anexo) await uploadManutencaoAnexo(id, anexo);
      return await concluirManutencao(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['manutencoes']);
      toast({ title: 'Manutenção concluída!' });
    },
  });
  
  const remarcar = useMutation({
    mutationFn: remarcarManutencao,
    onSuccess: () => {
      queryClient.invalidateQueries(['manutencoes']);
      toast({ title: 'Data remarcada!' });
    },
  });
  
  return { concluir, remarcar };
}
