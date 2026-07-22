"use client";

import { Card } from "@/components/ui/card";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import type { Lead } from "@/types/client";

const COLORS: Record<Lead["estado"], string> = {
  pagado: "#10b981",
  esperando: "#f59e0b",
  abandonado: "#ef4444",
  falta: "#94a3b8",
};

const LABELS: Record<Lead["estado"], string> = {
  pagado: "Pagado",
  esperando: "Esperando",
  abandonado: "Abandonado",
  falta: "Falta",
};

export function StatusDonut({ leads }: { leads: Lead[] }) {
  const counts: Record<string, number> = {};
  for (const c of leads) {
    counts[c.estado] = (counts[c.estado] || 0) + 1;
  }

  const data = Object.entries(counts).map(([key, value]) => ({
    name: LABELS[key as Lead["estado"]] || key,
    value,
    color: COLORS[key as Lead["estado"]] || "#cbd5e1",
  }));

  const total = leads.length;

  if (total === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Por Estado</h3>
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Sin datos</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Distribucion por Estado</h3>
      <div className="relative h-56">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              }}
            />
            <Legend
              verticalAlign="bottom"
              height={32}
              iconType="circle"
              iconSize={8}
              formatter={(value: string) => (
                <span className="text-xs text-slate-600 dark:text-slate-300">{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
        <div className="absolute top-[calc(50%-12px)] left-1/2 -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
          <p className="text-2xl font-bold text-slate-800 tabular-nums">{total}</p>
        </div>
      </div>
    </Card>
  );
}
