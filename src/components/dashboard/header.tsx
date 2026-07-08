"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Wifi, LogOut, Copy, Check, Key, ChevronDown } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { DashboardUser } from "@/app/dashboard";

export function Header({
  isLive,
  count,
  user,
}: {
  isLive: boolean;
  count: number;
  user: DashboardUser;
}) {
  const [copied, setCopied] = useState(false);
  const [showApi, setShowApi] = useState(false);

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut();
    location.href = "/login";
  }, []);

  const copyApiKey = useCallback(async () => {
    if (!user.cliente?.api_key) return;
    await navigator.clipboard.writeText(user.cliente.api_key);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [user.cliente?.api_key]);

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

        <div className="flex items-center gap-4">
          {/* API Key toggle */}
          {user.cliente && (
            <div className="relative">
              <button
                onClick={() => setShowApi(!showApi)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-amber-600 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50"
              >
                <Key className="w-3.5 h-3.5" />
                API Key
                <ChevronDown className={`w-3 h-3 transition-transform ${showApi ? "rotate-180" : ""}`} />
              </button>

              {showApi && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg p-4 z-30">
                  <p className="text-xs text-slate-500 mb-2">Tu API Key para n8n:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-slate-50 px-3 py-2 rounded-lg font-mono text-slate-700 break-all select-all">
                      {user.cliente.api_key}
                    </code>
                    <button
                      onClick={copyApiKey}
                      className="shrink-0 p-2 rounded-lg hover:bg-slate-100 transition-colors"
                      title="Copiar"
                    >
                      {copied ? (
                        <Check className="w-4 h-4 text-emerald-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-slate-400" />
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Stats */}
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

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
            <span className="text-xs text-slate-600 font-medium max-w-[140px] truncate">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors"
              title="Cerrar sesion"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
