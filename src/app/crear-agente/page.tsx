"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase/client";
import {
  Sparkles,
  Plus,
  Trash2,
  Loader2,
  ArrowLeft,
  DollarSign,
  Link2,
  Gift,
  MessageCircle,
  BookOpen,
  FileText,
  Key,
  Copy,
  Check,
  Server,
  Bot,
  ImageIcon,
  Cpu,
  Webhook,
} from "lucide-react";
import type { MedioPago } from "@/types/client";
import { BotBuilding } from "@/components/dashboard/bot-building";

const MONEDAS = ["PEN", "USD", "COP", "CLP", "MXN", "ARS"];
const TIPOS_PAGO = [
  { value: "yape", label: "Yape" },
  { value: "plin", label: "Plin" },
  { value: "transferencia_bancaria", label: "Transferencia bancaria" },
  { value: "otro", label: "Otro" },
];

const PLACEHOLDERS_PAGO: Record<string, { dato: string; titular: string }> = {
  yape: { dato: "Número de Yape", titular: "Nombre del titular" },
  plin: { dato: "Número de Plin", titular: "Nombre del titular" },
  transferencia_bancaria: {
    dato: "Número de cuenta / CCI",
    titular: "Nombre del titular",
  },
  otro: { dato: "Dato del medio de pago", titular: "Nombre del titular" },
};

interface FormData {
  nombre_curso: string;
  descripcion_curso: string;
  precio_oferta: string;
  precio_regular: string;
  precio_2da_oferta: string;
  moneda: string;
  medios_pago: MedioPago[];
  link_entrega: string;
  bonos_extras: string[];
  mensaje_bienvenida: string;
  whatsapp_token: string;
  whatsapp_phone_number_id: string;
  groq_api_key: string;
  imgbb_api_key: string;
  n8n_url: string;
  n8n_api_key: string;
}

const FORM_INITIAL: FormData = {
  nombre_curso: "",
  descripcion_curso: "",
  precio_oferta: "",
  precio_regular: "",
  precio_2da_oferta: "",
  moneda: "PEN",
  medios_pago: [{ tipo: "yape", dato: "", titular: "" }],
  link_entrega: "",
  bonos_extras: [""],
  mensaje_bienvenida: "",
  whatsapp_token: "",
  whatsapp_phone_number_id: "",
  groq_api_key: "",
  imgbb_api_key: "",
  n8n_url: "",
  n8n_api_key: "",
};

const MONEDA_SIMBOLOS: Record<string, string> = {
  PEN: "S/.",
  USD: "$",
  COP: "COP",
  CLP: "CLP",
  MXN: "MX$",
  ARS: "ARS",
};

