import { createClient } from "@/lib/supabase/server";

export interface ClienteRecord {
  id: string;
  email: string;
  nombre: string;
  api_key: string;
  whatsapp_numero: string | null;
  activo: boolean;
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
    .select("id, email, nombre, api_key, whatsapp_numero, activo")
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

  // Admin sees all
  if (auth.email === "admin@bionova.com") return null;

  return auth.cliente?.id ?? null;
}
