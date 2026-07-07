"use client";

import type { Cliente } from "@/types/client";

const ESTADO_COLORS: Record<Cliente["estado"], string> = {
  pagado: "bg-emerald-100 text-emerald-700",
  esperando: "bg-amber-100 text-amber-700",
  abandonado: "bg-red-100 text-red-700",
  falta: "bg-slate-100 text-slate-600",
};

const ESTADO_LABELS: Record<Cliente["estado"], string> = {
  pagado: "Pagado",
  esperando: "Esperando",
  abandonado: "Abandonado",
  falta: "Falta",
};

export function StatusBadge({ estado }: { estado: Cliente["estado"] }) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${ESTADO_COLORS[estado]}`}
    >
      {ESTADO_LABELS[estado]}
    </span>
  );
}

const OFERTA_COLORS: Record<Cliente["recibio_oferta"], string> = {
  recibio: "bg-emerald-100 text-emerald-700",
  no_recibio: "bg-slate-100 text-slate-600",
  recibiodos: "bg-amber-100 text-amber-700",
};

const OFERTA_LABELS: Record<Cliente["recibio_oferta"], string> = {
  recibio: "Recibio",
  no_recibio: "No recibio",
  recibiodos: "Recibio dos",
};

export function OfertaBadge({
  oferta,
}: {
  oferta: Cliente["recibio_oferta"];
}) {
  return (
    <span
      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${OFERTA_COLORS[oferta]}`}
    >
      {OFERTA_LABELS[oferta]}
    </span>
  );
}
