"use client";

import { useState, type ReactNode } from "react";
import { cn } from "@/lib/utils/validation";

type TabsVariant = "underline" | "pills";

interface Tab {
  id: string;
  label: string;
  content: ReactNode;
  disabled?: boolean;
}

interface TabsProps {
  tabs: Tab[];
  variant?: TabsVariant;
  defaultTab?: string;
  className?: string;
}

export function Tabs({ tabs, variant = "underline", defaultTab, className }: TabsProps) {
  const [activeTab, setActiveTab] = useState(defaultTab || tabs[0]?.id);

  const activeContent = tabs.find((t) => t.id === activeTab)?.content;

  return (
    <div className={className}>
      <div
        className={cn(
          "flex gap-1",
          variant === "underline" && "border-b border-gray-200",
        )}
        role="tablist"
      >
        {tabs.map((tab) => (
          <button
            key={tab.id}
            role="tab"
            aria-selected={activeTab === tab.id}
            aria-controls={`tabpanel-${tab.id}`}
            disabled={tab.disabled}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "px-4 py-2 text-sm font-medium transition-colors",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              variant === "underline" && "border-b-2 -mb-px",
              variant === "underline" &&
                (activeTab === tab.id
                  ? "border-vocari-accent text-vocari-accent"
                  : "border-transparent text-vocari-text-muted hover:text-vocari-text"),
              variant === "pills" && "rounded-md",
              variant === "pills" &&
                (activeTab === tab.id
                  ? "bg-vocari-primary text-white"
                  : "text-vocari-text-muted hover:bg-gray-100"),
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
      <div
        id={`tabpanel-${activeTab}`}
        role="tabpanel"
        className="mt-4"
      >
        {activeContent}
      </div>
    </div>
  );
}
