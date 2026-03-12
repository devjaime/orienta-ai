"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/Button";
import { trackEvent } from "@/lib/utils/analytics";

interface VirtualAdvisorVideoProps {
  videoId: string;
  src: string;
  title: string;
  description?: string;
  durationEstimate?: string;
  autoplay?: boolean;
  showSkip?: boolean;
  analyticsContext?: Record<string, string | number | boolean | null | undefined>;
  onContinue?: () => void;
  onCompleted?: () => void;
}

export default function VirtualAdvisorVideo({
  videoId,
  src,
  title,
  description,
  durationEstimate,
  autoplay = false,
  showSkip = true,
  analyticsContext = {},
  onContinue,
  onCompleted,
}: VirtualAdvisorVideoProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const impressionTrackedRef = useRef(false);

  const [inView, setInView] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [hasError, setHasError] = useState(false);

  const payload = useMemo(
    () => ({
      video_id: videoId,
      ...analyticsContext,
    }),
    [analyticsContext, videoId],
  );

  useEffect(() => {
    const target = containerRef.current;
    if (!target) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold: 0.2 },
    );

    observer.observe(target);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    if (!inView || impressionTrackedRef.current) return;
    impressionTrackedRef.current = true;
    trackEvent("virtual_advisor_video_impression", payload);
  }, [inView, payload]);

  const handleContinue = () => {
    if (!isCompleted) {
      trackEvent("virtual_advisor_video_skip", payload);
    }
    onContinue?.();
  };

  return (
    <div ref={containerRef} className="rounded-2xl border border-vocari-primary/25 bg-white p-4 shadow-sm">
      <div className="flex items-center justify-between gap-3 mb-3">
        <div>
          <p className="text-sm font-semibold text-vocari-text">{title}</p>
          {description && <p className="text-xs text-vocari-text-muted mt-0.5">{description}</p>}
        </div>
        {durationEstimate && (
          <span className="text-xs px-2 py-1 rounded-full bg-vocari-primary/10 text-vocari-primary">
            {durationEstimate}
          </span>
        )}
      </div>

      <div className="relative aspect-video w-full overflow-hidden rounded-xl bg-gray-100 border border-gray-200">
        {inView ? (
          <video
            ref={videoRef}
            controls
            playsInline
            muted={isMuted}
            autoPlay={autoplay}
            preload="metadata"
            className="h-full w-full object-contain object-center bg-white"
            onLoadedData={() => setIsLoading(false)}
            onPlay={() => {
              if (!hasStarted) {
                setHasStarted(true);
                trackEvent("virtual_advisor_video_play", payload);
              }
            }}
            onEnded={() => {
              setIsCompleted(true);
              trackEvent("virtual_advisor_video_complete", payload);
              onCompleted?.();
            }}
            onError={() => {
              setHasError(true);
              setIsLoading(false);
              trackEvent("virtual_advisor_video_error", payload);
            }}
          >
            <source src={src} type="video/mp4" />
            Tu navegador no soporta video HTML5.
          </video>
        ) : null}

        {isLoading && !hasError && (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-vocari-text-muted">
            Cargando orientación...
          </div>
        )}

        {hasError && (
          <div className="absolute inset-0 flex items-center justify-center px-4 text-center text-sm text-vocari-text-muted">
            No pudimos cargar este video. Puedes continuar sin problema.
          </div>
        )}
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          variant="secondary"
          onClick={() => setIsMuted((current) => !current)}
        >
          {isMuted ? "Activar sonido" : "Silenciar"}
        </Button>
        {showSkip && (
          <Button size="sm" onClick={handleContinue}>
            Continuar
          </Button>
        )}
      </div>
    </div>
  );
}
