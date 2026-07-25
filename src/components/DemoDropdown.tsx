import React from "react";

interface DropdownProps<T extends string> {
  label: string;
  value: T | undefined;
  options: { label: string; value: T }[];
  onChange: (v: T) => void;
  placeholder?: string;
}

export function DemoDropdown<T extends string>({ label, value, options, onChange, placeholder }: DropdownProps<T>) {
  return (
    <div>
      <label className="block text-xs font-bold text-cream-800/50 uppercase mb-2">{label}</label>
      <select
        className="w-full px-4 py-3 border border-cream-200 rounded-lg bg-white font-medium focus:ring-2 focus:ring-brand-500 outline-none mb-3"
        value={value || ""}
        onChange={e => onChange(e.target.value as T)}
      >
        <option value="">{placeholder || `Select ${label}`}</option>
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
    </div>
  );
}
