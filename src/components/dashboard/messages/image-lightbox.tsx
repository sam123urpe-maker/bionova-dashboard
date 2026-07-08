"use client";

import { useState, useEffect, useCallback } from "react";
import { X, ImageOff } from "lucide-react";

interface ImageLightboxProps {
  url: string;
  onClose: () => void;
}

export function ImageLightbox({ url, onClose }: ImageLightboxProps) {
  const [loaded, setLoaded] = useState(false);
  const [errored, setErrored] = useState(false);

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    },
    [onClose],
  );

  useEffect(() => {
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [handleKeyDown]);

  return (
    <div
      className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <button
        onClick={onClose}
        className="absolute top-4 right-4 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors z-10"
      >
        <X className="w-5 h-5 text-white" />
      </button>

      {!loaded && !errored && (
        <div className="w-64 h-64 rounded-xl bg-white/10 animate-pulse flex items-center justify-center">
          <div className="w-8 h-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
        </div>
      )}

      {errored && (
        <div className="flex flex-col items-center gap-3 text-white/60">
          <ImageOff className="w-12 h-12" />
          <span className="text-sm">No se pudo cargar la imagen</span>
        </div>
      )}

      <img
        src={url}
        alt="Mensaje"
        className={`max-w-full max-h-[90vh] object-contain rounded-lg ${loaded ? "opacity-100" : "opacity-0 absolute"}`}
        onLoad={() => setLoaded(true)}
        onError={() => setErrored(true)}
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
}
