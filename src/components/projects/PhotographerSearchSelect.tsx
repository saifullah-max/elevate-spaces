'use client'

import { useEffect, useMemo, useRef, useState } from "react";
import { ChevronDown, X } from "lucide-react";

import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

export type PhotographerOption = {
  id: string;
  label: string;
  email: string;
  secondaryLabel?: string;
};

interface PhotographerSearchSelectProps {
  options: PhotographerOption[];
  value: string;
  onValueChange: (value: string) => void;
  label?: string;
  placeholder?: string;
  searchPlaceholder?: string;
  emptyText?: string;
  helperText?: string;
  disabled?: boolean;
}

export function PhotographerSearchSelect({
  options,
  value,
  onValueChange,
  label,
  placeholder = "Select a photographer",
  searchPlaceholder = "Search photographers",
  emptyText = "No photographers found",
  helperText,
  disabled = false,
}: PhotographerSearchSelectProps) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const selectedOption = useMemo(
    () => options.find((option) => option.id === value) || null,
    [options, value]
  );

  useEffect(() => {
    if (selectedOption) {
      setQuery(selectedOption.label);
      return;
    }

    if (!value) {
      setQuery("");
    }
  }, [selectedOption, value]);

  useEffect(() => {
    const handleDocumentPointerDown = (event: MouseEvent | TouchEvent) => {
      if (!containerRef.current) return;
      if (event.target instanceof Node && !containerRef.current.contains(event.target)) {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handleDocumentPointerDown);
    document.addEventListener("touchstart", handleDocumentPointerDown);

    return () => {
      document.removeEventListener("pointerdown", handleDocumentPointerDown);
      document.removeEventListener("touchstart", handleDocumentPointerDown);
    };
  }, []);

  const filteredOptions = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    if (!normalized) return options;

    return options.filter((option) => {
      return [option.label, option.email, option.secondaryLabel]
        .filter(Boolean)
        .some((part) => String(part).toLowerCase().includes(normalized));
    });
  }, [options, query]);

  const handleSelect = (option: PhotographerOption) => {
    onValueChange(option.id);
    setQuery(option.label);
    setOpen(false);
  };

  return (
    <div className="space-y-1" ref={containerRef}>
      {label && <label className="text-sm font-medium text-slate-700">{label}</label>}

      <div className="relative">
        <div className="relative">
          <Input
            value={query}
            onChange={(event) => {
              const nextValue = event.target.value;
              setQuery(nextValue);
              onValueChange("");
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            placeholder={placeholder}
            disabled={disabled}
            className={cn("pr-20", disabled && "bg-slate-100")}
          />

          <div className="absolute inset-y-0 right-0 flex items-center gap-1 pr-3 text-slate-400">
            {value && !disabled ? (
              <button
                type="button"
                onClick={() => {
                  onValueChange("");
                  setQuery("");
                  setOpen(true);
                }}
                className="rounded p-1 hover:bg-slate-100 hover:text-slate-600"
                aria-label="Clear photographer"
              >
                <X className="h-4 w-4" />
              </button>
            ) : null}
            <button
              type="button"
              disabled={disabled}
              onClick={() => setOpen((current) => !current)}
              className={cn(
                "rounded p-1 transition hover:bg-slate-100 hover:text-slate-600",
                disabled && "cursor-not-allowed opacity-50 hover:bg-transparent hover:text-slate-400"
              )}
              aria-label={open ? "Close photographer dropdown" : "Open photographer dropdown"}
            >
              <ChevronDown className={cn("h-4 w-4 transition-transform", open && "rotate-180")} />
            </button>
          </div>
        </div>

        {open && !disabled && (
          <div className="absolute z-20 mt-2 w-full overflow-hidden rounded-lg border border-slate-200 bg-white shadow-lg">
            <div className="border-b border-slate-100 p-2">
              <Input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder={searchPlaceholder}
                className="h-9 border-slate-200"
                autoFocus
              />
            </div>

            <div className="max-h-56 overflow-y-auto p-1">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((option) => (
                  <button
                    key={option.id}
                    type="button"
                    onMouseDown={(event) => event.preventDefault()}
                    onClick={() => handleSelect(option)}
                    className={cn(
                      "flex w-full flex-col items-start rounded-md px-3 py-2 text-left text-sm transition hover:bg-slate-50",
                      value === option.id && "bg-indigo-50 text-indigo-700"
                    )}
                  >
                    <span className="font-medium text-slate-900">{option.label}</span>
                    <span className="text-xs text-slate-500">
                      {option.email}
                      {option.secondaryLabel ? ` · ${option.secondaryLabel}` : ""}
                    </span>
                  </button>
                ))
              ) : (
                <div className="px-3 py-6 text-center text-sm text-slate-500">{emptyText}</div>
              )}
            </div>
          </div>
        )}
      </div>

      {helperText && <p className="text-xs text-slate-500">{helperText}</p>}
    </div>
  );
}