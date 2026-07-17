"use client";

import { Loader2, WandSparkles } from "lucide-react";
import type { StudioController } from "./useStudio";

interface Props {
  studio: StudioController;
}

export default function GenerateSection({ studio }: Props) {
  const needsMoreCredits =
    studio.isLoggedIn &&
    studio.creditSource === "personal" &&
    studio.personalBalance < studio.creditsNeeded &&
    studio.files.length > 0;

  return (
    <div className="space-y-5">
      {needsMoreCredits && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center justify-between gap-3">
          <span className="text-xs font-medium text-amber-700">
            You need {studio.creditsNeeded} credits, but only {studio.personalBalance} available.
          </span>
          <a
            href="/pricing"
            className="bg-white border border-amber-300 text-amber-700 text-sm font-semibold px-4 rounded-lg shrink-0 inline-flex items-center justify-center"
            style={{ minHeight: 44 }}
          >
            Buy more
          </a>
        </div>
      )}

      {studio.error && (
        <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-xs text-red-700">
          {studio.error}
        </div>
      )}

      <button
        type="button"
        onClick={studio.generate}
        disabled={!studio.canGenerate}
        className="w-full bg-accent-500 hover:bg-accent-600 disabled:opacity-60 disabled:cursor-not-allowed transition-colors text-white text-sm font-semibold py-3 rounded-xl flex items-center justify-center gap-2 shadow-sm"
      >
        {studio.processing ? (
          <>
            <Loader2 className="w-4 h-4 animate-spin" /> Processing…
          </>
        ) : (
          <>
            <WandSparkles className="w-3.5 h-3.5" /> Generate &amp; Use{" "}
            {studio.creditsNeeded || 1} Credit{(studio.creditsNeeded || 1) > 1 ? "s" : ""}
          </>
        )}
      </button>

      {studio.processing && (
        <div className="bg-brand-50 border border-brand-100 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-2">
            <Loader2 className="w-4 h-4 text-brand-500 animate-spin" />
            <p className="text-sm font-semibold text-brand-900">
              {studio.progressMessage || "Processing images"}
            </p>
          </div>
          <div className="w-full h-1.5 bg-brand-100 rounded-full overflow-hidden mb-2">
            <div
              className="h-full bg-brand-500 rounded-full transition-all"
              style={{ width: `${studio.progressPercent}%` }}
            />
          </div>
          <p className="text-xs text-brand-900/70">
            Elapsed {studio.elapsedSec}s
          </p>
          <p className="text-[11px] text-brand-900/50 mt-2">
            Please keep this page open while staging runs.
          </p>
        </div>
      )}
    </div>
  );
}
