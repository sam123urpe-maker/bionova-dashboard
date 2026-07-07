"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase/client";
import type { Cliente } from "@/types/client";

export function useRealtime(initialData: Cliente[]) {
  const [clientes, setClientes] = useState<Cliente[]>(initialData);
  const [isLive, setIsLive] = useState(false);

  const refresh = useCallback(async () => {
    const { data } = await supabase
      .from("clientes")
      .select("*")
      .order("ultima_interaccion_ms", { ascending: false });
    if (data) setClientes(data as Cliente[]);
  }, []);

  useEffect(() => {
    setClientes(initialData);
  }, [initialData]);

  useEffect(() => {
    const channel = supabase
      .channel("clientes-realtime")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "clientes" },
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

  return { clientes, isLive };
}
