"use client";

import { useState } from "react";
import VirtualAdvisorVideo from "@/components/orientador/VirtualAdvisorVideo";
import { VIRTUAL_ADVISOR_VIDEOS, type VirtualAdvisorVideoId } from "@/lib/data/virtual-advisor-videos";

interface TestFlowVideoGateProps {
  videoId: VirtualAdvisorVideoId;
  storageKey: string;
  analyticsContext?: Record<string, string | number | boolean | null | undefined>;
  onContinue?: () => void;
}

export default function TestFlowVideoGate({
  videoId,
  storageKey,
  analyticsContext = {},
  onContinue,
}: TestFlowVideoGateProps) {
  const videosEnabled = process.env.NEXT_PUBLIC_VIRTUAL_ADVISOR_VIDEOS !== "false";
  const [hidden, setHidden] = useState(() => {
    if (typeof window === "undefined") return false;
    return window.sessionStorage.getItem(storageKey) === "done";
  });
  const config = VIRTUAL_ADVISOR_VIDEOS[videoId];

  const handleContinue = () => {
    if (typeof window !== "undefined") {
      window.sessionStorage.setItem(storageKey, "done");
    }
    setHidden(true);
    onContinue?.();
  };

  if (!videosEnabled || hidden) return null;

  return (
    <VirtualAdvisorVideo
      videoId={config.id}
      src={config.src}
      title={config.title}
      description={config.description}
      durationEstimate={config.durationEstimate}
      autoplay={false}
      onContinue={handleContinue}
      analyticsContext={analyticsContext}
    />
  );
}
