"use client";

import { Banknote, Heart, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { computeRevenue } from "@/lib/revenue";
import type { Cliente } from "@/types/client";

export function RevenueCard({
  clientes,
  semanaRevenue,
  mesRevenue,
}: {
  clientes: Cliente[];
  semanaRevenue: number;
  mesRevenue: number;
}) {
  const { remedios, suerte, total } = computeRevenue(clientes);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-green-100 text-green-700">
          <Banknote className="w-5 h-5" />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700">Ingresos del periodo</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums">
            S/. {total}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="bg-amber-50 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Heart className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-amber-600 text-xs font-medium">Remedios</p>
          </div>
          <p className="font-semibold text-slate-900 tabular-nums">
            {remedios.count}{" "}
            <span className="text-slate-400 font-normal text-xs">pagados</span>
          </p>
          <p className="text-amber-700 font-bold tabular-nums mt-0.5">
            S/. {remedios.subtotal}
          </p>
        </div>
        <div className="bg-amber-100/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600" />
            <p className="text-amber-700 text-xs font-medium">Suerte</p>
          </div>
          <p className="font-semibold text-slate-900 tabular-nums">
            {suerte.count}{" "}
            <span className="text-slate-400 font-normal text-xs">pagados</span>
          </p>
          <p className="text-amber-800 font-bold tabular-nums mt-0.5">
            S/. {suerte.subtotal}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 pt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="text-center">
          <p className="text-xs text-slate-400">Esta semana</p>
          <p className="font-bold text-slate-700 tabular-nums">S/. {semanaRevenue}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400">Este mes</p>
          <p className="font-bold text-slate-700 tabular-nums">S/. {mesRevenue}</p>
        </div>
      </div>
    </Card>
  );
}