export default function CrearAgentePage() {
  const router = useRouter();
  const [form, setForm] = useState<FormData>(FORM_INITIAL);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [showAnimation, setShowAnimation] = useState(false);
  const [bionovaApiKey, setBionovaApiKey] = useState("");
  const [apiKeyCopied, setApiKeyCopied] = useState(false);

  // Cargar api_key del cliente al montar
  useEffect(() => {
    async function loadApiKey() {
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email) {
        const { data: cliente } = await supabase
          .from("clientes")
          .select("api_key")
          .eq("email", user.email)
          .maybeSingle();
        if (cliente?.api_key) {
          setBionovaApiKey(cliente.api_key);
          setForm((prev) => ({ ...prev, whatsapp_token: cliente.api_key }));
        }
      }
    }
    loadApiKey();
  }, []);

  function copyApiKey() {
    navigator.clipboard.writeText(bionovaApiKey);
    setApiKeyCopied(true);
    setTimeout(() => setApiKeyCopied(false), 2000);
  }

  function setField(field: keyof FormData, value: string | MedioPago[] | string[]) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  function updateMedioPago(index: number, field: keyof MedioPago, value: string) {
    setForm((prev) => {
      const updated = [...prev.medios_pago];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, medios_pago: updated };
    });
  }

  function addMedioPago() {
    setForm((prev) => ({
      ...prev,
      medios_pago: [...prev.medios_pago, { tipo: "yape", dato: "", titular: "" }],
    }));
  }

  function removeMedioPago(index: number) {
    setForm((prev) => ({
      ...prev,
      medios_pago: prev.medios_pago.filter((_, i) => i !== index),
    }));
  }

  function updateBono(index: number, value: string) {
    setForm((prev) => {
      const updated = [...prev.bonos_extras];
      updated[index] = value;
      return { ...prev, bonos_extras: updated };
    });
  }

  function addBono() {
    setForm((prev) => ({ ...prev, bonos_extras: [...prev.bonos_extras, ""] }));
  }

  function removeBono(index: number) {
    setForm((prev) => ({
      ...prev,
      bonos_extras: prev.bonos_extras.filter((_, i) => i !== index),
    }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    // Validar medios de pago
    const mediosValidos = form.medios_pago.filter((m) => m.dato.trim() && m.titular.trim());
    if (mediosValidos.length === 0) {
      setError("Agrega al menos un medio de pago con dato y titular.");
      return;
    }

    // Validar infraestructura requerida
    if (!form.whatsapp_phone_number_id.trim()) {
      setError("El WhatsApp Phone Number ID es requerido.");
      return;
    }
    if (!form.groq_api_key.trim()) {
      setError("La Groq API Key es requerida.");
      return;
    }
    if (!form.imgbb_api_key.trim()) {
      setError("La ImgBB API Key es requerida.");
      return;
    }
    if (!form.n8n_url.trim()) {
      setError("La URL de n8n es requerida.");
      return;
    }
    if (!form.n8n_api_key.trim()) {
      setError("La n8n API Key es requerida.");
      return;
    }

    setLoading(true);

    // Obtener cliente_id desde el usuario autenticado
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) {
      setError("Debes iniciar sesión.");
      setLoading(false);
      return;
    }

    // Obtener datos del cliente
    const { data: cliente } = await supabase
      .from("clientes")
      .select("id, nombre, api_key")
      .eq("email", user.email)
      .maybeSingle();

    if (!cliente) {
      setError("No se encontró tu cuenta. Contacta a soporte.");
      setLoading(false);
      return;
    }

    const precioOferta = parseFloat(form.precio_oferta);
    const precioRegular = parseFloat(form.precio_regular);
    const precio2daOferta = form.precio_2da_oferta.trim()
      ? parseFloat(form.precio_2da_oferta)
      : null;

    if (isNaN(precioOferta) || precioOferta <= 0) {
      setError("El precio de oferta debe ser un número válido.");
      setLoading(false);
      return;
    }
    if (isNaN(precioRegular) || precioRegular <= 0) {
      setError("El precio regular debe ser un número válido.");
      setLoading(false);
      return;
    }
    if (precio2daOferta !== null && (isNaN(precio2daOferta) || precio2daOferta <= 0)) {
      setError("El precio 2da oferta debe ser un número válido.");
      setLoading(false);
      return;
    }

    const bonosFiltrados = form.bonos_extras.filter((b) => b.trim());

    const configJson = {
      cliente_id: cliente.id,
      nombre_negocio: cliente.nombre,
      api_key: cliente.api_key,
      nombre_agente: `AGENTE ${cliente.nombre}`,
      curso: {
        nombre: form.nombre_curso.trim(),
        descripcion: form.descripcion_curso.trim(),
        precio_oferta: precioOferta,
        precio_regular: precioRegular,
        precio_2da_oferta: precio2daOferta,
        moneda: form.moneda,
      },
      medios_pago: mediosValidos,
      link_entrega: form.link_entrega.trim() || null,
      bonos_extras: bonosFiltrados.length > 0 ? bonosFiltrados : null,
      mensaje_bienvenida: form.mensaje_bienvenida.trim() || null,
      infraestructura: {
        whatsapp_token: form.whatsapp_token.trim() || null,
        whatsapp_phone_number_id: form.whatsapp_phone_number_id.trim(),
        groq_api_key: form.groq_api_key.trim(),
        imgbb_api_key: form.imgbb_api_key.trim(),
        n8n_url: form.n8n_url.trim(),
        n8n_api_key: form.n8n_api_key.trim(),
      },
      fecha_solicitud: new Date().toISOString(),
    };

    const { error: insertErr } = await supabase.from("solicitudes_bot").insert({
      cliente_id: cliente.id,
      nombre_curso: form.nombre_curso.trim(),
      descripcion_curso: form.descripcion_curso.trim() || null,
      precio_oferta: precioOferta,
      precio_regular: precioRegular,
      precio_2da_oferta: precio2daOferta,
      moneda: form.moneda,
      medios_pago: mediosValidos,
      link_entrega: form.link_entrega.trim() || null,
      bonos_extras: bonosFiltrados.length > 0 ? bonosFiltrados : null,
      mensaje_bienvenida: form.mensaje_bienvenida.trim() || null,
      whatsapp_token: form.whatsapp_token.trim() || null,
      whatsapp_phone_number_id: form.whatsapp_phone_number_id.trim(),
      groq_api_key: form.groq_api_key.trim(),
      imgbb_api_key: form.imgbb_api_key.trim(),
      n8n_url: form.n8n_url.trim(),
      n8n_api_key: form.n8n_api_key.trim(),
      config_json: configJson,
    });

    setLoading(false);

    if (insertErr) {
      setError(insertErr.message);
    } else {
      setShowAnimation(true);
    }
  }

  if (showAnimation) {
    return (
      <BotBuilding
        nombreCurso={form.nombre_curso.trim()}
        onDone={() => router.push("/")}
      />
    );
  }

  const canSubmit =
    form.nombre_curso.trim() &&
    form.descripcion_curso.trim() &&
    form.precio_oferta &&
    form.precio_regular &&
    form.link_entrega.trim() &&
    form.whatsapp_phone_number_id.trim() &&
    form.groq_api_key.trim() &&
    form.imgbb_api_key.trim() &&
    form.n8n_url.trim() &&
    form.n8n_api_key.trim() &&
    form.medios_pago.some((m) => m.dato.trim() && m.titular.trim());

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-lg">
        {/* Header */}
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="BioNova"
            width={200}
            height={48}
            className="h-12 w-auto mx-auto mb-4"
            priority
          />
          <h1 className="text-xl font-semibold text-slate-800 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 text-amber-500" />
            Crear Agente
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            Configura tu vendedor virtual 24/7. Nosotros lo armamos por ti.
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* ────────── SECCIÓN: API Key BioNova ────────── */}
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <label className="block text-sm font-medium text-amber-800 mb-1.5">
              <Key className="w-4 h-4 inline mr-1.5" />
              Tu API Key de BioNova
            </label>
            <p className="text-xs text-amber-600 mb-2">
              Esta es tu llave de acceso única. La necesitarás para conectar tu bot.
            </p>
            {bionovaApiKey ? (
              <div className="flex items-center gap-2">
                <code className="flex-1 bg-white border border-amber-200 rounded-lg px-3 py-2 text-xs text-slate-700 font-mono break-all select-all">
                  {bionovaApiKey}
                </code>
                <button
                  type="button"
                  onClick={copyApiKey}
                  className="shrink-0 p-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white transition-colors"
                  title="Copiar API Key"
                >
                  {apiKeyCopied ? (
                    <Check className="w-4 h-4" />
                  ) : (
                    <Copy className="w-4 h-4" />
                  )}
                </button>
              </div>
            ) : (
              <p className="text-sm text-amber-500">Cargando...</p>
            )}
          </div>

          {/* ────────── SECCIÓN: Curso ────────── */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <BookOpen className="w-4 h-4 text-amber-500" />
              Tu curso
            </h2>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre del curso <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.nombre_curso}
                onChange={(e) => setField("nombre_curso", e.target.value)}
                placeholder='ej. "Megakit de Rituales +200"'
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Descripción breve <span className="text-red-400">*</span>
              </label>
              <textarea
                required
                rows={2}
                value={form.descripcion_curso}
                onChange={(e) => setField("descripcion_curso", e.target.value)}
                placeholder="Describe qué incluye tu curso..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
              />
            </div>

            {/* Precios */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Moneda
                  </label>
                  <select
                    value={form.moneda}
                    onChange={(e) => setField("moneda", e.target.value)}
                    className="w-full px-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white transition-colors"
                  >
                    {MONEDAS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Precio oferta <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.precio_oferta}
                      onChange={(e) => setField("precio_oferta", e.target.value)}
                      placeholder="10"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {MONEDA_SIMBOLOS[form.moneda]} 1ra oferta
                  </p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Precio real <span className="text-red-400">*</span>
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      required
                      min="0"
                      step="0.01"
                      value={form.precio_regular}
                      onChange={(e) => setField("precio_regular", e.target.value)}
                      placeholder="50"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {MONEDA_SIMBOLOS[form.moneda]} Valor real
                  </p>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1.5">
                    Precio 2da oferta
                  </label>
                  <div className="relative">
                    <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={form.precio_2da_oferta}
                      onChange={(e) => setField("precio_2da_oferta", e.target.value)}
                      placeholder="8"
                      className="w-full pl-10 pr-3 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                  </div>
                  <p className="text-xs text-slate-400 mt-1">
                    {MONEDA_SIMBOLOS[form.moneda]} Precio cierre
                  </p>
                </div>
              </div>
            </div>

            {/* Medios de pago */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                Medios de pago <span className="text-red-400">*</span>
              </label>
              <div className="space-y-2">
                {form.medios_pago.map((medio, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-12 gap-2 p-2 bg-white border border-slate-200 rounded-lg"
                  >
                    <select
                      value={medio.tipo}
                      onChange={(e) => updateMedioPago(i, "tipo", e.target.value)}
                      className="col-span-3 px-2 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 bg-white transition-colors"
                    >
                      {TIPOS_PAGO.map((t) => (
                        <option key={t.value} value={t.value}>
                          {t.label}
                        </option>
                      ))}
                    </select>
                    <input
                      type="text"
                      value={medio.dato}
                      onChange={(e) => updateMedioPago(i, "dato", e.target.value)}
                      placeholder={PLACEHOLDERS_PAGO[medio.tipo]?.dato ?? "Dato"}
                      className="col-span-4 px-2 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                    <input
                      type="text"
                      value={medio.titular}
                      onChange={(e) => updateMedioPago(i, "titular", e.target.value)}
                      placeholder={PLACEHOLDERS_PAGO[medio.tipo]?.titular ?? "Titular"}
                      className="col-span-4 px-2 py-2 text-xs border border-slate-200 rounded focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                    {form.medios_pago.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeMedioPago(i)}
                        className="col-span-1 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addMedioPago}
                className="mt-2 w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Agregar medio de pago
              </button>
            </div>

            {/* Link de entrega */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Link2 className="w-4 h-4 inline mr-1.5 text-amber-500" />
                Link de entrega <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                value={form.link_entrega}
                onChange={(e) => setField("link_entrega", e.target.value)}
                placeholder="https://drive.google.com/drive/folders/..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
            </div>

            {/* Bonos */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Gift className="w-4 h-4 inline mr-1.5 text-amber-500" />
                Bonos extra{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="space-y-2">
                {form.bonos_extras.map((bono, i) => (
                  <div key={i} className="flex gap-2">
                    <input
                      type="text"
                      value={bono}
                      onChange={(e) => updateBono(i, e.target.value)}
                      placeholder='ej. "+20 Rituales de Amor"'
                      className="flex-1 px-4 py-2 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                    />
                    {form.bonos_extras.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeBono(i)}
                        className="px-2 text-slate-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addBono}
                className="mt-2 w-full py-2 border border-dashed border-slate-300 rounded-lg text-sm text-slate-500 hover:border-amber-400 hover:text-amber-600 transition-colors flex items-center justify-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                Agregar bono
              </button>
            </div>

            {/* Mensaje de bienvenida */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <MessageCircle className="w-4 h-4 inline mr-1.5 text-amber-500" />
                Mensaje de bienvenida{" "}
                <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <textarea
                rows={2}
                value={form.mensaje_bienvenida}
                onChange={(e) => setField("mensaje_bienvenida", e.target.value)}
                placeholder="Deja vacío para usar el mensaje por defecto..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors resize-none"
              />
            </div>
          </div>

          {/* ────────── SECCIÓN: Infraestructura ────────── */}
          <div className="border border-slate-200 rounded-xl p-4 space-y-4">
            <h2 className="text-sm font-semibold text-slate-700 flex items-center gap-1.5">
              <Server className="w-4 h-4 text-amber-500" />
              Infraestructura (necesaria para tu bot)
            </h2>
            <p className="text-xs text-slate-500 -mt-2">
              Crea cuentas gratuitas en cada servicio y pega aquí las credenciales.
            </p>

            {/* WhatsApp Token */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Bot className="w-4 h-4 inline mr-1.5 text-green-500" />
                WhatsApp Business Token
              </label>
              <input
                type="text"
                value={form.whatsapp_token}
                onChange={(e) => setField("whatsapp_token", e.target.value)}
                placeholder="EAALrZ..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Meta Business → WhatsApp → Configuración → Token de acceso
              </p>
            </div>

            {/* WhatsApp Phone Number ID */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Bot className="w-4 h-4 inline mr-1.5 text-green-500" />
                WhatsApp Phone Number ID <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.whatsapp_phone_number_id}
                onChange={(e) => setField("whatsapp_phone_number_id", e.target.value)}
                placeholder="927564307104266"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Meta Business → WhatsApp → Configuración → Phone Number ID
              </p>
            </div>

            {/* Groq API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Cpu className="w-4 h-4 inline mr-1.5 text-blue-500" />
                Groq API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.groq_api_key}
                onChange={(e) => setField("groq_api_key", e.target.value)}
                placeholder="gsk_..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Crea cuenta gratuita en{" "}
                <a href="https://console.groq.com/keys" target="_blank" rel="noreferrer" className="text-amber-600 underline">console.groq.com/keys</a>
              </p>
            </div>

            {/* ImgBB API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <ImageIcon className="w-4 h-4 inline mr-1.5 text-purple-500" />
                ImgBB API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.imgbb_api_key}
                onChange={(e) => setField("imgbb_api_key", e.target.value)}
                placeholder="..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Crea cuenta gratuita en{" "}
                <a href="https://api.imgbb.com" target="_blank" rel="noreferrer" className="text-amber-600 underline">api.imgbb.com</a>
              </p>
            </div>

            {/* n8n URL */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Webhook className="w-4 h-4 inline mr-1.5 text-red-500" />
                URL de tu n8n <span className="text-red-400">*</span>
              </label>
              <input
                type="url"
                required
                value={form.n8n_url}
                onChange={(e) => setField("n8n_url", e.target.value)}
                placeholder="https://tu-pikapod.pikapod.net"
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                Crea tu PikaPod en{" "}
                <a href="https://pikapods.com" target="_blank" rel="noreferrer" className="text-amber-600 underline">pikapods.com</a> y pega la URL
              </p>
            </div>

            {/* n8n API Key */}
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1.5">
                <Key className="w-4 h-4 inline mr-1.5 text-red-500" />
                n8n API Key <span className="text-red-400">*</span>
              </label>
              <input
                type="text"
                required
                value={form.n8n_api_key}
                onChange={(e) => setField("n8n_api_key", e.target.value)}
                placeholder="n8n_api_..."
                className="w-full px-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
              />
              <p className="text-xs text-slate-400 mt-1">
                n8n → Settings → API Keys → Create New → Full access
              </p>
            </div>
          </div>

          {/* Error */}
          {error && (
            <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={loading || !canSubmit}
            className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4" />
            )}
            Solicitar agente
          </button>

          <Link
            href="/"
            className="w-full py-2 text-sm text-slate-400 hover:text-slate-600 transition-colors flex items-center justify-center gap-1.5"
          >
            <ArrowLeft className="w-4 h-4" />
            Volver al dashboard
          </Link>
        </form>
      </div>
    </div>
  );
}
