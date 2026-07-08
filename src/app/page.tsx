import { Dashboard } from "./dashboard";
import type { Lead } from "@/types/client";
import type { ClienteRecord } from "@/lib/auth";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

export const dynamic = "force-dynamic";

async function fetchLeads(clienteId: string | null): Promise<Lead[]> {
  const supabase = await createClient();

  let query = supabase
    .from("leads")
    .select("*")
    .order("ultima_interaccion_ms", { ascending: false });

  // Non-admin users only see their own leads
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

export default async function HomePage() {
  const auth = await getAuthUser();
  const clienteId = auth?.cliente?.id ?? null;
  const isAdmin = auth?.email === "admin@bionova.com";

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
    />
  );
}
