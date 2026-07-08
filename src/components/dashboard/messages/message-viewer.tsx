"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { X, ArrowDown, MessageCircle, AlertCircle, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import type { Mensaje } from "@/types/client";
import { ImageLightbox } from "./image-lightbox";
import { AudioPlayer } from "./audio-player";

function formatMsgTime(ms: number): string {
  const d = new Date(ms);
  return d.toLocaleTimeString("es-PE", { hour: "2-digit", minute: "2-digit" });
}

function formatMsgDate(ms: number): string {
  const d = new Date(ms);
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
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [lightboxUrl, setLightboxUrl] = useState<string | null>(null);
  const [userScrolledUp, setUserScrolledUp] = useState(false);
  const [newMsgBelow, setNewMsgBelow] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const prevCountRef = useRef(0);

  // Fetch messages
  const fetchMensajes = useCallback(async () => {
    const { data, error: err } = await supabase
      .from("mensajes")
      .select("*")
      .eq("telefono", telefono)
      .order("timestamp_ms", { ascending: true });

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

  // Real-time subscription
  useEffect(() => {
    const channel = supabase
      .channel(`mensajes-${telefono}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "mensajes", filter: `telefono=eq.${telefono}` },
        () => {
          fetchMensajes();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [telefono, fetchMensajes]);

  // Auto-scroll to bottom on first load
  useEffect(() => {
    if (!loading && mensajes.length > 0) {
      bottomRef.current?.scrollIntoView({ behavior: "auto" });
    }
  }, [loading]); // Only on initial load

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
    const dateLabel = formatMsgDate(m.timestamp_ms);
    const last = acc[acc.length - 1];
    if (last && last.date === dateLabel) {
      last.items.push(m);
    } else {
      acc.push({ date: dateLabel, items: [m] });
    }
    return acc;
  }, []);

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

                {group.items.map((m) => (
                  <div
                    key={m.id}
                    className={`px-4 py-1 flex ${m.direccion === "saliente" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`max-w-[85%] ${
                        m.direccion === "saliente"
                          ? "bg-amber-500 text-white rounded-2xl rounded-br-md"
                          : "bg-white border border-slate-200 text-slate-800 rounded-2xl rounded-bl-md"
                      } px-3.5 py-2 shadow-sm`}
                    >
                      {/* Text content */}
                      {m.contenido && (
                        <p className="text-sm whitespace-pre-wrap break-words">{m.contenido}</p>
                      )}

                      {/* Image */}
                      {m.tipo === "imagen" && m.url && (
                        <button
                          onClick={() => setLightboxUrl(m.url)}
                          className="mt-1 rounded-lg overflow-hidden block w-full max-w-[240px] hover:opacity-90 transition-opacity"
                        >
                          <img
                            src={m.url}
                            alt="Imagen"
                            className="w-full h-auto max-h-[200px] object-cover rounded-lg"
                            loading="lazy"
                          />
                        </button>
                      )}

                      {/* Audio */}
                      {m.tipo === "audio" && m.url && (
                        <AudioPlayer url={m.url} duracion={m.duracion_segundos} />
                      )}

                      {/* Video */}
                      {m.tipo === "video" && m.url && (
                        <video
                          src={m.url}
                          controls
                          preload="metadata"
                          className="mt-1 rounded-lg max-w-[240px] max-h-[200px]"
                        />
                      )}

                      {/* Document */}
                      {m.tipo === "documento" && m.url && (
                        <a
                          href={m.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="mt-1 flex items-center gap-2 text-sm underline opacity-80 hover:opacity-100"
                        >
                          {m.contenido || "Documento adjunto"}
                        </a>
                      )}

                      {/* Timestamp */}
                      <p
                        className={`text-xs mt-1 ${
                          m.direccion === "saliente" ? "text-white/70" : "text-slate-400"
                        } text-right`}
                      >
                        {formatMsgTime(m.timestamp_ms)}
                      </p>
                    </div>
                  </div>
                ))}
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
