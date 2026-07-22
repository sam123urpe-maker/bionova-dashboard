"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { Wifi, LogOut, Copy, Check, Key, ChevronDown, Package, Sparkles, Sun, Moon } from "lucide-react";
import Link from "next/link";
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
  const [dark, setDark] = useState(() => {
    if (typeof window === "undefined") return false;
    return document.documentElement.classList.contains("dark");
  });

  const toggleDark = useCallback(() => {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    try {
      localStorage.setItem("bionova-dark-mode", String(next));
    } catch {}
  }, [dark]);

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
    <header className="sticky top-0 z-20 bg-white/80 dark:bg-slate-900/80 backdrop-blur-sm border-b border-slate-200 dark:border-slate-800">
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
          <span className="hidden sm:inline text-xs text-slate-400 dark:text-slate-500 font-medium">
            Panel
          </span>
        </div>

        <div className="flex items-center gap-4">
          {/* API Key toggle */}
          {user.cliente && (
            <div className="relative">
              <button
                onClick={() => setShowApi(!showApi)}
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-amber-600 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                <Key className="w-3.5 h-3.5" />
                Tu ID
                <ChevronDown className={`w-3 h-3 transition-transform ${showApi ? "rotate-180" : ""}`} />
              </button>

              {showApi && (
                <div className="absolute right-0 top-full mt-2 w-80 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl shadow-lg p-4 z-30">
                  <p className="text-xs text-slate-500 dark:text-slate-400 mb-2">Tu ID:</p>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 text-xs bg-slate-50 dark:bg-slate-900 px-3 py-2 rounded-lg font-mono text-slate-700 dark:text-slate-300 break-all select-all">
                      {user.cliente.api_key}
                    </code>
                    <button
                      onClick={copyApiKey}
                      className="shrink-0 p-2 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-700 transition-colors"
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

          {/* Admin: Panel de Bots */}
          {user.isAdmin && (
            <>
              <Link
                href="/admin/bots"
                className="flex items-center gap-1.5 text-xs font-medium text-slate-500 dark:text-slate-400 hover:text-amber-600 transition-colors px-2 py-1 rounded-lg hover:bg-amber-50 dark:hover:bg-amber-950"
              >
                <Package className="w-3.5 h-3.5" />
                Bots
              </Link>
              <Link
                href="/crear-agente"
                className="flex items-center gap-1.5 text-xs font-medium bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-lg transition-colors"
              >
                <Sparkles className="w-3.5 h-3.5" />
                Crear Agente
              </Link>
            </>
          )}

          {/* Stats */}
          <span className="text-xs text-slate-500 dark:text-slate-400">
            {count} contacto{count !== 1 ? "s" : ""}
          </span>
          <span
            className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-full ${
              isLive
                ? "bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400"
                : "bg-slate-100 dark:bg-slate-800 text-slate-400 dark:text-slate-500"
            }`}
          >
            <Wifi className="w-3 h-3" />
            {isLive ? "En vivo" : "Desconectado"}
          </span>

          {/* Dark mode toggle */}
          <button
            onClick={toggleDark}
            className="p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500 dark:text-slate-400 transition-colors"
            title={dark ? "Modo claro" : "Modo oscuro"}
          >
            {dark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          </button>

          {/* User & Logout */}
          <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
            <span className="text-xs text-slate-600 dark:text-slate-400 font-medium max-w-[140px] truncate">
              {user.email}
            </span>
            <button
              onClick={handleLogout}
              className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-950 text-slate-400 hover:text-red-500 transition-colors"
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
