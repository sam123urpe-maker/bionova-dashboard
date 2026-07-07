"use client";

import { Calendar, ChevronDown } from "lucide-react";
import type { Periodo } from "@/lib/date";
import { PERIODO_LABELS, getLimaDateString } from "@/lib/date";

interface Props {
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  fecha: string;
  setFecha: (f: string) => void;
}

const PRESETS: Periodo[] = ["hoy", "ayer", "semana", "mes", "todo"];

export function DateFilter({ periodo, setPeriodo, fecha, setFecha }: Props) {
  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm p-3">
      <div className="flex items-center gap-2 flex-wrap">
        <Calendar className="w-4 h-4 text-slate-400 hidden sm:block" />

        {PRESETS.map((p) => (
          <button
            key={p}
            onClick={() => setPeriodo(p)}
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors ${
              periodo === p && !(p === "todo" && periodo === "personalizado")
                ? "bg-amber-500 text-white"
                : "bg-slate-100 text-slate-600 hover:bg-slate-200"
            }`}
          >
            {PERIODO_LABELS[p]}
          </button>
        ))}

        <div className="flex items-center gap-1.5">
          <input
            type="date"
            value={fecha}
            max={getLimaDateString()}
            onChange={(e) => {
              setFecha(e.target.value);
              setPeriodo("personalizado");
            }}
            className="px-3 py-1.5 text-sm rounded-lg border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 text-slate-700"
          />
          {periodo === "personalizado" && (
            <span className="text-xs text-amber-600 font-medium">
              {fecha ? new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", { weekday: "short", day: "numeric", month: "short" }) : ""}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
