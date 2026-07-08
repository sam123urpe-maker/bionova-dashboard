"use client";

import { useState } from "react";
import Link from "next/link";
import type { Lead } from "@/types/client";
import type { ClienteRecord } from "@/lib/auth";
import type { SolicitudActiva } from "@/lib/auth";
import { useRealtime } from "@/hooks/useRealtime";
import { Header } from "@/components/dashboard/header";
import { DateFilter } from "@/components/dashboard/date-filter";
import { KpiCards } from "@/components/dashboard/kpi-cards";
import { RevenueCard } from "@/components/dashboard/revenue-card";
import { StatusDonut } from "@/components/dashboard/charts/status-donut";
import { KitBar } from "@/components/dashboard/charts/kit-bar";
import { ClientsTable } from "@/components/dashboard/table/clients-table";
import { BotBuildingBanner, AdminBotsBanner } from "@/components/dashboard/bot-building";
import { filterByDate, getLimaDateString, getWeekRevenue, getMonthRevenue } from "@/lib/date";
import type { Periodo } from "@/lib/date";
import { Sparkles, BarChart3, Table2, TrendingUp } from "lucide-react";

export interface DashboardUser {
  email: string;
  cliente: ClienteRecord | null;
  isAdmin: boolean;
}

export function Dashboard({
  initialLeads,
  user,
  solicitudActiva,
  pendingBotsCount,
}: {
  initialLeads: Lead[];
  user: DashboardUser;
  solicitudActiva: SolicitudActiva | null;
  pendingBotsCount: number;
}) {
  const scopeId = user.isAdmin ? null : (user.cliente?.id ?? undefined);
  const { leads, isLive } = useRealtime(initialLeads, scopeId);
  const [periodo, setPeriodo] = useState<Periodo>("hoy");
  const [fecha, setFecha] = useState(getLimaDateString());

  const filtrados = filterByDate(leads, periodo, fecha);

  // Determine client bot state
  const isClient = !user.isAdmin;
  const hasActiveBot = user.cliente?.bot_activo ?? false;
  const showLockedDashboard = isClient && !hasActiveBot;

  return (
    <div className="min-h-screen">
      <Header isLive={isLive} count={filtrados.length} user={user} />

      {/* Bot building state for clients */}
      {showLockedDashboard && (
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {solicitudActiva ? (
            <BotBuildingBanner
              nombreCurso={solicitudActiva.nombre_curso}
              estado={solicitudActiva.estado}
              fecha={solicitudActiva.created_at}
            />
          ) : (
            /* No active bot, no pending request → CTA */
            <div className="bg-gradient-to-br from-slate-50 to-amber-50/30 border border-slate-200 rounded-2xl p-8 text-center">
              <div className="w-20 h-20 mx-auto mb-5 rounded-2xl bg-amber-100 flex items-center justify-center">
                <Sparkles className="w-10 h-10 text-amber-600" />
              </div>
              <h2 className="text-xl font-semibold text-slate-800 mb-2">
                Potencia tu negocio con un Agente Virtual
              </h2>
              <p className="text-sm text-slate-500 max-w-md mx-auto mb-6">
                Automatiza tus ventas 24/7 con un bot de WhatsApp que atiende, responde
                objeciones y cierra ventas por ti. Solo necesitas tu curso y nosotros lo
                armamos.
              </p>
              <Link
                href="/crear-agente"
                className="inline-flex items-center gap-2 px-6 py-3 bg-amber-600 hover:bg-amber-700 text-white text-sm font-medium rounded-xl transition-colors"
              >
                <Sparkles className="w-4 h-4" />
                Crear mi agente
              </Link>
            </div>
          )}

          {/* Locked feature previews */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
            <LockedFeature
              icon={<BarChart3 className="w-5 h-5" />}
              title="KPIs y métricas"
              description="Ventas, conversiones y revenue en tiempo real"
            />
            <LockedFeature
              icon={<TrendingUp className="w-5 h-5" />}
              title="Gráficos y reportes"
              description="Visualiza el rendimiento de tu bot por día, semana y mes"
            />
            <LockedFeature
              icon={<Table2 className="w-5 h-5" />}
              title="Base de contactos"
              description="Todos tus leads organizados con estado de cada conversación"
            />
          </div>
        </main>
      )}

      {/* Normal dashboard (admin or client with active bot) */}
      {!showLockedDashboard && (
        <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
          {/* Admin: show pending bots banner with chatbot animation */}
          {user.isAdmin && pendingBotsCount > 0 && (
            <AdminBotsBanner count={pendingBotsCount} />
          )}
          <DateFilter
            periodo={periodo}
            setPeriodo={setPeriodo}
            fecha={fecha}
            setFecha={setFecha}
          />
          <KpiCards leads={filtrados} />
          <RevenueCard
            leads={filtrados}
            semanaRevenue={getWeekRevenue(leads)}
            mesRevenue={getMonthRevenue(leads)}
          />

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            <StatusDonut leads={filtrados} />
            <KitBar leads={filtrados} />
          </div>

          <ClientsTable leads={filtrados} />
        </main>
      )}
    </div>
  );
}

function LockedFeature({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200 bg-slate-50/50 p-5">
      <div className="absolute inset-0 backdrop-blur-[1px] bg-white/40 z-10" />
      <div className="absolute top-3 right-3 z-20">
        <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-slate-200/80 text-xs font-medium text-slate-500">
          Próximamente
        </span>
      </div>
      <div className="relative z-0">
        <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center text-slate-400 mb-3">
          {icon}
        </div>
        <h3 className="text-sm font-semibold text-slate-400 mb-1">{title}</h3>
        <p className="text-xs text-slate-300">{description}</p>
      </div>
    </div>
  );
}
