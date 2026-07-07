import { Dashboard } from "./dashboard";
import type { Cliente } from "@/types/client";

export const dynamic = "force-dynamic";

async function fetchClientes(): Promise<Cliente[]> {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!url || !key) {
    console.error("Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY");
    return [];
  }

  try {
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
  } catch (err) {
    console.error("Supabase fetch failed:", err);
    return [];
  }
}

export default async function HomePage() {
  const clientes = await fetchClientes();
  return <Dashboard initialClientes={clientes} />;
}
