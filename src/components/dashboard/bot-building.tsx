"use client";

import { useState, useEffect, useRef } from "react";
import { Check } from "lucide-react";

const FRASES = [
  "Me estoy armando...",
  "Preparando tu vendedor 24/7...",
  "Aprendiendo sobre tu curso...",
  "Configurando tus medios de pago...",
  "Casi listo...",
];

interface BotBuildingProps {
  nombreCurso: string;
  onDone: () => void;
}

export function BotBuilding({ nombreCurso, onDone }: BotBuildingProps) {
  const [fase, setFase] = useState(0);
  const [progresso, setProgresso] = useState(0);
  const [visible, setVisible] = useState(true);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    // Progress bar animation
    const duracion = 3500;
    const pasos = 50;
    const intervalo = duracion / pasos;

    let paso = 0;
    timerRef.current = setInterval(() => {
      paso++;
      setProgresso(Math.min(100, (paso / pasos) * 100));

      // Change phrase at certain progress points
      if (paso >= pasos * 0.8) setFase(4);
      else if (paso >= pasos * 0.6) setFase(3);
      else if (paso >= pasos * 0.4) setFase(2);
      else if (paso >= pasos * 0.2) setFase(1);
      else setFase(0);
    }, intervalo);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (progresso >= 100) {
      // Show completion briefly, then call onDone
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 800);
      return () => clearTimeout(t);
    }
  }, [progresso, onDone]);

  const sectionClass = `transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`;

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center px-4 ${sectionClass}`}>
      <div className="w-full max-w-sm text-center">
        {/* Robot Illustration */}
        <div className="mb-8 flex justify-center">
          <div className="relative w-32 h-32">
            {/* Body */}
            <div
              className="absolute inset-x-0 mx-auto rounded-2xl bg-amber-500 transition-all duration-700"
              style={{
                width: progresso >= 20 ? 64 : 0,
                height: progresso >= 20 ? 56 : 0,
                top: 48,
                opacity: progresso >= 20 ? 1 : 0,
              }}
            />
            {/* Head */}
            <div
              className="absolute left-1/2 -translate-x-1/2 transition-all duration-700"
              style={{
                width: progresso >= 10 ? 56 : 0,
                height: progresso >= 10 ? 48 : 0,
                top: progresso >= 10 ? 8 : 40,
                opacity: progresso >= 10 ? 1 : 0,
              }}
            >
              <div className="w-full h-full rounded-2xl bg-amber-500 relative">
                {/* Eyes */}
                <div
                  className="absolute flex gap-2 top-3 left-1/2 -translate-x-1/2 transition-opacity duration-500"
                  style={{ opacity: progresso >= 15 ? 1 : 0 }}
                >
                  <div className="w-3 h-3 rounded-full bg-white" />
                  <div className="w-3 h-3 rounded-full bg-white" />
                </div>
                {/* Mouth / smile */}
                <div
                  className="absolute bottom-2 left-1/2 -translate-x-1/2 w-5 h-2 border-b-2 border-white rounded-b-full transition-opacity duration-500"
                  style={{ opacity: progresso >= 30 ? 1 : 0 }}
                />
              </div>
              {/* Antenna */}
              <div
                className="absolute -top-3 left-1/2 -translate-x-1/2 transition-all duration-500"
                style={{ opacity: progresso >= 25 ? 1 : 0 }}
              >
                <div className="w-1 h-3 bg-amber-600 rounded-full mx-auto" />
                <div
                  className="w-2 h-2 rounded-full bg-amber-400 mx-auto mt-0.5 animate-pulse"
                  style={{ animationDuration: "0.6s" }}
                />
              </div>
            </div>
            {/* Left arm */}
            <div
              className="absolute transition-all duration-700"
              style={{
                left: progresso >= 40 ? 2 : 20,
                top: 52,
                opacity: progresso >= 40 ? 1 : 0,
              }}
            >
              <div className="w-5 h-16 rounded-full bg-amber-400 origin-top animate-[wave_1s_ease-in-out_infinite]" />
            </div>
            {/* Right arm */}
            <div
              className="absolute transition-all duration-700"
              style={{
                right: progresso >= 50 ? 2 : 20,
                top: 52,
                opacity: progresso >= 50 ? 1 : 0,
              }}
            >
              <div
                className="w-5 h-16 rounded-full bg-amber-400 origin-top animate-[wave_1s_ease-in-out_infinite_0.5s]"
              />
            </div>
            {/* Legs */}
            <div
              className="absolute inset-x-0 mx-auto flex gap-4 justify-center transition-all duration-700"
              style={{
                top: 104,
                opacity: progresso >= 60 ? 1 : 0,
              }}
            >
              <div className="w-5 h-12 rounded-full bg-amber-600" />
              <div className="w-5 h-12 rounded-full bg-amber-600" />
            </div>
            {/* Checkmark on complete */}
            {progresso >= 100 && (
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-20 h-20 rounded-full bg-emerald-100 flex items-center justify-center animate-[pop_0.4s_ease-out]">
                  <Check className="w-10 h-10 text-emerald-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course name */}
        <h2 className="text-lg font-semibold text-slate-800 mb-6">
          {progresso >= 100 ? "Tu agente está listo" : `Creando "${nombreCurso}"`}
        </h2>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-300 ease-out"
            style={{
              width: `${progresso}%`,
              backgroundColor: progresso >= 100 ? "#10b981" : "#f59e0b",
            }}
          />
        </div>

        {/* Progress percentage */}
        <p className="text-xs text-slate-400 mb-6">{Math.round(progresso)}%</p>

        {/* Phrase */}
        <div className="relative h-12 flex items-center justify-center mb-4">
          {FRASES.map((frase, i) => (
            <p
              key={i}
              className={`absolute text-sm text-slate-600 transition-all duration-500 ${
                i === fase ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
              }`}
            >
              {frase}
            </p>
          ))}
          {progresso >= 100 && (
            <p className="absolute text-sm font-medium text-emerald-600 transition-all duration-500 opacity-100 translate-y-0">
              Te avisaremos cuando esté listo. Nosotros nos encargamos de todo.
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes wave {
          0%, 100% { transform: rotate(0deg); }
          25% { transform: rotate(-15deg); }
          75% { transform: rotate(10deg); }
        }
        @keyframes pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

/**
 * Versión simplificada para el banner persistente en el dashboard.
 * Solo muestra el robot estático con texto informativo.
 */
export function BotBuildingBanner({
  nombreCurso,
  estado,
  fecha,
}: {
  nombreCurso: string;
  estado: string;
  fecha: string;
}) {
  const fechaStr = new Date(fecha).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-start gap-5">
        {/* Mini robot icon */}
        <div className="shrink-0 w-16 h-16 relative">
          <div className="absolute left-1/2 -translate-x-1/2 top-0 w-8 h-7 rounded-xl bg-amber-400">
            <div className="flex gap-1.5 absolute top-1.5 left-1/2 -translate-x-1/2">
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
              <div className="w-1.5 h-1.5 rounded-full bg-white" />
            </div>
          </div>
          <div className="absolute left-1/2 -translate-x-1/2 top-8 w-10 h-8 rounded-xl bg-amber-500" />
          <div className="absolute left-1 top-9 w-2.5 h-8 rounded-full bg-amber-400" />
          <div className="absolute right-1 top-9 w-2.5 h-8 rounded-full bg-amber-400" />
          <div className="absolute left-3 top-16 w-3 h-6 rounded-full bg-amber-600" />
          <div className="absolute right-3 top-16 w-3 h-6 rounded-full bg-amber-600" />
          {/* Antenna spark */}
          <div className="absolute left-1/2 -translate-x-1/2 -top-1.5 w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-amber-800">
            Tu bot se está construyendo
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            <strong>{nombreCurso}</strong> — solicitado el {fechaStr}
          </p>
          <p className="text-sm text-amber-600 mt-2">
            Te avisaremos por WhatsApp/email cuando esté listo. Tranquilo, nosotros nos
            encargamos de todo.
          </p>
          <div className="mt-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-100 text-xs font-medium text-amber-700">
              <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
              {estado === "pendiente" ? "En revisión" : "En construcción"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
