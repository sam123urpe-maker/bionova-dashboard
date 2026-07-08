"use client";

import { useState } from "react";
import type { Lead } from "@/types/client";
import type { ClienteRecord } from "@/lib/auth";
import { useRealtime } from "@/hooks/useRealtime";
import { Header } from "@/components/dashboard/header";
import { DateFilter } from "@/components/dashboard/date-filter";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueCard } from "@/components/dashboard/revenue-card";
import { StatusDonut } from "@/components/dashboard/charts/status-donut";
import { KitBar } from "@/components/dashboard/charts/kit-bar";
import { ClientsTable } from "@/components/dashboard/table/clients-table";
import { filterByDate, getLimaDateString, getWeekRevenue, getMonthRevenue } from "@/lib/date";
import type { Periodo } from "@/lib/date";

export interface DashboardUser {
  email: string;
  cliente: ClienteRecord | null;
  isAdmin: boolean;
}

export function Dashboard({
  initialLeads,
  user,
}: {
  initialLeads: Lead[];
  user: DashboardUser;
}) {
  const scopeId = user.isAdmin ? null : (user.cliente?.id ?? undefined);
  const { leads, isLive } = useRealtime(initialLeads, scopeId);
  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [fecha, setFecha] = useState(getLimaDateString());

  const filtrados = filterByDate(leads, periodo, fecha);

  return (
    <div className="min-h-screen">
      <Header isLive={isLive} count={filtrados.length} user={user} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <DateFilter
          periodo={periodo}
          setPeriodo={setPeriodo}
          fecha={fecha}
          setFecha={setFecha}
        />
        <KpiCards leads={filtrados} />
        <RevenueCard
          leads={filtrados}
          semanaRevenue={getWeekRevenue(leads)}
          mesRevenue={getMonthRevenue(leads)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StatusDonut leads={filtrados} />
          <KitBar leads={filtrados} />
        </div>

        <ClientsTable leads={filtrados} />
      </main>
    </div>
  );
}
