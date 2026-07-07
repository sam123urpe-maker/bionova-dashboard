"use client";

import type { Cliente } from "@/types/client";
import { useRealtime } from "@/hooks/useRealtime";
import { Header } from "@/components/dashboard/header";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueCard } from "@/components/dashboard/revenue-card";
import { StatusDonut } from "@/components/dashboard/charts/status-donut";
import { KitBar } from "@/components/dashboard/charts/kit-bar";
import { ClientsTable } from "@/components/dashboard/table/clients-table";

export function Dashboard({ initialClientes }: { initialClientes: Cliente[] }) {
  const { clientes, isLive } = useRealtime(initialClientes);

  return (
    <div className="min-h-screen">
      <Header isLive={isLive} count={clientes.length} />
      <main className="max-w-7xl mx-auto px-4 py-6 space-y-5">
        <KpiCards clientes={clientes} />
        <RevenueCard clientes={clientes} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
          <StatusDonut clientes={clientes} />
          <KitBar clientes={clientes} />
        </div>

        <ClientsTable clientes={clientes} />
      </main>
    </div>
  );
}
