"use client";

import { Card } from "@/components/ui/card";
import { Users, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import type { Lead } from "@/types/client";

interface KpiData {
  total: number;
  pagado: number;
  abandonado: number;
  esperando: number;
  falta: number;
}

function computeKpis(leads: Lead[]): KpiData {
  return {
    total: leads.length,
    pagado: leads.filter((c) => c.estado === "pagado").length,
    abandonado: leads.filter((c) => c.estado === "abandonado").length,
    esperando: leads.filter((c) => c.estado === "esperando").length,
    falta: leads.filter((c) => c.estado === "falta").length,
  };
}

function KpiCard({
  label,
  value,
  icon: Icon,
  colorClass,
}: {
  label: string;
  value: number;
  icon: React.ComponentType<{ className?: string }>;
  colorClass: string;
}) {
  return (
    <Card className="p-4 flex items-center gap-3">
      <div className={`p-2.5 rounded-lg ${colorClass}`}>
        <Icon className="w-5 h-5" />
      </div>
      <div>
        <p className="text-2xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">{value}</p>
        <p className="text-xs text-slate-500 dark:text-slate-400">{label}</p>
      </div>
    </Card>
  );
}

export function KpiCards({ leads }: { leads: Lead[] }) {
  const kpis = computeKpis(leads);

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
      <KpiCard
        label="Total"
        value={kpis.total}
        icon={Users}
        colorClass="bg-amber-100 text-amber-600"
      />
      <KpiCard
        label="Pagados"
        value={kpis.pagado}
        icon={CheckCircle}
        colorClass="bg-emerald-100 text-emerald-600"
      />
      <KpiCard
        label="Abandonados"
        value={kpis.abandonado}
        icon={XCircle}
        colorClass="bg-red-100 text-red-600"
      />
      <KpiCard
        label="Esperando"
        value={kpis.esperando}
        icon={Clock}
        colorClass="bg-amber-100 text-amber-600"
      />
      <KpiCard
        label="Falta"
        value={kpis.falta}
        icon={AlertCircle}
        colorClass="bg-slate-100 text-slate-600"
      />
    </div>
  );
}
