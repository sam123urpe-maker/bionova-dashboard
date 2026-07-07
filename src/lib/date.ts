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
      // If a specific date is provided (from week picker), use that week
      const base = fecha ? new Date(fecha + "T00:00:00") : now;
      const start = new Date(base);
      const dayOfWeek = start.getDay();
      const diff = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // lunes = 0
      start.setDate(start.getDate() - diff);
      const end = new Date(start);
      end.setDate(end.getDate() + 6);
      return { start: startOfDay(start), end: endOfDay(end) };
    }
    case "mes": {
      // If a specific date is provided (from month picker), use that month
      const base = fecha ? new Date(fecha + "T00:00:00") : now;
      const start = new Date(base.getFullYear(), base.getMonth(), 1);
      const end = new Date(base.getFullYear(), base.getMonth() + 1, 0);
      return { start: startOfDay(start), end: endOfDay(end) };
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
  if (periodo === "todo") return clientes;

  const { start, end } = getDateRange(periodo, fecha);

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
