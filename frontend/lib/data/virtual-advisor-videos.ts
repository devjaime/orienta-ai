export type VirtualAdvisorVideoId =
  | "intro_test"
  | "intro_resultado"
  | "cierre_motivacional";

export interface VirtualAdvisorVideoConfig {
  id: VirtualAdvisorVideoId;
  title: string;
  description: string;
  src: string;
  durationEstimate: string;
}

export const VIRTUAL_ADVISOR_VIDEOS: Record<VirtualAdvisorVideoId, VirtualAdvisorVideoConfig> = {
  intro_test: {
    id: "intro_test",
    title: "Bienvenida a Vocari",
    description:
      "Esta introducción formal te explica cómo funciona el test y cómo interpretar tus resultados.",
    src: "/videos/heygen/intro-formal.mp4",
    durationEstimate: "20-30s",
  },
  intro_resultado: {
    id: "intro_resultado",
    title: "Antes de ver tu resultado",
    description:
      "Una guía moderna y cercana para entender mejor tu orientación vocacional y lo que viene.",
    src: "/videos/heygen/intermedio-relajado.mp4",
    durationEstimate: "20-30s",
  },
  cierre_motivacional: {
    id: "cierre_motivacional",
    title: "Cierre motivacional",
    description:
      "Cierre final para impulsarte a seguir explorando carreras y desarrollando tus habilidades.",
    src: "/videos/heygen/cierre-final.mp4",
    durationEstimate: "20-30s",
  },
};

