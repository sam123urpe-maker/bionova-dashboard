"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { Check } from "lucide-react";
import Lottie from "lottie-react";
import rocketAnimationData from "@/../public/animations/robot-building.json";
import chatbotAnimationData from "@/../public/animations/live-chatbot.json";

const FRASES = [
  { text: "Me estoy armando...", delay: 0 },
  { text: "Preparando tu vendedor 24/7...", delay: 1500 },
  { text: "Aprendiendo sobre tu curso...", delay: 3000 },
  { text: "Configurando tus medios de pago...", delay: 4500 },
  { text: "Casi listo...", delay: 6000 },
];

const DURACION = 8000; // 8 segundos

interface BotBuildingProps {
  nombreCurso: string;
  onDone: () => void;
}

export function BotBuilding({ nombreCurso, onDone }: BotBuildingProps) {
  const [progresso, setProgresso] = useState(0);
  const [visible, setVisible] = useState(true);
  const [fraseActual, setFraseActual] = useState(0);
  const [mostrarCompletado, setMostrarCompletado] = useState(false);
  const startRef = useRef(Date.now());
  const frameRef = useRef<number>(0);

  useEffect(() => {
    const animate = () => {
      const elapsed = Date.now() - startRef.current;
      const pct = Math.min(100, (elapsed / DURACION) * 100);
      setProgresso(pct);

      if (pct >= 100) {
        setMostrarCompletado(true);
        return;
      }

      frameRef.current = requestAnimationFrame(animate);
    };

    frameRef.current = requestAnimationFrame(animate);

    return () => {
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
    };
  }, []);

  // Stagger phrases based on elapsed time
  useEffect(() => {
    const delays = FRASES.map((f) => f.delay);

    const timeouts = delays.map((delay, i) => {
      return setTimeout(() => {
        setFraseActual(i);
      }, delay);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, []);

  // On completion: show checkmark, fade out, call onDone
  useEffect(() => {
    if (mostrarCompletado) {
      const t = setTimeout(() => {
        setVisible(false);
        setTimeout(onDone, 300);
      }, 1200);
      return () => clearTimeout(t);
    }
  }, [mostrarCompletado, onDone]);

  const sectionClass = `transition-opacity duration-500 ${visible ? "opacity-100" : "opacity-0"}`;
  const completado = progresso >= 100;

  return (
    <div className={`min-h-screen bg-slate-50 flex items-center justify-center px-4 ${sectionClass}`}>
      <div className="w-full max-w-sm text-center">
        {/* Lottie Animation */}
        <div className="mb-4 flex justify-center">
          <div className="relative w-48 h-48">
            {!completado ? (
              <Lottie
                animationData={rocketAnimationData}
                loop={true}
                className="w-48 h-48"
              />
            ) : (
              <div className="w-48 h-48 flex items-center justify-center">
                <div className="w-24 h-24 rounded-full bg-emerald-100 flex items-center justify-center animate-[pop_0.4s_ease-out]">
                  <Check className="w-12 h-12 text-emerald-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Course name */}
        <h2 className="text-lg font-semibold text-slate-800 mb-6">
          {completado ? "Tu agente está listo" : `Creando "${nombreCurso}"`}
        </h2>

        {/* Progress bar */}
        <div className="w-full h-2 bg-slate-200 rounded-full mb-4 overflow-hidden">
          <div
            className="h-full rounded-full transition-colors duration-500"
            style={{
              width: `${progresso}%`,
              backgroundColor: completado ? "#10b981" : "#f59e0b",
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
                i === fraseActual && !completado
                  ? "opacity-100 translate-y-0"
                  : "opacity-0 translate-y-2"
              }`}
            >
              {frase.text}
            </p>
          ))}
          {completado && (
            <p className="absolute text-sm font-medium text-emerald-600 transition-all duration-500 opacity-100 translate-y-0">
              Te avisaremos cuando esté listo. Nosotros nos encargamos de todo.
            </p>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes pop {
          0% { transform: scale(0); }
          60% { transform: scale(1.2); }
          100% { transform: scale(1); }
        }
      `}</style>
    </div>
  );
}

const BANNER_FRASES = [
  "Me estoy armando...",
  "Aprendiendo sobre tu curso...",
  "Configurando tus medios de pago...",
  "Preparando respuestas automáticas...",
  "Casi listo para vender 24/7...",
];

/**
 * Banner persistente en el dashboard para clientes cuyo bot está en construcción.
 * Muestra la animación del chatbot con frases que se turnan cada 5 segundos.
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
  const [fraseIdx, setFraseIdx] = useState(0);
  const [visible, setVisible] = useState(true);

  // Cycle phrases every 5 seconds with fade out/in
  useEffect(() => {
    const interval = setInterval(() => {
      setVisible(false);
      setTimeout(() => {
        setFraseIdx((prev) => (prev + 1) % BANNER_FRASES.length);
        setVisible(true);
      }, 500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const fechaStr = new Date(fecha).toLocaleDateString("es-PE", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  return (
    <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-200 rounded-2xl p-6">
      <div className="flex items-start gap-5">
        {/* Chatbot Lottie Animation */}
        <div className="shrink-0 w-24 h-24 -mt-2 -ml-2">
          <Lottie
            animationData={chatbotAnimationData}
            loop={true}
            className="w-24 h-24"
          />
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="text-base font-semibold text-amber-800">
            Tu bot se está construyendo
          </h3>
          <p className="text-sm text-amber-700 mt-1">
            <strong>{nombreCurso}</strong> — solicitado el {fechaStr}
          </p>

          {/* Cycling phrase */}
          <div className="relative h-6 mt-2 overflow-hidden">
            <p
              className={`absolute inset-0 text-sm text-amber-600 transition-all duration-500 ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 -translate-y-2"
              }`}
            >
              {BANNER_FRASES[fraseIdx]}
            </p>
          </div>

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
