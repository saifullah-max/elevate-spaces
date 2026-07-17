"use client";

import { Info } from "lucide-react";
import type { ReactNode } from "react";

interface Props {
  children: ReactNode;
  iconClassName?: string;
  size?: "sm" | "xs";
}

export default function InfoTip({
  children,
  iconClassName = "text-cream-800/40 hover:text-brand-500",
  size = "sm",
}: Props) {
  const iconSize = size === "xs" ? "w-2.5 h-2.5" : "w-3 h-3";
  return (
    <span className="relative inline-flex group align-middle">
      <Info className={`${iconSize} cursor-help ${iconClassName}`} />
      <span
        role="tooltip"
        className="pointer-events-none hidden group-hover:block absolute left-1/2 bottom-[130%] -translate-x-1/2 z-30 w-[220px] bg-brand-900 text-white text-[11px] font-medium leading-snug px-2.5 py-2 rounded-lg shadow-lg whitespace-normal text-left"
      >
        {children}
      </span>
    </span>
  );
}
