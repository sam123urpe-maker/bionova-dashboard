"use client";

import { Card } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import type { Cliente } from "@/types/client";

export function KitBar({ clientes }: { clientes: Cliente[] }) {
  const remedios = clientes.filter((c) => c.kit === "remedios").length;
  const suerte = clientes.filter((c) => c.kit === "suerte").length;

  const data = [
    { name: "Remedios", value: remedios, color: "#d97706" },
    { name: "Suerte", value: suerte, color: "#92400e" },
  ];

  if (clientes.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-700 mb-3">Por Kit</h3>
        <p className="text-slate-400 text-sm text-center py-8">Sin datos</p>
      </Card>
    );
  }

  return (
    <Card className="p-4">
      <h3 className="text-sm font-semibold text-slate-700 mb-1">Por Kit</h3>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20 }}>
            <XAxis type="number" hide />
            <YAxis
              type="category"
              dataKey="name"
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 13, fill: "#475569" }}
              width={80}
            />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #e2e8f0",
                fontSize: "13px",
              }}
            />
            <Bar dataKey="value" radius={[0, 8, 8, 0]} barSize={32}>
              {data.map((entry, i) => (
                <Cell key={i} fill={entry.color} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}
