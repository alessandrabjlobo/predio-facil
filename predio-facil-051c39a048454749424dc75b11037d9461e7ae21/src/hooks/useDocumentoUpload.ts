import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "./useAuth";

export const useDocumentoUpload = () => {
  const [uploading, setUploading] = useState(false);
  const { user } = useAuth();

  const uploadDocumento = async (
    file: File,
    itemId: string,
    documentoTipoId?: string
  ) => {
    try {
      setUploading(true);

      // Buscar o usuario_id a partir do auth_user_id
      const { data: usuario, error: userError } = await supabase
        .from("usuarios")
        .select("id")
        .eq("auth_user_id", user?.id)
        .single();

      if (userError) throw userError;

      // Upload do arquivo para o Storage
      const fileExt = file.name.split(".").pop();
      const fileName = `${itemId}/${Date.now()}.${fileExt}`;
      const filePath = `conformidade/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from("manutencao-anexos")
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Registrar o anexo no banco com auditoria
      const { error: insertError } = await supabase
        .from("conformidade_anexos")
        .insert({
          item_id: itemId,
          file_path: filePath,
          uploaded_by: usuario.id,
          documento_tipo_id: documentoTipoId,
        });

      if (insertError) throw insertError;

      toast({
        title: "Documento anexado",
        description: "O documento foi enviado com sucesso!",
      });

      return { filePath };
    } catch (error: any) {
      console.error("Erro ao fazer upload:", error);
      toast({
        title: "Erro no upload",
        description: error.message,
        variant: "destructive",
      });
      throw error;
    } finally {
      setUploading(false);
    }
  };

  return { uploadDocumento, uploading };
};
