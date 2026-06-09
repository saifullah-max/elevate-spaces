"use client";

import React, { useEffect, useRef, useState } from "react";
import { Info } from "lucide-react";

type InfoHintProps = {
    text: string;
    className?: string;
    iconClassName?: string;
    position?: "left" | "right";
};

export default function InfoHint({ text, className = "", iconClassName = "", position = "left" }: InfoHintProps) {
    const [open, setOpen] = useState(false);
    const rootRef = useRef<HTMLSpanElement | null>(null);

    useEffect(() => {
        const handlePointerDown = (event: PointerEvent) => {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        };

        const handleKeyDown = (event: KeyboardEvent) => {
            if (event.key === "Escape") {
                setOpen(false);
            }
        };

        window.addEventListener("pointerdown", handlePointerDown);
        window.addEventListener("keydown", handleKeyDown);
        return () => {
            window.removeEventListener("pointerdown", handlePointerDown);
            window.removeEventListener("keydown", handleKeyDown);
        };
    }, []);

    return (
        <span
            ref={rootRef}
            className={`relative inline-flex align-middle ${className}`}
            onPointerEnter={() => setOpen(true)}
            onPointerLeave={() => setOpen(false)}
            onFocus={() => setOpen(true)}
            onBlur={() => setOpen(false)}
        >
            <button
                type="button"
                aria-label={text}
                aria-expanded={open}
                onClick={() => setOpen((previous) => !previous)}
                className="inline-flex items-center justify-center rounded-full outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 focus-visible:ring-offset-2"
            >
                <Info className={`h-4 w-4 shrink-0 text-indigo-500 ${iconClassName}`} />
            </button>

            {open && (
                <span className={`absolute top-full z-30 mt-2 w-64 rounded-lg border border-slate-200 bg-slate-900 px-3 py-2 text-left text-xs leading-5 text-white shadow-lg ${position === "right" ? "left-0" : "-right-6"}`}>
                    {text}
                </span>
            )}
        </span>
    );
}