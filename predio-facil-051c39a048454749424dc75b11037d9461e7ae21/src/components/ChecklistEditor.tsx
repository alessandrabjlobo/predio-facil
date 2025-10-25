import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Trash2, GripVertical, Plus } from "lucide-react";

interface ChecklistItem {
  texto: string;
  obrigatorio?: boolean;
}

interface ChecklistEditorProps {
  items: ChecklistItem[];
  onChange: (items: ChecklistItem[]) => void;
  readonlyItems?: ChecklistItem[];
}

export const ChecklistEditor = ({ items, onChange, readonlyItems = [] }: ChecklistEditorProps) => {
  const [newItem, setNewItem] = useState("");

  const addItem = () => {
    if (!newItem.trim()) return;
    onChange([...items, { texto: newItem, obrigatorio: false }]);
    setNewItem("");
  };

  const removeItem = (index: number) => {
    onChange(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, texto: string) => {
    const updated = [...items];
    updated[index] = { ...updated[index], texto };
    onChange(updated);
  };

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <h4 className="text-sm font-medium text-muted-foreground">Itens Padrão (não editável)</h4>
        {readonlyItems.map((item, index) => (
          <div key={`readonly-${index}`} className="flex items-center gap-2 p-2 bg-muted/50 rounded-md">
            <GripVertical className="h-4 w-4 text-muted-foreground" />
            <span className="flex-1 text-sm text-muted-foreground">{item.texto}</span>
            <span className="text-xs px-2 py-1 bg-secondary rounded">Obrigatório</span>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <h4 className="text-sm font-medium">Itens Customizados</h4>
        {items.map((item, index) => (
          <div key={index} className="flex items-center gap-2">
            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
            <Input
              value={item.texto}
              onChange={(e) => updateItem(index, e.target.value)}
              className="flex-1"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              onClick={() => removeItem(index)}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Input
          placeholder="Novo item do checklist..."
          value={newItem}
          onChange={(e) => setNewItem(e.target.value)}
          onKeyPress={(e) => e.key === "Enter" && addItem()}
        />
        <Button type="button" onClick={addItem} variant="outline">
          <Plus className="h-4 w-4 mr-2" />
          Adicionar
        </Button>
      </div>
    </div>
  );
};
