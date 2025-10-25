import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileText, X } from "lucide-react";
import { useState } from "react";

interface DocumentoTipo {
  id: string;
  codigo: string;
  nome: string;
  descricao?: string;
}

interface DocumentoSelectorProps {
  documentoTipos: DocumentoTipo[];
  selectedIds: string[];
  onChange: (ids: string[]) => void;
  readonlyIds?: string[];
}

export const DocumentoSelector = ({
  documentoTipos,
  selectedIds,
  onChange,
  readonlyIds = [],
}: DocumentoSelectorProps) => {
  const [selectedToAdd, setSelectedToAdd] = useState<string>("");

  const addDocumento = () => {
    if (!selectedToAdd || selectedIds.includes(selectedToAdd)) return;
    onChange([...selectedIds, selectedToAdd]);
    setSelectedToAdd("");
  };

  const removeDocumento = (id: string) => {
    onChange(selectedIds.filter((docId) => docId !== id));
  };

  const readonlyDocs = documentoTipos.filter((doc) => readonlyIds.includes(doc.id));
  const editableDocs = documentoTipos.filter((doc) => selectedIds.includes(doc.id) && !readonlyIds.includes(doc.id));
  const availableDocs = documentoTipos.filter(
    (doc) => !selectedIds.includes(doc.id) && !readonlyIds.includes(doc.id)
  );

  return (
    <div className="space-y-4">
      {readonlyDocs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-muted-foreground">Documentos Padrão (obrigatório)</h4>
          <div className="flex flex-wrap gap-2">
            {readonlyDocs.map((doc) => (
              <Badge key={doc.id} variant="secondary" className="gap-2">
                <FileText className="h-3 w-3" />
                {doc.nome}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {editableDocs.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium">Documentos Adicionais</h4>
          <div className="flex flex-wrap gap-2">
            {editableDocs.map((doc) => (
              <Badge key={doc.id} variant="outline" className="gap-2">
                <FileText className="h-3 w-3" />
                {doc.nome}
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="h-4 w-4 p-0 hover:bg-transparent"
                  onClick={() => removeDocumento(doc.id)}
                >
                  <X className="h-3 w-3" />
                </Button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {availableDocs.length > 0 && (
        <div className="flex gap-2">
          <Select value={selectedToAdd} onValueChange={setSelectedToAdd}>
            <SelectTrigger>
              <SelectValue placeholder="Adicionar documento obrigatório..." />
            </SelectTrigger>
            <SelectContent>
              {availableDocs.map((doc) => (
                <SelectItem key={doc.id} value={doc.id}>
                  {doc.nome}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="button" onClick={addDocumento} variant="outline" disabled={!selectedToAdd}>
            Adicionar
          </Button>
        </div>
      )}
    </div>
  );
};
