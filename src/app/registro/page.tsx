"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Mail, User, Phone, Loader2 } from "lucide-react";

export default function RegistroPage() {
  const [form, setForm] = useState({ email: "", nombre: "", whatsapp: "" });
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function setField(field: string, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email: form.email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
        data: {
          nombre: form.nombre,
          whatsapp_numero: form.whatsapp || null,
        },
      },
    });

    setLoading(false);

    if (err) {
      setError(err.message);
    } else {
      setSent(true);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-8">
          <Image
            src="/logo.png"
            alt="BioNova"
            width={200}
            height={48}
            className="h-12 w-auto mx-auto mb-6"
            priority
          />
          <h1 className="text-xl font-semibold text-slate-800">
            {sent ? "Revisa tu correo" : "Registro"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {sent
              ? `Enviamos un enlace magico a ${form.email}. Haz clic para activar tu cuenta.`
              : "Crea tu cuenta para obtener tu API Key."}
          </p>
        </div>

        {sent ? (
          <button
            onClick={() => { setSent(false); setForm({ email: "", nombre: "", whatsapp: "" }); }}
            className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Usar otro correo
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="nombre" className="block text-sm font-medium text-slate-700 mb-1.5">
                Nombre
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="nombre"
                  type="text"
                  required
                  value={form.nombre}
                  onChange={(e) => setField("nombre", e.target.value)}
                  placeholder="Tu negocio"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
                Correo electronico
              </label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setField("email", e.target.value)}
                  placeholder="negocio@correo.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            <div>
              <label htmlFor="whatsapp" className="block text-sm font-medium text-slate-700 mb-1.5">
                WhatsApp <span className="text-slate-400 font-normal">(opcional)</span>
              </label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  id="whatsapp"
                  type="tel"
                  value={form.whatsapp}
                  onChange={(e) => setField("whatsapp", e.target.value)}
                  placeholder="+51 999 999 999"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !form.email || !form.nombre}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Crear cuenta
            </button>

            <p className="text-center text-sm text-slate-400">
              Ya tienes cuenta?{" "}
              <Link href="/login" className="text-amber-600 hover:text-amber-700 font-medium">
                Inicia sesion
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
