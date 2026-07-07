import { Dashboard } from "./dashboard";
import type { Cliente } from "@/types/client";

export const dynamic = "force-dynamic";

const { NEXT_PUBLIC_SUPABASE_URL: url, NEXT_PUBLIC_SUPABASE_ANON_KEY: key } =
  process.env as Record<string, string>;

async function fetchClientes(): Promise<Cliente[]> {
  const res = await fetch(
    `${url}/rest/v1/clientes?select=*&order=ultima_interaccion_ms.desc`,
    {
      headers: {
        apikey: key,
        Authorization: `Bearer ${key}`,
      },
      cache: "no-store",
    }
  );

  if (!res.ok) {
    console.error("Supabase fetch error:", res.status, await res.text());
    return [];
  }

  const data = await res.json();
  return data as Cliente[];
}

export default async function HomePage() {
  const clientes = await fetchClientes();

  return <Dashboard initialClientes={clientes} />;
}
