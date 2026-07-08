"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowDown, MessageCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Mensaje } from "@/types/client";
import { ImageLightbox } from "./image-lightbox";
import { AudioPlayer } from "./audio-player";

function formatMsgTime(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatMsgDate(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  if (d.toDateString() === today.toDateString()) return "Hoy";
  if (d.toDateString() === yesterday.toDateString()) return "Ayer";
  return d.toLocaleDateString("es-PE", { day: "numeric", month: "long", year: "numeric" });
}

interface MessageViewerProps {
  telefono: string;
  onClose: () => void;
}

export function MessageViewer({ telefono, onClose }: MessageViewerProps) {
  const [mensajes, setMensajes] = useState<Mensaje[]>([]);
  const [conversacionId, setConversacionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [newMsgBelow, setNewMsgBelow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Step 1: Find conversation by phone, then fetch messages
  const fetchMensajes = useCallback(async () => {
    setLoading(true);

    // Find conversation for this phone number
    const { data: conv } = await supabase
      .from("conversaciones")
      .select("id")
      .eq("telefono", telefono)
      .maybeSingle();

    if (!conv) {
      setMensajes([]);
      setConversacionId(null);
      setLoading(false);
      return;
    }

    setConversacionId(conv.id);

    const { data, error: err } = await supabase
      .from("mensajes")
      .select("*")
      .eq("conversacion_id", conv.id)
      .order("secuencia", { ascending: true });

    if (err) {
      setError(true);
      setLoading(false);
      return;
    }

    setMensajes((data as Mensaje[]) ?? []);
    setLoading(false);
    setError(false);
  }, [telefono]);

  useEffect(() => {
    fetchMensajes();
  }, [fetchMensajes]);

  // Real-time subscription on new messages for this conversation
  useEffect(() => {
    if (!conversacionId) return;

    const channel = supabase
      .channel(`mensajes-${conversacionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "mensajes",
          filter: `conversacion_id=eq.${conversacionId}`,
        },
        () => {
          fetchMensajes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [conversacionId, fetchMensajes]);

  // Auto-scroll to bottom on first load
  useEffect(() => {
    if (!loading && mensajes.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading]);

  // Track if user scrolled up; show "new message" indicator
  useEffect(() => {
    if (mensajes.length > prevCountRef.current && prevCountRef.current > 0) {
      if (userScrolledUp) {
        setNewMsgBelow(true);
      } else {
        bottomRef.current?.scrollIntoView({ behavior: "smooth" });
      }
    }
    prevCountRef.current = mensajes.length;
  }, [mensajes.length, userScrolledUp]);

  const handleScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    const isNearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
    setUserScrolledUp(!isNearBottom);
    if (isNearBottom) setNewMsgBelow(false);
  }, []);

  const scrollToBottom = useCallback(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setNewMsgBelow(false);
  }, []);

  // Escape key to close
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !lightboxUrl) onClose();
    };
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, [onClose, lightboxUrl]);

  // Group messages by date
  const grouped = mensajes.reduce<{ date: string; items: Mensaje[] }[]>((acc, m) => {
    const dateLabel = formatMsgDate(m.timestamp);
    const last = acc[acc.length - 1];
    if (last && last.date === dateLabel) {
      last.items.push(m);
    } else {
      acc.push({ date: dateLabel, items: [m] });
    }
    return acc;
  }, []);

  const isOutgoing = (remitente: string) => remitente === "bot" || remitente === "agente_humano";

  return (
    <>
      <div className="fixed inset-0 z-30 flex justify-end">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-black/20" onClick={onClose} />

        {/* Panel */}
        <div className="relative w-full sm:w-[420px] h-full bg-white shadow-2xl flex flex-col animate-[slideIn_0.2s_ease-out]">
          {/* Header */}
          <div className="shrink-0 flex items-center gap-3 px-4 h-14 border-b border-slate-200 bg-white">
            <button
              onClick={onClose}
              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-500 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div>
              <p className="text-sm font-semibold text-slate-800">{telefono}</p>
              <p className="text-xs text-slate-400">
                {mensajes.length} mensaje{mensajes.length !== 1 ? "s" : ""}
              </p>
            </div>
          </div>

          {/* Messages */}
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex-1 overflow-y-auto bg-slate-50"
          >
            {loading && (
              <div className="flex items-center justify-center h-full">
                <div className="flex flex-col items-center gap-3 text-slate-400">
                  <Loader2 className="w-8 h-8 animate-spin" />
                  <span className="text-sm">Cargando mensajes...</span>
                </div>
              </div>
            )}

            {error && (
              <div className="flex items-center justify-center h-full p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <AlertCircle className="w-10 h-10 text-red-400" />
                  <p className="text-sm text-slate-600">Error al cargar mensajes</p>
                  <button
                    onClick={fetchMensajes}
                    className="text-sm font-medium text-amber-600 hover:text-amber-700 transition-colors"
                  >
                    Reintentar
                  </button>
                </div>
              </div>
            )}

            {!loading && !error && mensajes.length === 0 && (
              <div className="flex items-center justify-center h-full p-6">
                <div className="flex flex-col items-center gap-3 text-center">
                  <MessageCircle className="w-10 h-10 text-slate-300" />
                  <p className="text-sm text-slate-500">No hay mensajes para este contacto</p>
                  <p className="text-xs text-slate-400">
                    Los mensajes apareceran aqui cuando el bot interactue con este numero.
                  </p>
                </div>
              </div>
            )}

            {!loading && !error && grouped.map((group) => (
              <div key={group.date}>
                {/* Date divider */}
                <div className="flex justify-center py-3">
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">
                    {group.date}
                  </span>
                </div>

                {group.items.map((m) => {
                  const outgoing = isOutgoing(m.remitente);
                  return (
                    <div
                      key={m.id}
                      className={`px-4 py-1 flex ${outgoing ? "justify-end" : "justify-start"}`}
                    >
                      <div
                        className={`max-w-[85%] ${
                          outgoing
                            ? "bg-amber-500 text-white rounded-2xl rounded-br-md"
                            : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md"
                        } px-3.5 py-2 shadow-sm`}
                      >
                        {/* Remitente label for agent messages */}
                        {m.remitente === "agente_humano" && (
                          <p className="text-xs text-white/60 mb-0.5">Agente</p>
                        )}

                        {/* Text content */}
                        {m.contenido && (
                          <p className="text-sm whitespace-pre-wrap break-words">{m.contenido}</p>
                        )}

                        {/* Image */}
                        {m.tipo === "imagen" && m.url_adjunto && (
                          <button
                            onClick={() => setLightboxUrl(m.url_adjunto!)}
                            className="mt-1 rounded-lg overflow-hidden block w-full max-w-[240px] hover:opacity-90 transition-opacity"
                          >
                            <img
                              src={m.url_adjunto}
                              alt="Imagen"
                              className="w-full h-auto max-h-[200px] object-cover rounded-lg"
                              loading="lazy"
                            />
                          </button>
                        )}

                        {/* Audio */}
                        {m.tipo === "audio" && m.url_adjunto && (
                          <AudioPlayer url={m.url_adjunto} duracion={m.duracion_segundos} />
                        )}

                        {/* Video */}
                        {m.tipo === "video" && m.url_adjunto && (
                          <video
                            src={m.url_adjunto}
                            controls
                            preload="metadata"
                            className="mt-1 rounded-lg max-w-[240px] max-h-[200px]"
                          />
                        )}

                        {/* Document */}
                        {m.tipo === "documento" && m.url_adjunto && (
                          <a
                            href={m.url_adjunto}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="mt-1 flex items-center gap-2 text-sm underline opacity-80 hover:opacity-100"
                          >
                            {m.contenido || "Documento adjunto"}
                          </a>
                        )}

                        {/* Fallido indicator */}
                        {m.estado_envio === "fallido" && (
                          <p className="text-xs text-red-300 mt-1">Error al enviar</p>
                        )}

                        {/* Timestamp */}
                        <p
                          className={`text-xs mt-1 ${
                            outgoing ? "text-white/70" : "text-slate-400"
                          } text-right`}
                        >
                          {formatMsgTime(m.timestamp)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            ))}

            <div ref={bottomRef} />
          </div>

          {/* Scroll to bottom FAB */}
          {newMsgBelow && (
            <button
              onClick={scrollToBottom}
              className="absolute bottom-4 left-1/2 -translate-x-1/2 p-2 rounded-full bg-amber-500 text-white shadow-lg hover:bg-amber-600 transition-colors animate-[slideUp_0.2s_ease-out]"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Lightbox */}
      {lightboxUrl && (
        <ImageLightbox url={lightboxUrl} onClose={() => setLightboxUrl(null)} />
      )}

      <style jsx>{`
        @keyframes slideIn {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes slideUp {
          from { transform: translate(-50%, 10px); opacity: 0; }
          to { transform: translate(-50%, 0); opacity: 1; }
        }
      `}</style>
    </>
  );
}
