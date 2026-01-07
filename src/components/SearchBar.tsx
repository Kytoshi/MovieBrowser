import { useState } from 'react';
import { motion } from 'motion/react';
import { Input } from '@/components/ui/input';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function SearchBar({ value, onChange, placeholder = "Search for movies..." }: SearchBarProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className="w-full max-w-2xl mx-auto">
      <div className="relative">
        <svg
          className="absolute left-5 top-1/2 transform -translate-y-1/2 h-5 w-5 z-10"
          fill="none"
          stroke="var(--color-accent)"
          viewBox="0 0 24 24"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
          />
        </svg>

        <Input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          placeholder={placeholder}
          className="modern-input pl-14 pr-24 h-14 text-base"
          style={{
            background: isFocused ? 'rgba(255, 255, 255, 0.03)' : 'var(--color-surface)',
            color: 'var(--color-text)',
          }}
        />

        {/* Clear button */}
        {value && (
          <motion.button
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0, opacity: 0 }}
            onClick={() => onChange('')}
            className="absolute right-4 top-1/2 transform -translate-y-1/2 px-4 py-2 rounded-lg text-sm font-semibold transition-all z-10"
            style={{
              background: 'var(--color-accent)',
              color: 'white',
            }}
            aria-label="Clear search"
          >
            Clear
          </motion.button>
        )}
      </div>
    </div>
  );
}
