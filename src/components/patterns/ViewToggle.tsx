import { Button } from "@/components/ui/button";
import { List, LayoutGrid } from "lucide-react";

interface ViewToggleProps {
  view: 'list' | 'card';
  onViewChange: (view: 'list' | 'card') => void;
}

export function ViewToggle({ view, onViewChange }: ViewToggleProps) {
  return (
    <div className="flex items-center gap-1 bg-muted rounded-md p-1">
      <Button
        size="sm"
        variant={view === 'list' ? 'default' : 'ghost'}
        onClick={() => onViewChange('list')}
        className="h-8"
      >
        <List className="h-4 w-4" />
      </Button>
      <Button
        size="sm"
        variant={view === 'card' ? 'default' : 'ghost'}
        onClick={() => onViewChange('card')}
        className="h-8"
      >
        <LayoutGrid className="h-4 w-4" />
      </Button>
    </div>
  );
}
