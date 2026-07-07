export interface Cliente {
  id: number;
  telefono: string;
  kit: "remedios" | "suerte";
  estado: "pagado" | "abandonado" | "esperando" | "falta";
  ofertas_enviadas: number;
  ultima_interaccion_ms: number;
  processing: boolean;
  recibio_oferta: "recibio" | "no_recibio" | "recibiodos";
  ultima_interaccion: string;
}

export type EstadoFilter = Cliente["estado"] | "todos";
export type KitFilter = Cliente["kit"] | "todos";
export type OfertaFilter = Cliente["recibio_oferta"] | "todos";
