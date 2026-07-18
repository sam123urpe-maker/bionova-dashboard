"use client";

import { useMemo } from "react";
import type { EstadoFilter, KitFilter, OfertaFilter, Lead } from "@/types/client";
import { Search } from "lucide-react";

interface Props {
  estadoFilter: EstadoFilter;
  setEstadoFilter: (v: EstadoFilter) => void;
  kitFilter: KitFilter;
  setKitFilter: (v: KitFilter) => void;
  ofertaFilter: OfertaFilter;
  setOfertaFilter: (v: OfertaFilter) => void;
  searchTerm: string;
  setSearchTerm: (v: string) => void;
  leads: Lead[];
}

function formatKitLabel(kit: string): string {
  return kit.charAt(0).toUpperCase() + kit.slice(1);
}

export function TableFilters({
  estadoFilter,
  setEstadoFilter,
  kitFilter,
  setKitFilter,
  ofertaFilter,
  setOfertaFilter,
  searchTerm,
  setSearchTerm,
  leads,
}: Props) {
  const kitOptions = useMemo(() => {
    const unique = new Set(leads.map((l) => l.kit));
    return Array.from(unique).sort();
  }, [leads]);

  return (
    <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1">
      <div className="relative flex-shrink-0 min-w-[160px]">
        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar telefono..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full pl-8 pr-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
        />
      </div>

      <select
        value={estadoFilter}
        onChange={(e) => setEstadoFilter(e.target.value as EstadoFilter)}
        className="flex-shrink-0 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
      >
        <option value="todos">Todos estados</option>
        <option value="pagado">Pagado</option>
        <option value="esperando">Esperando</option>
        <option value="abandonado">Abandonado</option>
        <option value="falta">Falta</option>
      </select>

      <select
        value={kitFilter}
        onChange={(e) => setKitFilter(e.target.value as KitFilter)}
        className="flex-shrink-0 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
      >
        <option value="todos">Todos kits</option>
        {kitOptions.map((kit) => (
          <option key={kit} value={kit}>
            {formatKitLabel(kit)}
          </option>
        ))}
      </select>

      <select
        value={ofertaFilter}
        onChange={(e) => setOfertaFilter(e.target.value as OfertaFilter)}
        className="flex-shrink-0 px-3 py-2 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500"
      >
        <option value="todos">Todas ofertas</option>
        <option value="recibio">Recibio</option>
        <option value="no_recibio">No recibio</option>
        <option value="recibiodos">Recibio dos</option>
      </select>
    </div>
  );
}
