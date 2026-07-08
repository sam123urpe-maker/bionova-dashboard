import type { Lead } from "@/types/client";

interface KitRevenue {
  count: number;
  subtotal: number;
}

interface RevenueBreakdown {
  remedios: KitRevenue;
  suerte: KitRevenue;
  total: number;
}

function precio(lead: Lead): number {
  if (lead.estado !== "pagado") return 0;
  return lead.recibio_oferta === "recibiodos" ? 8 : 10;
}

export function computeRevenue(leads: Lead[]): RevenueBreakdown {
  const pagados = leads.filter((c) => c.estado === "pagado");

  const remedios = pagados.filter((c) => c.kit === "remedios");
  const suerte = pagados.filter((c) => c.kit === "suerte");

  const subtotalRemedios = remedios.reduce((sum, c) => sum + precio(c), 0);
  const subtotalSuerte = suerte.reduce((sum, c) => sum + precio(c), 0);

  return {
    remedios: { count: remedios.length, subtotal: subtotalRemedios },
    suerte: { count: suerte.length, subtotal: subtotalSuerte },
    total: subtotalRemedios + subtotalSuerte,
  };
}
