"use client";

import { useState } from "react";
import type { Cliente } from "@/types/client";
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

export function Dashboard({ initialClientes }: { initialClientes: Cliente[] }) {
  const { clientes, isLive } = useRealtime(initialClientes);
  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [fecha, setFecha] = useState(getLimaDateString());

  const filtrados = filterByDate(clientes, periodo, fecha);

  return (
    <div className="min-h-screen">
      <Header isLive={isLive} count={filtrados.length} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        <DateFilter
          periodo={periodo}
          setPeriodo={setPeriodo}
          fecha={fecha}
          setFecha={setFecha}
        />
        <KpiCards clientes={filtrados} />
        <RevenueCard
          clientes={filtrados}
          semanaRevenue={getWeekRevenue(clientes)}
          mesRevenue={getMonthRevenue(clientes)}
        />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StatusDonut clientes={filtrados} />
          <KitBar clientes={filtrados} />
        </div>

        <ClientsTable clientes={filtrados} />
      </main>
    </div>
  );
}
