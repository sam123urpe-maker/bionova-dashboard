"use client";

import { useMemo } from "react";
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
import type { Lead } from "@/types/client";

const KIT_COLORS = [
  "#d97706",
  "#92400e",
  "#2563eb",
  "#7c3aed",
  "#059669",
  "#db2777",
  "#ea580c",
  "#4f46e5",
];

function formatKitName(kit: string): string {
  return kit.charAt(0).toUpperCase() + kit.slice(1);
}

export function KitBar({ leads }: { leads: Lead[] }) {
  const data = useMemo(() => {
    const counts = new Map<string, number>();
    for (const lead of leads) {
      counts.set(lead.kit, (counts.get(lead.kit) ?? 0) + 1);
    }
    return Array.from(counts.entries())
      .map(([name, value], i) => ({
        name: formatKitName(name),
        value,
        color: KIT_COLORS[i % KIT_COLORS.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [leads]);

  if (leads.length === 0) {
    return (
      <Card className="p-4">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-200 mb-3">Por Kit</h3>
        <p className="text-slate-400 dark:text-slate-500 text-sm text-center py-8">Sin datos</p>
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
