"use client";

import type { Lead } from "@/types/client";

const ESTADO_COLORS: Record<Lead["estado"], string> = {
  pagado: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
  esperando: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
  abandonado: "bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-400",
  falta: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
};

const ESTADO_LABELS: Record<Lead["estado"], string> = {
  pagado: "Pagado",
  esperando: "Esperando",
  abandonado: "Abandonado",
  falta: "Falta",
};

export function StatusBadge({ estado }: { estado: Lead["estado"] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

const OFERTA_COLORS: Record<Lead["recibio_oferta"], string> = {
  recibio: "bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-400",
  no_recibio: "bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-400",
  recibiodos: "bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-400",
};

const OFERTA_LABELS: Record<Lead["recibio_oferta"], string> = {
  recibio: "Recibio",
  no_recibio: "No recibio",
  recibiodos: "Recibio dos",
};

export function OfertaBadge({
  oferta,
}: {
  oferta: Lead["recibio_oferta"];
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${OFERTA_COLORS[oferta]}`}
    >
      {OFERTA_LABELS[oferta]}
    </span>
  );
}
