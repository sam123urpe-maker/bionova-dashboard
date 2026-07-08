"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Lead } from "@/types/client";

/**
 * @param initialData - SSR-fetched leads
 * @param clienteId - If non-null, scopes refresh to this cliente_id. Null = all leads (admin).
 */
export function useRealtime(initialData: Lead[], clienteId?: string | null) {
  const [leads, setLeads] = useState<Lead[]>(initialData);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    let query = supabase
      .from("leads")
      .select("*")
      .order("ultima_interaccion_ms", { ascending: false });

    if (clienteId) {
      query = query.eq("cliente_id", clienteId);
    }

    const { data } = await query;
    if (data) setLeads(data as Lead[]);
  }, [clienteId]);

  useEffect(() => {
    setLeads(initialData);
  }, [initialData]);

  useEffect(() => {
    const channel = supabase
      .channel("leads-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "leads" },
        () => {
          refresh();
        }
      )
      .subscribe((status) => {
        setIsLive(status === "SUBSCRIBED");
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  return { leads, isLive };
}
