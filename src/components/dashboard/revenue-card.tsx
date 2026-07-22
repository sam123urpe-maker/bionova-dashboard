"use client";

import Image from "next/image";
import { Heart, Sparkles } from "lucide-react";
import { Card } from "@/components/ui/card";
import { computeRevenue } from "@/lib/revenue";
import type { Lead } from "@/types/client";

export function RevenueCard({
  leads,
  semanaRevenue,
  mesRevenue,
}: {
  leads: Lead[];
  semanaRevenue: number;
  mesRevenue: number;
}) {
  const { remedios, suerte, total } = computeRevenue(leads);

  return (
    <Card className="p-5">
      <div className="flex items-center gap-3 mb-4">
        <div className="p-2.5 rounded-lg bg-green-100 dark:bg-green-950 text-green-700">
          <Image src="/money.svg" alt="Ingresos" width={64} height={64} />
        </div>
        <div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">Ingresos del periodo</p>
          <p className="text-3xl font-bold text-slate-900 dark:text-slate-100 tabular-nums">
            S/. {total}
          </p>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3 text-sm mb-3">
        <div className="bg-amber-50 dark:bg-amber-950/60 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Heart className="w-3.5 h-3.5 text-amber-500" />
            <p className="text-amber-600 dark:text-amber-400 text-xs font-medium">Remedios</p>
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {remedios.count}{" "}
            <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">pagados</span>
          </p>
          <p className="text-amber-700 dark:text-amber-400 font-bold tabular-nums mt-0.5">
            S/. {remedios.subtotal}
          </p>
        </div>
        <div className="bg-amber-100/60 dark:bg-amber-900/40 rounded-lg p-3 text-center">
          <div className="flex items-center justify-center gap-1.5 mb-1">
            <Sparkles className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-700 dark:text-amber-300 text-xs font-medium">Suerte</p>
          </div>
          <p className="font-semibold text-slate-900 dark:text-slate-100 tabular-nums">
            {suerte.count}{" "}
            <span className="text-slate-400 dark:text-slate-500 font-normal text-xs">pagados</span>
          </p>
          <p className="text-amber-800 dark:text-amber-400 font-bold tabular-nums mt-0.5">
            S/. {suerte.subtotal}
          </p>
        </div>
      </div>

      <div className="border-t border-slate-100 dark:border-slate-700 pt-3 grid grid-cols-2 gap-3 text-sm">
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">Esta semana</p>
          <p className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">S/. {semanaRevenue}</p>
        </div>
        <div className="text-center">
          <p className="text-xs text-slate-400 dark:text-slate-500">Este mes</p>
          <p className="font-bold text-slate-700 dark:text-slate-200 tabular-nums">S/. {mesRevenue}</p>
        </div>
      </div>
    </Card>
  );
}
