"use client";

import { useState, useMemo } from "react";
import { Card } from "@/components/ui/card";
import { StatusBadge, OfertaBadge } from "./status-badge";
import { TableFilters } from "./table-filters";
import { TablePagination } from "./table-pagination";
import { Phone, MessageCircle } from "lucide-react";
import type { Lead, EstadoFilter, KitFilter, OfertaFilter } from "@/types/client";

const PAGE_SIZE = 20;

function formatDate(iso: string): string {
  if (!iso) return "-";
  const d = new Date(iso);
  return d.toLocaleDateString("es-PE", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function ClientsTable({
  leads,
  onSelectLead,
}: {
  leads: Lead[];
  onSelectLead?: (lead: Lead) => void;
}) {
  const [estadoFilter, setEstadoFilter] = useState<EstadoFilter>("todos");
  const [kitFilter, setKitFilter] = useState<KitFilter>("todos");
  const [ofertaFilter, setOfertaFilter] = useState<OfertaFilter>("todos");
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    let result = leads;
    if (estadoFilter !== "todos") result = result.filter((c) => c.estado === estadoFilter);
    if (kitFilter !== "todos") result = result.filter((c) => c.kit === kitFilter);
    if (ofertaFilter !== "todos") result = result.filter((c) => c.recibio_oferta === ofertaFilter);
    if (searchTerm.trim()) {
      const term = searchTerm.trim().toLowerCase();
      result = result.filter((c) => c.telefono.toLowerCase().includes(term));
    }
    return result;
  }, [leads, estadoFilter, kitFilter, ofertaFilter, searchTerm]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const paged = filtered.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  return (
    <Card className="overflow-hidden">
      <div className="p-3 border-b border-slate-100">
        <TableFilters
          estadoFilter={estadoFilter}
          setEstadoFilter={(v) => { setEstadoFilter(v); setPage(1); }}
          kitFilter={kitFilter}
          setKitFilter={(v) => { setKitFilter(v); setPage(1); }}
          ofertaFilter={ofertaFilter}
          setOfertaFilter={(v) => { setOfertaFilter(v); setPage(1); }}
          searchTerm={searchTerm}
          setSearchTerm={(v) => { setSearchTerm(v); setPage(1); }}
          leads={leads}
        />
      </div>

      <div className="overflow-x-auto">
        {onSelectLead && (
          <p className="text-xs text-slate-400 px-3 pt-2 flex items-center gap-1">
            <MessageCircle className="w-3 h-3" />
            Toca un numero para ver el chat
          </p>
        )}
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-slate-100 bg-slate-50/50">
              <th className="text-left p-3 font-medium text-slate-600 sticky left-0 bg-slate-50/50 z-10 whitespace-nowrap">
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  Telefono
                </span>
              </th>
              <th className="text-left p-3 font-medium text-slate-600 whitespace-nowrap">Kit</th>
              <th className="text-left p-3 font-medium text-slate-600 whitespace-nowrap">Estado</th>
              <th className="text-right p-3 font-medium text-slate-600 whitespace-nowrap">
                Ofertas
              </th>
              <th className="text-left p-3 font-medium text-slate-600 whitespace-nowrap">
                Recibio
              </th>
              <th className="text-right p-3 font-medium text-slate-600 whitespace-nowrap">
                Ultima interaccion
              </th>
            </tr>
          </thead>
          <tbody>
            {paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-slate-400">
                  Sin resultados
                </td>
              </tr>
            ) : (
              paged.map((c) => (
                <tr
                  key={c.id}
                  onClick={() => onSelectLead?.(c)}
                  className={`group border-b border-slate-50 hover:bg-slate-50/50 transition-colors ${onSelectLead ? "cursor-pointer" : ""}`}
                >
                  <td className="p-3 font-medium text-slate-800 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10 whitespace-nowrap">
                    <span className="inline-flex items-center gap-1.5">
                      {c.telefono}
                      {onSelectLead && (
                        <span title="Ver chat">
                          <MessageCircle className="w-3.5 h-3.5 text-amber-500 opacity-40 group-hover:opacity-100 transition-opacity" />
                        </span>
                      )}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className="text-xs font-medium uppercase text-slate-500">
                      {c.kit}
                    </span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <StatusBadge estado={c.estado} />
                  </td>
                  <td className="p-3 text-right tabular-nums text-slate-700 whitespace-nowrap">
                    {c.ofertas_enviadas}
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <OfertaBadge oferta={c.recibio_oferta} />
                  </td>
                  <td className="p-3 text-right text-slate-500 text-xs whitespace-nowrap tabular-nums">
                    {formatDate(c.ultima_interaccion)}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="p-3 border-t border-slate-100">
        <TablePagination page={safePage} totalPages={totalPages} setPage={setPage} />
      </div>
    </Card>
  );
}
