import { useState, useRef, useEffect } from "react";
import type { InternationalRegion } from "@/types/movie";

interface RegionOption {
  value: InternationalRegion;
  label: string;
}

const REGION_OPTIONS: RegionOption[] = [
  { value: "all", label: "All International" },
  { value: "korean", label: "Korean" },
  { value: "japanese", label: "Japanese" },
  { value: "filipino", label: "Filipino" },
  { value: "thai", label: "Thai" },
  { value: "chinese", label: "Chinese" },
  { value: "french", label: "French" },
  { value: "spanish", label: "Spanish" },
  { value: "british", label: "British" },
];

interface RegionSelectorProps {
  value: InternationalRegion;
  onChange: (region: InternationalRegion) => void;
}

export function RegionSelector({ value, onChange }: RegionSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedOption = REGION_OPTIONS.find((opt) => opt.value === value);
  const displayLabel = value === "all"
    ? "International Drama"
    : `${selectedOption?.label} Drama`;

  return (
    <div className="relative inline-block" ref={dropdownRef}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 text-2xl md:text-3xl font-bold transition-colors hover:opacity-80"
        style={{ color: "var(--color-text)" }}
      >
        {displayLabel}
        <svg
          className={`w-6 h-6 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`}
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
          style={{ color: "var(--color-accent)" }}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>

      {isOpen && (
        <div
          className="absolute top-full left-0 mt-2 py-2 rounded-lg min-w-[200px] z-50"
          style={{
            background: "rgba(20, 20, 20, 0.95)",
            backdropFilter: "blur(12px)",
            border: "1px solid rgba(255, 255, 255, 0.1)",
            boxShadow: "0 8px 32px rgba(0, 0, 0, 0.4)",
          }}
        >
          {REGION_OPTIONS.map((option) => (
            <button
              key={option.value}
              onClick={() => {
                onChange(option.value);
                setIsOpen(false);
              }}
              className="w-full px-4 py-2.5 text-left text-base transition-colors hover:bg-white/10"
              style={{
                color: value === option.value ? "var(--color-accent)" : "var(--color-text)",
              }}
            >
              {option.value === "all" ? "All International" : option.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
