"use client";

import Image from "next/image";
import { Wifi } from "lucide-react";

export function Header({ isLive, count }: { isLive: boolean; count: number }) {
  return (
    <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 h-24 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Image
            src="/logo.png"
            alt="BioNova"
            width={400}
            height={96}
            className="h-20 w-auto"
            priority
          />
          <span className="hidden sm:inline text-xs text-slate-400 font-medium">
            Panel
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-xs text-slate-500">
            {count} contacto{count !== 1 ? "s" : ""}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
              isLive
                ? "bg-emerald-50 text-emerald-600"
                : "bg-slate-100 text-slate-400"
            }`}
          >
            <Wifi className="w-3 h-3" />
            {isLive ? "En vivo" : "Desconectado"}
          </span>
        </div>
      </div>
    </header>
  );
}
