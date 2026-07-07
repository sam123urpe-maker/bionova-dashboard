"use client";

import { useState, useRef, useEffect } from "react";
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

function getWeeks(): { label: string; start: Date; end: Date }[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const weeks: { label: string; start: Date; end: Date }[] = [];

  for (let i = 0; i < 8; i++) {
    const end = new Date(now);
    end.setDate(end.getDate() - i * 7);
    // find sunday of that week
    const dayOfWeek = end.getDay();
    const diffToSunday = dayOfWeek === 0 ? 0 : 7 - dayOfWeek;
    end.setDate(end.getDate() + diffToSunday);

    const start = new Date(end);
    start.setDate(start.getDate() - 6);

    let label: string;
    if (i === 0) label = "Esta semana";
    else if (i === 1) label = "Semana pasada";
    else if (i === 2) label = "Hace 2 semanas";
    else if (i === 3) label = "Hace 3 semanas";
    else label = `Hace ${i} semanas`;

    const formatShort = (d: Date) =>
      d.toLocaleDateString("es-PE", { day: "numeric", month: "short" });

    weeks.push({
      label,
      start: new Date(start),
      end: new Date(end),
    });
  }

  return weeks;
}

function getMonths(): { label: string; month: number; year: number }[] {
  const now = new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
  const months: { label: string; month: number; year: number }[] = [];

  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const month = d.getMonth();
    const year = d.getFullYear();
    let label: string;
    if (i === 0) label = "Este mes";
    else if (i === 1) label = "Mes pasado";
    else label = `${MESES[month]}`;

    months.push({ label, month, year });
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

  const handlePreset = (p: Periodo) => {
    if (p === "semana") {
      setExpanded(expanded === "semana" ? null : "semana");
      return;
    }
    if (p === "mes") {
      setExpanded(expanded === "mes" ? null : "mes");
      return;
    }
    setExpanded(null);
    setPeriodo(p);
  };

  const selectWeek = (week: { start: Date; end: Date }) => {
    setFecha(week.start.toISOString().split("T")[0]);
    setPeriodo("personalizado");
    setExpanded(null);
  };

  const selectMonth = (m: { month: number; year: number }) => {
    const d = new Date(m.year, m.month, 1);
    setFecha(d.toISOString().split("T")[0]);
    setPeriodo("personalizado");
    setExpanded(null);
  };

  const selectDay = (day: number) => {
    const d = new Date(calMonth.year, calMonth.month, day);
    setFecha(d.toISOString().split("T")[0]);
    setPeriodo("personalizado");
    setExpanded(null);
  };

  const daysInMonth = new Date(calMonth.year, calMonth.month + 1, 0).getDate();
  const firstDayOfMonth = new Date(calMonth.year, calMonth.month, 1).getDay();
  const startOffset = firstDayOfMonth === 0 ? 6 : firstDayOfMonth - 1; // Monday start

  const isActive = (p: Periodo) => periodo === p && expanded !== "semana" && expanded !== "mes";

  return (
    <div className="relative">
      {/* Glass background */}
      <div className="bg-white/70 backdrop-blur-xl rounded-2xl border border-white/50 shadow-lg shadow-slate-200/30 p-2">
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Hoy */}
          <button
            onClick={() => handlePreset("hoy")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("hoy")
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
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
                : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            <Moon className="w-4 h-4" />
            Ayer
          </button>

          {/* Semana */}
          <button
            onClick={() => handlePreset("semana")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              expanded === "semana"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : periodo === "semana"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            <CalendarDays className="w-4 h-4" />
            Semana
          </button>

          {/* Mes */}
          <button
            onClick={() => handlePreset("mes")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              expanded === "mes"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : periodo === "mes"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            <CalendarRange className="w-4 h-4" />
            Mes
          </button>

          {/* Todo */}
          <button
            onClick={() => handlePreset("todo")}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              isActive("todo")
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
            }`}
          >
            <Layers className="w-4 h-4" />
            Todo
          </button>

          <div className="h-8 w-px bg-slate-200/80 mx-1 hidden sm:block" />

          {/* Elegir dia */}
          <button
            onClick={() => {
              setExpanded(expanded === "calendario" ? null : "calendario");
              if (fecha) {
                const d = new Date(fecha + "T00:00:00");
                setCalMonth({ month: d.getMonth(), year: d.getFullYear() });
              }
            }}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
              expanded === "calendario"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : periodo === "personalizado"
                ? "bg-amber-500 text-white shadow-md shadow-amber-500/25"
                : "bg-white/60 text-slate-600 hover:bg-white hover:text-slate-800 hover:shadow-sm"
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

          {/* Clear selection */}
          {periodo === "personalizado" && (
            <button
              onClick={() => {
                setPeriodo("hoy");
                setFecha(today);
                setExpanded(null);
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Expanded: Week grid */}
      {expanded === "semana" && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-300/30 p-4">
            <h4 className="text-sm font-semibold text-slate-500 mb-3 px-1">
              Selecciona una semana
            </h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {weeks.map((w, i) => (
                <button
                  key={i}
                  onClick={() => selectWeek(w)}
                  className="text-left p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {w.label}
                  </p>
                  <p className="text-xs text-slate-400 mt-0.5">
                    {w.start.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}{" "}
                    -{" "}
                    {w.end.toLocaleDateString("es-PE", { day: "numeric", month: "short" })}
                  </p>
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded: Month grid */}
      {expanded === "mes" && (
        <div className="absolute top-full left-0 right-0 mt-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-300/30 p-4">
            <h4 className="text-sm font-semibold text-slate-500 mb-3 px-1">
              Selecciona un mes
            </h4>
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
              {months.map((m, i) => (
                <button
                  key={i}
                  onClick={() => selectMonth(m)}
                  className="text-center p-3 rounded-xl border border-slate-100 hover:border-amber-300 hover:bg-amber-50 transition-all hover:shadow-sm"
                >
                  <p className="text-sm font-semibold text-slate-800">
                    {m.label}
                  </p>
                  {i >= 2 && (
                    <p className="text-xs text-slate-400 mt-0.5">{m.year}</p>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Expanded: Calendar */}
      {expanded === "calendario" && (
        <div className="absolute top-full left-0 sm:left-auto sm:right-0 mt-2 z-30 animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white/95 backdrop-blur-xl rounded-2xl border border-white/50 shadow-xl shadow-slate-300/30 p-4 w-full sm:w-72">
            {/* Month navigation */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() =>
                  setCalMonth((p) => {
                    const d = new Date(p.year, p.month - 1, 1);
                    return { month: d.getMonth(), year: d.getFullYear() };
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm font-semibold text-slate-700">
                {MESES[calMonth.month]} {calMonth.year}
              </span>
              <button
                onClick={() =>
                  setCalMonth((p) => {
                    const d = new Date(p.year, p.month + 1, 1);
                    return { month: d.getMonth(), year: d.getFullYear() };
                  })
                }
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Day names */}
            <div className="grid grid-cols-7 mb-1">
              {DIAS_SEMANA.map((d) => (
                <div key={d} className="text-center text-xs font-medium text-slate-400 py-1">
                  {d}
                </div>
              ))}
            </div>

            {/* Days grid */}
            <div className="grid grid-cols-7 gap-1">
              {Array.from({ length: startOffset }).map((_, i) => (
                <div key={`empty-${i}`} />
              ))}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1;
                const dateStr = `${calMonth.year}-${String(calMonth.month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
                const isToday = dateStr === today;
                const isSelected = fecha === dateStr;

                return (
                  <button
                    key={day}
                    onClick={() => selectDay(day)}
                    className={`h-9 rounded-lg text-sm font-medium transition-all ${
                      isSelected
                        ? "bg-amber-500 text-white shadow-sm"
                        : isToday
                        ? "bg-amber-100 text-amber-700 hover:bg-amber-200"
                        : "text-slate-600 hover:bg-slate-100"
                    }`}
                  >
                    {day}
                  </button>
                );
              })}
            </div>

            {/* Hoy quick button */}
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
              className="mt-3 w-full py-2 text-sm font-medium text-amber-600 bg-amber-50 rounded-xl hover:bg-amber-100 transition-colors"
            >
              Ir a Hoy
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
