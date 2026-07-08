import { Dashboard } from "./dashboard";
import type { Lead } from "@/types/client";
import { getAuthUser, getSolicitudActiva } from "@/lib/auth";
import type { SolicitudActiva } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function fetchLeads(clienteId: string | null): Promise<Lead[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .order("ultima_interaccion_ms", { ascending: false });

  if (clienteId) {
    query = query.eq("cliente_id", clienteId);
  }

  const { data, error } = await query;

  if (error) {
    console.error("Supabase fetch error:", error);
    return [];
  }

  return (data as Lead[]) ?? [];
}

async function fetchPendingCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("solicitudes_bot")
    .select("*", { count: "exact", head: true })
    .in("estado", ["pendiente", "procesando"]);
  return count ?? 0;
}

export default async function HomePage() {
  const auth = await getAuthUser();
  const clienteId = auth?.cliente?.id ?? null;
  const isAdmin = auth?.email === "admin@bionova.com";

  // Fetch solicitud activa for non-admin clients
  let solicitudActiva: SolicitudActiva | null = null;
  if (!isAdmin && clienteId) {
    solicitudActiva = await getSolicitudActiva(clienteId);
  }

  // Admin: fetch count of pending bot requests
  const pendingBotsCount = isAdmin ? await fetchPendingCount() : 0;

  // For non-admin users without a cliente record, return empty
  if (!isAdmin && !clienteId) {
    return (
      <Dashboard
        initialLeads={[]}
        user={{
          email: auth?.email ?? "",
          cliente: null,
          isAdmin: false,
        }}
        solicitudActiva={null}
        pendingBotsCount={0}
      />
    );
  }

  // Admin sees all (clienteId = null), others see only their leads
  const leads = await fetchLeads(isAdmin ? null : clienteId);

  return (
    <Dashboard
      initialLeads={leads}
      user={{
        email: auth?.email ?? "",
        cliente: auth?.cliente ?? null,
        isAdmin,
      }}
      solicitudActiva={solicitudActiva}
      pendingBotsCount={pendingBotsCount}
    />
  );
}
