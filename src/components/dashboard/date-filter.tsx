"use client";

import { useState } from "react";
import {
  Sun,
  Moon,
  CalendarDays,
  CalendarRange,
  Layers,
  Calendar,
  ChevronLeft,
  ChevronRight,
  X,
} from "lucide-react";
import type { Periodo } from "@/lib/date";
import { getLimaDateString } from "@/lib/date";

interface Props {
  periodo: Periodo;
  setPeriodo: (p: Periodo) => void;
  fecha: string;
  setFecha: (f: string) => void;
}

const MESES = [
  "Enero", "Febrero", "Marzo", "Abril", "Mayo", "Junio",
  "Julio", "Agosto", "Septiembre", "Octubre", "Noviembre", "Diciembre",
];

const DIAS_SEMANA = ["Lu", "Ma", "Mi", "Ju", "Vi", "Sa", "Do"];

function getWeeks(): { label: string; start: Date; end: Date; key: string }[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const weeks: { label: string; start: Date; end: Date; key: string }[] = [];

  for (let i = 0; i < 8; i++) {
    const ref = new Date(now);
    ref.setDate(ref.getDate() - i * 7);
    const dayOfWeek = ref.getDay();
    const diffFromMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const monday = new Date(ref);
    monday.setDate(monday.getDate() - diffFromMonday);
    monday.setHours(0, 0, 0, 0);
    const sunday = new Date(monday);
    sunday.setDate(sunday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    let label: string;
    if (i === 0) label = "Esta semana";
    else if (i === 1) label = "Semana pasada";
    else if (i === 2) label = "Hace 2 semanas";
    else if (i === 3) label = "Hace 3 semanas";
    else label = `Hace ${i} semanas`;

    weeks.push({
      label,
      start: monday,
      end: sunday,
      key: monday.toISOString().split("T")[0],
    });
  }

  return weeks;
}

function getMonths(): { label: string; month: number; year: number; key: string }[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const months: { label: string; month: number; year: number; key: string }[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    let label: string;
    if (i === 0) label = "Este mes";
    else if (i === 1) label = "Mes pasado";
    else label = `${MESES[month]} ${year}`;

    months.push({
      label,
      month,
      year,
      key: `${year}-${String(month + 1).padStart(2, "0")}-01`,
    });
  }

  return months;
}

export function DateFilter({ periodo, setPeriodo, fecha, setFecha }: Props) {
  const [expanded, setExpanded] = useState<"semana" | "mes" | "calendario" | null>(null);
  const [calMonth, setCalMonth] = useState(() => {
    const d = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    return { month: d.getMonth(), year: d.getFullYear() };
  });

  const weeks = getWeeks();
  const months = getMonths();
  const today = getLimaDateString();

  // "Semana" button: first click sets current week, second click opens grid
  const handleSemana = () => {
    if (periodo === "semana") {
      // Already showing week view, toggle grid to pick a different week
      setExpanded(expanded === "semana" ? null : "semana");
    } else {
      // Set to current week
      setExpanded(null);
      setPeriodo("semana");
      setFecha("");
    }
  };

  // "Mes" button: first click sets current month, second click opens grid
  const handleMes = () => {
    if (periodo === "mes") {
      setExpanded(expanded === "mes" ? null : "mes");
    } else {
      setExpanded(null);
      setPeriodo("mes");
      setFecha("");
    }
  };

  const selectWeek = (week: { start: Date; key: string }) => {
    setFecha(week.key);
    setPeriodo("semana");
    setExpanded(null);
  };

  const selectMonth = (m: { key: string }) => {
    setFecha(m.key);
    setPeriodo("mes");
    setExpanded(null);
  };

  const selectDay = (day: number) => {
    const d = new Date(calMonth.year, calMonth.month, day);
    const dateStr = d.toISOString().split("T")[0];
    setFecha(dateStr);
    setPeriodo("personalizado");
    setExpanded(null);
  };

  const handlePreset = (p: Periodo) => {
    setExpanded(null);
    setPeriodo(p);
    if (p === "hoy" || p === "ayer" || p === "todo") {
      setFecha(today);
    }
  };

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfMonth = new Date(calMonth.year, calMonth.month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1;

  const isActive = (p: Periodo) => periodo === p && expanded === null;

  // Dynamic labels for Semana and Mes
  const semanaLabel = (() => {
    if (periodo !== "semana") return "Semana";
    if (!fecha) return "Esta semana";
    const start = new Date(fecha + "T00:00:00");
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    const fmt = (d: Date) =>
      d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });
    return `${fmt(start)} - ${fmt(end)}`;
  })();

  const mesLabel = (() => {
    if (periodo !== "mes") return "Mes";
    if (!fecha) return "Este mes";
    const d = new Date(fecha + "T00:00:00");
    const monthName = d.toLocaleDateString("es-PE", { month: "long" });
    const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
    if (d.getFullYear() !== now.getFullYear()) {
      return `${monthName} ${d.getFullYear()}`;
    }
    return monthName.charAt(0).toUpperCase() + monthName.slice(1);
  })();

  return (
    <div className="relative">
      {/* Glass background */}
      <div className="bg-white/70 dark:bg-slate-800/70 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-lg shadow-slate-200/30 dark:shadow-slate-950/30 p-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Hoy */}
          <button
            onClick={() => handlePreset("hoy")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("hoy")
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 hover:shadow-sm"
            }`}
          >
            <Sun className="w-4 h-4" />
            Hoy
          </button>

          {/* Ayer */}
          <button
            onClick={() => handlePreset("ayer")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("ayer")
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 hover:shadow-sm"
            }`}
          >
            <Moon className="w-4 h-4" />
            Ayer
          </button>

          {/* Semana */}
          <button
            onClick={handleSemana}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              periodo === "semana"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 hover:shadow-sm"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            {semanaLabel}
          </button>

          {/* Mes */}
          <button
            onClick={handleMes}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              periodo === "mes"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 hover:shadow-sm"
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            {mesLabel}
          </button>

          {/* Todo */}
          <button
            onClick={() => handlePreset("todo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("todo")
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 hover:shadow-sm"
            }`}
          >
            <Layers className="w-4 h-4" />
            Todo
          </button>

          <div className="h-8 w-px bg-slate-200/80 dark:bg-slate-600/50 mx-1 hidden sm:block" />

          {/* Elegir dia */}
          <button
            onClick={() => {
              if (periodo === "personalizado") {
                setExpanded(expanded === "calendario" ? null : "calendario");
              } else {
                setExpanded("calendario");
              }
              if (fecha) {
                const d = new Date(fecha + "T00:00:00");
                setCalMonth({ month: d.getMonth(), year: d.getFullYear() });
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              periodo === "personalizado"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 dark:bg-slate-700/60 text-slate-600 dark:text-slate-300 hover:bg-white dark:hover:bg-slate-700 hover:text-slate-800 dark:hover:text-slate-100 hover:shadow-sm"
            }`}
          >
            <Calendar className="w-4 h-4" />
            {periodo === "personalizado" && fecha
              ? new Date(fecha + "T00:00:00").toLocaleDateString("es-PE", {
                  day: "numeric",
                  month: "short",
                })
              : "Elegir dia"}
          </button>

          {/* Clear */}
          {(periodo === "personalizado" || periodo === "semana" || periodo === "mes") && (
            <button
              onClick={() => {
                setPeriodo("hoy");
                setFecha(today);
                setExpanded(null);
              }}
              className="p-2 rounded-lg text-slate-400 dark:text-slate-500 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Week grid */}
      {expanded === "semana" && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-slate-300/30 dark:shadow-slate-950/30 p-4">
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 px-1">
              Selecciona una semana
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weeks.map((w, i) => {
                const isSelectedWeek =
                  periodo === "semana" && fecha === w.key;
                return (
                  <button
                    key={i}
                    onClick={() => selectWeek(w)}
                    className={`text-left p-3 rounded-xl border transition-all hover:shadow-sm ${
                      isSelectedWeek || (i === 0 && periodo === "semana" && !fecha)
                        ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950"
                        : "border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {w.label}
                    </p>
                    <p className="text-xs text-slate-400 dark:text-slate-500 mt-0.5">
                      {w.start.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}{" "}
                      -{" "}
                      {w.end.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Month grid */}
      {expanded === "mes" && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30">
          <div className="bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-2xl border border-white/50 dark:border-slate-700/50 shadow-xl shadow-slate-300/30 dark:shadow-slate-950/30 p-4">
            <h4 className="text-sm font-semibold text-slate-500 dark:text-slate-400 mb-3 px-1">
              Selecciona un mes
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {months.map((m, i) => {
                const isSelectedMonth =
                  periodo === "mes" && fecha === m.key;
                return (
                  <button
                    key={i}
                    onClick={() => selectMonth(m)}
                    className={`text-center p-3 rounded-xl border transition-all hover:shadow-sm ${
                      isSelectedMonth || (i === 0 && periodo === "mes" && !fecha)
                        ? "border-amber-300 dark:border-amber-600 bg-amber-50 dark:bg-amber-950"
                        : "border-slate-100 dark:border-slate-700 hover:border-amber-200 dark:hover:border-amber-600 hover:bg-amber-50/50 dark:hover:bg-amber-950/50"
                    }`}
                  >
                    <p className="text-sm font-semibold text-slate-800 dark:text-slate-200">
                      {m.label}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Calendar */}
      {expanded === "calendario" && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-30">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-300/30 p-4 w-full sm:w-72">
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setCalMonth((p) => {
                    const d = new Date(p.year, p.month - 1, 1);
                    return { month: d.getMonth(), year: d.getFullYear() };
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-700 dark:text-slate-200">
                {MESES[calMonth.month]} {calMonth.year}
              </span>
              <button
                onClick={() =>
                  setCalMonth((p) => {
                    const d = new Date(p.year, p.month + 1, 1);
                    return { month: d.getMonth(), year: d.getFullYear() };
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            <div className="grid grid-cols-7 mb-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 dark:text-slate-500 py-1">
                  {d}
                </div>
              ))}
            </div>

            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === today;
                const isSelected = periodo === "personalizado" && fecha === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`h-9 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-amber-500 text-white shadow-sm"
                        : isToday
                        ? "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400 hover:bg-amber-200 dark:hover:bg-amber-900"
                        : "text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            <button
              onClick={() => {
                setFecha(today);
                setPeriodo("hoy");
                setExpanded(null);
                setCalMonth({
                  month: new Date(today + "T00:00:00").getMonth(),
                  year: new Date(today + "T00:00:00").getFullYear(),
                });
              }}
              className="mt-3 w-full py-2 text-sm font-medium text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950 rounded-xl hover:bg-amber-100 dark:hover:bg-amber-900 transition-colors"
            >
              Ir a Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
