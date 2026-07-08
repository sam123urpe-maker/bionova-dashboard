import { redirect } from "next/navigation";
import { getAuthUser } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";
import { BotsClient } from "./bots-client";
import type { SolicitudBot } from "@/types/client";

export const dynamic = "force-dynamic";

export default async function AdminBotsPage() {
  const auth = await getAuthUser();

  // Only admin can access
  if (!auth || auth.email !== "admin@bionova.com") {
    redirect("/");
  }

  const supabase = await createClient();

  // Fetch solicitudes from last 7 days by default
  const hace7dias = new Date();
  hace7dias.setDate(hace7dias.getDate() - 7);

  const { data: solicitudes } = await supabase
    .from("solicitudes_bot")
    .select("*")
    .in("estado", ["pendiente", "procesando"])
    .gte("created_at", hace7dias.toISOString())
    .order("created_at", { ascending: false });

  // Fetch client names for display
  const clienteIds = [...new Set((solicitudes ?? []).map((s) => s.cliente_id))];
  const { data: clientes } =
    clienteIds.length > 0
      ? await supabase.from("clientes").select("id, nombre").in("id", clienteIds)
      : { data: [] };

  const clienteMap = new Map((clientes ?? []).map((c) => [c.id, c.nombre]));

  return (
    <BotsClient
      initialSolicitudes={(solicitudes as SolicitudBot[]) ?? []}
      clienteMap={clienteMap}
    />
  );
}
