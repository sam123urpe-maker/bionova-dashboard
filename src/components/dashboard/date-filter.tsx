"use client";

import { useRef } from "react";
import {
  Sun,
  Moon,
  CalendarDays,
  CalendarRange,
  Layers,
  Calendar,
} from "lucide-react";
import type { Periodo } from "@/lib/date";
import { PERIODO_LABELS, getLimaDateString } from "@/lib/date";

interface Props {
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  fecha: string;
  setFecha: (f: string) => void;
}

const PRESETS: { key: Periodo; icon: React.ComponentType<{ className?: string }>; label: string }[] = [
  { key: "hoy", icon: Sun, label: "Hoy" },
  { key: "ayer", icon: Moon, label: "Ayer" },
  { key: "semana", icon: CalendarDays, label: "Semana" },
  { key: "mes", icon: CalendarRange, label: "Mes" },
  { key: "todo", icon: Layers, label: "Todo" },
];

export function DateFilter({ periodo, setPeriodo, fecha, setFecha }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  const fechaLabel =
    periodo === "personalizado" && fecha
      ? new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
          weekday: "long",
          day: "numeric",
          month: "long",
        })
      : null;

  return (
    <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm shadow-slate-200/20 p-2">
      <div className="flex items-center gap-1.5 flex-wrap">
        {PRESETS.map(({ key, icon: Icon, label }) => {
          const active =
            periodo === key ||
            (key === "todo" && periodo === "personalizado" ? false : key === periodo);

          return (
            <button
              key={key}
              onClick={() => setPeriodo(key)}
              className={`group relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                active && periodo !== "personalizado"
                  ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
                  : key === "todo" && periodo === "personalizado"
                  ? "bg-slate-100 text-slate-500 hover:bg-slate-200"
                  : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
              }`}
            >
              <Icon
                className={`w-4 h-4 transition-transform duration-200 ${
                  active && periodo !== "personalizado"
                    ? ""
                    : "group-hover:scale-110"
                }`}
              />
              {label}
            </button>
          );
        })}

        <div className="h-8 w-px bg-slate-200 mx-1 hidden sm:block" />

        <button
          onClick={() => inputRef.current?.showPicker?.()}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
            periodo === "personalizado"
              ? "bg-amber-500 text-white shadow-md shadow-amber-500/25 scale-[1.02]"
              : "bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-700"
          }`}
        >
          <Calendar className="w-4 h-4" />
          <input
            ref={inputRef}
            type="date"
            value={fecha}
            max={getLimaDateString()}
            onChange={(e) => {
              setFecha(e.target.value);
              setPeriodo("personalizado");
            }}
            className="absolute inset-0 opacity-0 cursor-pointer"
          />
          {periodo === "personalizado" && fechaLabel ? (
            <span className="capitalize">{fechaLabel}</span>
          ) : (
            "Elegir dia"
          )}
        </button>

        {fechaLabel && periodo === "personalizado" && (
          <span className="hidden sm:inline text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-full font-medium capitalize ml-1">
            {fechaLabel}
          </span>
        )}
      </div>
    </div>
  );
}
