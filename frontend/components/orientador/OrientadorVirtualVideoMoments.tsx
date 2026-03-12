"use client";

import { useMemo, useState } from "react";
import VirtualAdvisorVideo from "@/components/orientador/VirtualAdvisorVideo";
import {
  ORIENTADOR_VIRTUAL_CHAT_VIDEOS,
  type ChatVideoMoment,
} from "@/lib/data/orientador-virtual-chat-videos";

interface OrientadorVirtualVideoMomentsProps {
  userMessageCount: number;
}

const STORAGE_PREFIX = "ov_chat_video_";

function getMomentVisibility(moment: ChatVideoMoment): boolean {
  if (typeof window === "undefined") return false;
  return window.sessionStorage.getItem(`${STORAGE_PREFIX}${moment}`) !== "done";
}

function markMomentAsDone(moment: ChatVideoMoment): void {
  if (typeof window === "undefined") return;
  window.sessionStorage.setItem(`${STORAGE_PREFIX}${moment}`, "done");
}

export default function OrientadorVirtualVideoMoments({
  userMessageCount,
}: OrientadorVirtualVideoMomentsProps) {
  const videosEnabled = process.env.NEXT_PUBLIC_VIRTUAL_ADVISOR_CHAT_VIDEOS !== "false";
  const [momentVisibility, setMomentVisibility] = useState<Record<ChatVideoMoment, boolean>>(() => ({
    welcome_chat: getMomentVisibility("welcome_chat"),
    guide_interpretation: getMomentVisibility("guide_interpretation"),
    closing_plan: getMomentVisibility("closing_plan"),
  }));

  const activeMoment = useMemo<ChatVideoMoment | null>(() => {
    if (momentVisibility.welcome_chat && userMessageCount === 0) return "welcome_chat";
    if (momentVisibility.guide_interpretation && userMessageCount >= 1) return "guide_interpretation";
    if (momentVisibility.closing_plan && userMessageCount >= 3) return "closing_plan";
    return null;
  }, [momentVisibility, userMessageCount]);

  if (!videosEnabled || !activeMoment) return null;

  const config = ORIENTADOR_VIRTUAL_CHAT_VIDEOS[activeMoment];

  return (
    <VirtualAdvisorVideo
      videoId={config.video.id}
      src={config.video.src}
      title={config.video.title}
      description={config.video.description}
      durationEstimate={config.video.durationEstimate}
      analyticsContext={{
        page: "/estudiante/orientador-virtual",
        step: activeMoment,
        message_count: userMessageCount,
      }}
      onContinue={() => {
        markMomentAsDone(activeMoment);
        setMomentVisibility((current) => ({ ...current, [activeMoment]: false }));
      }}
    />
  );
}
