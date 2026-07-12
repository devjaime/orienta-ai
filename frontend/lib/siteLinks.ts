export const SITE_LINKS = {
  vocationalTest: "/test-gratis",
  sampleReport: "/informe-test/demo",
  careerTransition: "/reconversion-gratis",
  skillGraph: "https://skill-graph-five.vercel.app/",
  skillGraphRoadmap: "https://skill-graph-five.vercel.app/roadmap",
  skillGraphAgent: "https://skill-graph-five.vercel.app/agent",
  skillGraphPlayground: "https://skill-graph-five.vercel.app/playground",
  skillGraphCertifications:
    "https://skill-graph-five.vercel.app/certifications",
  repository: "https://github.com/devjaime/orienta-ai",
  license: "https://github.com/devjaime/orienta-ai/blob/main/LICENSE",
  email: "mailto:hernandez.hs@gmail.com",
} as const;

export type SiteLinkKey = keyof typeof SITE_LINKS;