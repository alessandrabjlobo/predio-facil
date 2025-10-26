// src/components/dashboard/KpiCard.tsx
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ReactNode } from "react";

type Props = {
  title: string;
  value: ReactNode;
  icon?: ReactNode;
  delta?: { text: string; positive?: boolean };
  onClick?: () => void;
  hint?: string;
};

export default function KpiCard({ title, value, icon, delta, onClick, hint }: Props) {
  return (
    <Card
      role={onClick ? "button" : undefined}
      onClick={onClick}
      className={
        "group relative overflow-hidden transition " +
        (onClick ? "cursor-pointer hover:shadow-lg" : "hover:shadow-md")
      }
    >
      <div className="pointer-events-none absolute inset-0 bg-gradient-to-br from-slate-50 to-transparent opacity-0 group-hover:opacity-100 transition" />
      <CardHeader className="flex flex-row items-start justify-between space-y-0 pb-2">
        <CardTitle className="text-[13px] font-medium text-slate-600">{title}</CardTitle>
        <div className="text-slate-400 group-hover:text-slate-600 transition">{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-semibold tracking-tight text-slate-900">{value}</div>
        {delta ? (
          <div
            className={
              "mt-1 text-[12px] " +
              (delta.positive ? "text-emerald-700" : "text-rose-700")
            }
          >
            {delta.text}
          </div>
        ) : null}
        {hint ? (
          <div className="mt-2 text-[11px] text-slate-500">
            {hint}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
