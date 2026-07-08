export interface Lead {
  id: number;
  cliente_id?: string;
  telefono: string;
  kit: "remedios" | "suerte";
  estado: "pagado" | "abandonado" | "esperando" | "falta";
  ofertas_enviadas: number;
  ultima_interaccion_ms: number;
  processing: boolean;
  recibio_oferta: "recibio" | "no_recibio" | "recibiodos";
  ultima_interaccion: string;
}

export type EstadoFilter = Lead["estado"] | "todos";
export type KitFilter = Lead["kit"] | "todos";
export type OfertaFilter = Lead["recibio_oferta"] | "todos";
