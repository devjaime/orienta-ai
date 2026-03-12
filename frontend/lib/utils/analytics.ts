"use client";

type AnalyticsPayload = Record<string, string | number | boolean | null | undefined>;

declare global {
  interface Window {
    dataLayer?: Array<Record<string, unknown>>;
  }
}

export function trackEvent(event: string, payload: AnalyticsPayload = {}): void {
  if (typeof window === "undefined") return;

  const data = {
    event,
    ...payload,
    ts: new Date().toISOString(),
  };

  window.dispatchEvent(new CustomEvent("vocari-analytics", { detail: data }));

  if (Array.isArray(window.dataLayer)) {
    window.dataLayer.push(data);
  }
}

