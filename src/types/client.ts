export interface Lead {
  id: number;
  cliente_id?: string;
  telefono: string;
  kit: string;
  estado: "pagado" | "abandonado" | "esperando" | "falta";
  ofertas_enviadas: number;
  ultima_interaccion_ms: number;
  processing: boolean;
  recibio_oferta: "recibio" | "no_recibio" | "recibiodos";
  ultima_interaccion: string;
}

export type EstadoFilter = Lead["estado"] | "todos";
export type KitFilter = string | "todos";
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
  precio_2da_oferta: number | null;
  moneda: string;
  medios_pago: MedioPago[];
  link_entrega: string | null;
  bonos_extras: string[] | null;
  mensaje_bienvenida: string | null;
  whatsapp_token: string | null;
  whatsapp_phone_number_id: string | null;
  groq_api_key: string | null;
  imgbb_api_key: string | null;
  n8n_url: string | null;
  n8n_api_key: string | null;
  config_json: Record<string, unknown>;
  estado: "pendiente" | "procesando" | "entregado";
  created_at: string;
  procesado_at: string | null;
}

export interface Conversacion {
  id: string;
  cliente_id: string;
  telefono: string;
  nombre_contacto: string | null;
  ultima_actividad: string;
  created_at: string;
}

export interface Mensaje {
  id: string;
  cliente_id: string;
  conversacion_id: string;
  wa_message_id: string;
  secuencia: number;
  remitente: "contacto" | "bot" | "agente_humano";
  tipo: "texto" | "imagen" | "audio" | "video" | "documento";
  contenido: string | null;
  url_adjunto: string | null;
  duracion_segundos: number | null;
  estado_envio: "pendiente" | "enviado" | "fallido";
  timestamp: string;
  created_at: string;
}

export interface MensajeFallido {
  id: string;
  cliente_id: string | null;
  payload_original: Record<string, unknown>;
  motivo_error: string;
  intentos: number;
  resuelto: boolean;
  created_at: string;
}

export interface SolicitudBotInsert {
  cliente_id: string;
  nombre_curso: string;
  descripcion_curso: string | null;
  precio_oferta: number;
  precio_regular: number;
  precio_2da_oferta: number | null;
  moneda: string;
  medios_pago: MedioPago[];
  link_entrega: string | null;
  bonos_extras: string[] | null;
  mensaje_bienvenida: string | null;
  whatsapp_token: string | null;
  whatsapp_phone_number_id: string | null;
  groq_api_key: string | null;
  imgbb_api_key: string | null;
  n8n_url: string | null;
  n8n_api_key: string | null;
  config_json: Record<string, unknown>;
}
