"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { supabase } from "@/lib/supabase/client";
import { Mail, Loader2 } from "lucide-react";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const { error: err } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${location.origin}/auth/callback`,
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
            {sent ? "Revisa tu correo" : "Iniciar sesion"}
          </h1>
          <p className="text-sm text-slate-500 mt-2">
            {sent
              ? `Enviamos un enlace magico a ${email}. Haz clic en el para ingresar.`
              : "Ingresa tu correo para recibir un enlace magico."}
          </p>
        </div>

        {sent ? (
          <button
            onClick={() => { setSent(false); setEmail(""); }}
            className="w-full text-sm text-slate-500 hover:text-slate-700 transition-colors"
          >
            Usar otro correo
          </button>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
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
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="admin@bionova.com"
                  className="w-full pl-10 pr-4 py-2.5 text-sm border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-amber-500/20 focus:border-amber-500 transition-colors"
                />
              </div>
            </div>

            {error && (
              <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>
            )}

            <button
              type="submit"
              disabled={loading || !email}
              className="w-full py-2.5 bg-amber-600 hover:bg-amber-700 disabled:bg-slate-300 text-white text-sm font-medium rounded-lg transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : null}
              Enviar enlace magico
            </button>

            <p className="text-center text-sm text-slate-400">
              No tienes cuenta?{" "}
              <Link href="/registro" className="text-amber-600 hover:text-amber-700 font-medium">
                Registrate
              </Link>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
