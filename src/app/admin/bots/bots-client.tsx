"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import {
  Download,
  Package,
  CheckCircle2,
  Loader2,
  Clock,
  ArrowLeft,
  FileJson,
  FolderArchive,
  Bot,
  Cpu,
  ImageIcon,
  Webhook,
  Key,
} from "lucide-react";
import type JSZipType from "jszip";
import type { SolicitudBot } from "@/types/client";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

function downloadJSON(data: Record<string, unknown>, filename: string) {
  const blob = new Blob([JSON.stringify(data, null, 2)], {
    type: "application/json",
  });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

const ESTADO_LABEL: Record<string, { label: string; className: string }> = {
  pendiente: {
    label: "Pendiente",
    className: "bg-amber-50 text-amber-700 border-amber-200",
  },
  procesando: {
    label: "Procesando",
    className: "bg-blue-50 text-blue-700 border-blue-200",
  },
  entregado: {
    label: "Entregado",
    className: "bg-emerald-50 text-emerald-700 border-emerald-200",
  },
};

export function BotsClient({
  initialSolicitudes,
  clienteMap,
}: {
  initialSolicitudes: SolicitudBot[];
  clienteMap: Map<string, string>;
}) {
  const [solicitudes, setSolicitudes] = useState(initialSolicitudes);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [showAll, setShowAll] = useState(false);

  const displayed = showAll
    ? solicitudes
    : solicitudes.filter((s) => {
        const d = new Date(s.created_at);
        const hace7dias = new Date();
        hace7dias.setDate(hace7dias.getDate() - 7);
        return d >= hace7dias;
      });

  const updateEstado = useCallback(
    async (id: string, estado: "procesando" | "entregado") => {
      setUpdatingId(id);
      const updates: Record<string, unknown> = { estado };
      if (estado === "entregado") {
        updates.procesado_at = new Date().toISOString();

        // Also mark bot_activo = true on the clientes table
        const sol = solicitudes.find((s) => s.id === id);
        if (sol) {
          await supabase
            .from("clientes")
            .update({ bot_activo: true })
            .eq("id", sol.cliente_id);
        }
      }

      const { error } = await supabase
        .from("solicitudes_bot")
        .update(updates)
        .eq("id", id);

      if (!error) {
        setSolicitudes((prev) =>
          prev.map((s) => (s.id === id ? { ...s, estado, ...updates } : s)),
        );
      }
      setUpdatingId(null);
    },
    [solicitudes],
  );

  const downloadAll = useCallback(async () => {
    setDownloadingAll(true);
    try {
      const JSZip = (await import("jszip")).default;

      // Group by client
      const grouped = new Map<string, SolicitudBot[]>();
      for (const s of displayed) {
        const name = clienteMap.get(s.cliente_id) ?? s.cliente_id;
        if (!grouped.has(name)) grouped.set(name, []);
        grouped.get(name)!.push(s);
      }

      // Create zip organized by client folders
      const zip = new JSZip();
      for (const [clientName, sols] of grouped) {
        const folder = zip.folder(slugify(clientName))!;
        for (const s of sols) {
          const filename = `${slugify(clientName)}-${slugify(s.nombre_curso)}.json`;
          folder.file(filename, JSON.stringify(s.config_json, null, 2));
        }
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const today = new Date().toISOString().slice(0, 10);
      a.download = `solicitudes-bots-${today}.zip`;
      a.click();
      URL.revokeObjectURL(url);
    } finally {
      setDownloadingAll(false);
    }
  }, [displayed, clienteMap]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-20 bg-white/80 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Image
              src="/logo.png"
              alt="BioNova"
              width={160}
              height={38}
              className="h-10 w-auto"
              priority
            />
            <span className="text-sm text-slate-400">|</span>
            <span className="text-sm font-medium text-slate-700">
              Panel Admin — Bots
            </span>
          </div>
          <Link
            href="/"
            className="text-xs text-slate-500 hover:text-slate-700 transition-colors flex items-center gap-1"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Dashboard
          </Link>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-6 space-y-4">
        {/* Stats bar */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-lg font-semibold text-slate-800 flex items-center gap-2">
              <Package className="w-5 h-5 text-amber-600" />
              Bots de esta semana
            </h1>
            <span className="text-sm text-slate-500">
              {displayed.length} solicitud{displayed.length !== 1 ? "es" : ""}
            </span>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowAll(!showAll)}
              className={`text-xs px-3 py-1.5 rounded-lg border transition-colors ${
                showAll
                  ? "bg-slate-100 border-slate-300 text-slate-700"
                  : "border-slate-200 text-slate-500 hover:border-slate-300"
              }`}
            >
              {showAll ? "Mostrando todas" : "Últimos 7 días"}
            </button>

            {displayed.length > 0 && (
              <button
                onClick={downloadAll}
                disabled={downloadingAll}
                className="flex items-center gap-2 px-4 py-2 bg-slate-800 hover:bg-slate-900 disabled:bg-slate-400 text-white text-sm font-medium rounded-lg transition-colors"
              >
                {downloadingAll ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <FolderArchive className="w-4 h-4" />
                )}
                Descargar todas
              </button>
            )}
          </div>
        </div>

        {/* Table or empty state */}
        {displayed.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-slate-300 mx-auto mb-4" />
            <p className="text-slate-500 text-sm">No hay solicitudes pendientes.</p>
            <p className="text-slate-400 text-xs mt-1">
              Las nuevas solicitudes de bots aparecerán aquí.
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-slate-100 bg-slate-50/50">
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Negocio
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Curso
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Precio
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Fecha
                    </th>
                    <th className="text-left px-4 py-3 font-medium text-slate-500">
                      Estado
                    </th>
                    <th className="text-center px-4 py-3 font-medium text-slate-500">
                      Infra
                    </th>
                    <th className="text-right px-4 py-3 font-medium text-slate-500">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {displayed.map((s) => {
                    const negocio = clienteMap.get(s.cliente_id) ?? "—";
                    const estado = ESTADO_LABEL[s.estado];
                    return (
                      <tr
                        key={s.id}
                        className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors"
                      >
                        <td className="px-4 py-3 font-medium text-slate-800">
                          {negocio}
                        </td>
                        <td className="px-4 py-3 text-slate-600 max-w-[200px] truncate">
                          {s.nombre_curso}
                        </td>
                        <td className="px-4 py-3 text-slate-700 font-mono text-xs">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="text-emerald-600 font-medium">
                              {s.moneda} {s.precio_oferta}
                            </span>
                            {s.precio_2da_oferta != null && (
                              <span className="text-amber-600">
                                → {s.moneda} {s.precio_2da_oferta}
                              </span>
                            )}
                            {s.precio_regular !== s.precio_oferta && (
                              <span className="text-slate-400 line-through">
                                {s.precio_regular}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-4 py-3 text-slate-500 text-xs whitespace-nowrap">
                          {new Date(s.created_at).toLocaleDateString("es-PE", {
                            day: "numeric",
                            month: "short",
                            year: "numeric",
                          })}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${estado.className}`}
                          >
                            {estado.label}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <span title={s.whatsapp_token ? "WhatsApp Token OK" : "WhatsApp Token falta"}>
                              <Bot className={`w-3.5 h-3.5 ${s.whatsapp_token ? "text-green-500" : "text-red-300"}`} />
                            </span>
                            <span title={s.groq_api_key ? "Groq API Key OK" : "Groq API Key falta"}>
                              <Cpu className={`w-3.5 h-3.5 ${s.groq_api_key ? "text-green-500" : "text-red-300"}`} />
                            </span>
                            <span title={s.imgbb_api_key ? "ImgBB API Key OK" : "ImgBB API Key falta"}>
                              <ImageIcon className={`w-3.5 h-3.5 ${s.imgbb_api_key ? "text-green-500" : "text-red-300"}`} />
                            </span>
                            <span title={s.n8n_url ? "n8n URL OK" : "n8n URL falta"}>
                              <Webhook className={`w-3.5 h-3.5 ${s.n8n_url ? "text-green-500" : "text-red-300"}`} />
                            </span>
                            <span title={s.n8n_api_key ? "n8n API Key OK" : "n8n API Key falta"}>
                              <Key className={`w-3.5 h-3.5 ${s.n8n_api_key ? "text-green-500" : "text-red-300"}`} />
                            </span>
                          </div>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-end gap-1.5">
                            {/* Download individual */}
                            <button
                              onClick={() =>
                                downloadJSON(
                                  s.config_json as Record<string, unknown>,
                                  `${slugify(negocio)}-${slugify(s.nombre_curso)}.json`,
                                )
                              }
                              className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
                              title="Descargar JSON"
                            >
                              <FileJson className="w-4 h-4" />
                            </button>

                            {/* Status actions */}
                            {s.estado === "pendiente" && (
                              <button
                                onClick={() => updateEstado(s.id, "procesando")}
                                disabled={updatingId === s.id}
                                className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                {updatingId === s.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <Clock className="w-3 h-3" />
                                )}
                                Procesar
                              </button>
                            )}
                            {(s.estado === "pendiente" ||
                              s.estado === "procesando") && (
                              <button
                                onClick={() => updateEstado(s.id, "entregado")}
                                disabled={updatingId === s.id}
                                className="px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 text-xs font-medium transition-colors flex items-center gap-1"
                              >
                                {updatingId === s.id ? (
                                  <Loader2 className="w-3 h-3 animate-spin" />
                                ) : (
                                  <CheckCircle2 className="w-3 h-3" />
                                )}
                                Entregado
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
