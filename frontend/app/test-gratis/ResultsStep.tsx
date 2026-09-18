"use client";

import { AIAssistant } from "@/components/ai/AIAssistant";
import { ResultsCareers } from "./ResultsCareers";
import { ResultsFeedback } from "./ResultsFeedback";

export function ResultsStep(p: Record<string, any>) {
  return (
    <div className="min-h-screen bg-gradient-to-br from-aura-primary/5 via-aura-surface to-aura-violet/5">
      <div className="max-w-5xl mx-auto px-4 py-8">
        <ResultsCareers {...p} />
        <ResultsFeedback {...p} />
      </div>
      <AIAssistant />
    </div>
  );
}
