import { createClient } from "@/lib/supabase/server";

export interface ClienteRecord {
  id: string;
  email: string;
  nombre: string;
  api_key: string;
  whatsapp_numero: string | null;
  activo: boolean;
  bot_activo: boolean;
  rol: "admin" | "cliente";
}

export interface AuthUser {
  id: string;
  email: string;
  cliente: ClienteRecord | null;
}

/**
 * Get the authenticated user and their cliente record.
 * Call from server components only.
 */
export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user?.email) return null;

  // Query clientes by email
  const { data: cliente } = await supabase
    .from("clientes")
    .select("id, email, nombre, api_key, whatsapp_numero, activo, bot_activo, rol")
    .eq("email", user.email)
    .maybeSingle();

  return {
    id: user.id,
    email: user.email,
    cliente: cliente as ClienteRecord | null,
  };
}

/**
 * Get the cliente_id for the current user. Admin (admin@bionova.com) returns null
 * meaning "see all". Other users return their cliente UUID for scoping.
 */
export async function getScopeClienteId(): Promise<string | null> {
  const auth = await getAuthUser();
  if (!auth) return null;

  // Everyone is scoped to their own cliente_id (including admin)
  return auth.cliente?.id ?? null;
}

export interface SolicitudActiva {
  id: string;
  estado: "pendiente" | "procesando" | "entregado";
  nombre_curso: string;
  created_at: string;
}

/**
 * Get the active bot request for a client, if any.
 * Returns the most recent solicitud that is NOT 'entregado', or null.
 */
export async function getSolicitudActiva(
  clienteId: string,
): Promise<SolicitudActiva | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("solicitudes_bot")
    .select("id, estado, nombre_curso, created_at")
    .eq("cliente_id", clienteId)
    .in("estado", ["pendiente", "procesando"])
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as SolicitudActiva | null;
}
