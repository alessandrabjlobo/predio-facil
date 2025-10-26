// src/components/dashboard/EmptyState.tsx
import { Button } from "@/components/ui/button";
import { ReactNode } from "react";

type Props = {
  title: string;
  description?: string;
  actionText?: string;
  onAction?: () => void;
  icon?: ReactNode;
};

export default function EmptyState({ title, description, actionText, onAction, icon }: Props) {
  return (
    <div className="text-center py-10 text-slate-500 text-sm border rounded-md bg-slate-50">
      <div className="mx-auto mb-2 flex justify-center">{icon}</div>
      <div className="font-medium text-slate-800">{title}</div>
      {description ? <div className="text-slate-500">{description}</div> : null}
      {actionText ? (
        <div className="mt-3">
          <Button variant="outline" size="sm" onClick={onAction}>
            {actionText}
          </Button>
        </div>
      ) : null}
    </div>
  );
}
