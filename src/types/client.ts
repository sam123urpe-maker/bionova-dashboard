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

export interface MedioPago {
  tipo: "yape" | "plin" | "transferencia_bancaria" | "otro";
  dato: string;
  titular: string;
}

export interface SolicitudBot {
  id: string;
  cliente_id: string;
  nombre_curso: string;
  descripcion_curso: string | null;
  precio_oferta: number;
  precio_regular: number;
  moneda: string;
  medios_pago: MedioPago[];
  link_entrega: string | null;
  bonos_extras: string[] | null;
  mensaje_bienvenida: string | null;
  config_json: Record<string, unknown>;
  estado: "pendiente" | "procesando" | "entregado";
  created_at: string;
  procesado_at: string | null;
}

export interface SolicitudBotInsert {
  cliente_id: string;
  nombre_curso: string;
  descripcion_curso: string | null;
  precio_oferta: number;
  precio_regular: number;
  moneda: string;
  medios_pago: MedioPago[];
  link_entrega: string | null;
  bonos_extras: string[] | null;
  mensaje_bienvenida: string | null;
  config_json: Record<string, unknown>;
}
