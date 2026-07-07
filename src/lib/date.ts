import type { Cliente } from "@/types/client";

export type Periodo = "hoy" | "ayer" | "semana" | "mes" | "todo" | "personalizado";

interface DateRange {
  start: Date;
  end: Date;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function endOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(23, 59, 59, 999);
  return d;
}

function getLimaNow(): Date {
  return new Date(new Date().toLocaleString("en-US", { timeZone: "America/Lima" }));
}

export function getDateRange(periodo: Periodo, fecha?: string): DateRange {
  const now = getLimaNow();

  switch (periodo) {
    case "hoy":
      return { start: startOfDay(now), end: endOfDay(now) };
    case "ayer": {
      const ayer = new Date(now);
      ayer.setDate(ayer.getDate() - 1);
      return { start: startOfDay(ayer), end: endOfDay(ayer) };
    }
    case "semana": {
      const start = new Date(now);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // lunes = 0
      start.setDate(start.getDate() - diff);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "mes": {
      const start = new Date(now.getFullYear(), now.getMonth(), 1);
      return { start: startOfDay(start), end: endOfDay(now) };
    }
    case "personalizado":
      if (fecha) {
        const d = new Date(fecha + "T00:00:00");
        return { start: startOfDay(d), end: endOfDay(d) };
      }
      return { start: startOfDay(now), end: endOfDay(now) };
    case "todo":
    default:
      return { start: new Date(0), end: new Date(9999, 11, 31) };
  }
}

export function filterByDate(clientes: Cliente[], periodo: Periodo, fecha?: string): Cliente[] {
  const { start, end } = getDateRange(periodo, fecha);

  if (periodo === "todo") return clientes;

  return clientes.filter((c) => {
    if (!c.ultima_interaccion) return false;
    const d = new Date(c.ultima_interaccion);
    return d >= start && d <= end;
  });
}

export function getWeekRevenue(clientes: Cliente[]): number {
  const now = getLimaNow();
  const start = new Date(now);
  const dayOfWeek = start.getDay();
  const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  start.setDate(start.getDate() - diff);
  start.setHours(0, 0, 0, 0);

  return clientes
    .filter((c) => {
      if (!c.ultima_interaccion || c.estado !== "pagado") return false;
      const d = new Date(c.ultima_interaccion);
      return d >= start && d <= now;
    })
    .reduce((sum, c) => sum + (c.recibio_oferta === "recibiodos" ? 8 : 10), 0);
}

export function getMonthRevenue(clientes: Cliente[]): number {
  const now = getLimaNow();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);

  return clientes
    .filter((c) => {
      if (!c.ultima_interaccion || c.estado !== "pagado") return false;
      const d = new Date(c.ultima_interaccion);
      return d >= start && d <= now;
    })
    .reduce((sum, c) => sum + (c.recibio_oferta === "recibiodos" ? 8 : 10), 0);
}

export function getLimaDateString(): string {
  return getLimaNow().toISOString().split("T")[0];
}

export const PERIODO_LABELS: Record<Periodo, string> = {
  hoy: "Hoy",
  ayer: "Ayer",
  semana: "Esta semana",
  mes: "Este mes",
  todo: "Todo",
  personalizado: "Día",
};
