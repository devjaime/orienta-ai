import { VIRTUAL_ADVISOR_VIDEOS } from "@/lib/data/virtual-advisor-videos";

export type ChatVideoMoment = "welcome_chat" | "guide_interpretation" | "closing_plan";

export const ORIENTADOR_VIRTUAL_CHAT_VIDEOS = {
  welcome_chat: {
    moment: "welcome_chat" as const,
    video: VIRTUAL_ADVISOR_VIDEOS.intro_test,
  },
  guide_interpretation: {
    moment: "guide_interpretation" as const,
    video: VIRTUAL_ADVISOR_VIDEOS.intro_resultado,
  },
  closing_plan: {
    moment: "closing_plan" as const,
    video: VIRTUAL_ADVISOR_VIDEOS.cierre_motivacional,
  },
};

