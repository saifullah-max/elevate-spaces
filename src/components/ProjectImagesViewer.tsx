'use client'

import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, ChevronLeft, ChevronRight, Download, Image as ImageIcon, X } from "lucide-react";
import { getProjectImages } from "@/services/projects.service";
import { showError } from "./toastUtils";

interface ProjectImagesViewerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
}

interface ImageGroup {
  original: {
    url: string;
    filename: string;
  };
  stagedVersions: Array<{
    id: string;
    url: string;
    filename: string;
    watermarked?: string;
    createdAt: string;
  }>;
  metadata: {
    roomType?: string;
    stagingStyle?: string;
    prompt?: string;
    createdAt: string;
    uploadedBy?: {
      id: string;
      name?: string;
      email: string;
    };
  };
}

type PreviewState =
  | { type: "original" }
  | { type: "staged"; versionIdx: number };

export function ProjectImagesViewer({
  open,
  onOpenChange,
  projectId,
  projectName,
}: ProjectImagesViewerProps) {
  const [imageGroups, setImageGroups] = useState<ImageGroup[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedGroupIdx, setSelectedGroupIdx] = useState(0);
  const [selectedPreview, setSelectedPreview] = useState<PreviewState>({ type: "original" });
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (open && projectId) {
      void fetchProjectImages();
    }
  }, [open, projectId]);

  const fetchProjectImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProjectImages(projectId);
      setImageGroups(result.data?.imageGroups || []);
      setSelectedGroupIdx(0);
      setSelectedPreview({ type: "original" });
    } catch (err: any) {
      const message = err?.message || "Failed to fetch project images";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const currentGroup = imageGroups[selectedGroupIdx] || null;
  const currentOriginal = currentGroup?.original || null;
  const currentVersion = selectedPreview.type === "staged"
    ? currentGroup?.stagedVersions[selectedPreview.versionIdx] || null
    : null;
  const currentMainImage = selectedPreview.type === "original" ? currentOriginal : currentVersion;

  const handleDownload = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = filename;
      link.click();
      window.URL.revokeObjectURL(blobUrl);
    } catch {
      showError("Failed to download image");
    }
  };

  const handleSelectGroup = (idx: number) => {
    setSelectedGroupIdx(idx);
    setSelectedPreview({ type: "original" });
  };

  const handleNextGroup = () => {
    if (selectedGroupIdx < imageGroups.length - 1) {
      handleSelectGroup(selectedGroupIdx + 1);
    }
  };

  const handlePrevGroup = () => {
    if (selectedGroupIdx > 0) {
      handleSelectGroup(selectedGroupIdx - 1);
    }
  };

  const handleNextVersion = () => {
    if (!currentGroup) return;

    if (selectedPreview.type === "original") {
      if (currentGroup.stagedVersions.length > 0) {
        setSelectedPreview({ type: "staged", versionIdx: 0 });
      }
      return;
    }

    if (selectedPreview.versionIdx < currentGroup.stagedVersions.length - 1) {
      setSelectedPreview({ type: "staged", versionIdx: selectedPreview.versionIdx + 1 });
    }
  };

  const handlePrevVersion = () => {
    if (selectedPreview.type !== "staged") {
      return;
    }

    if (selectedPreview.versionIdx > 0) {
      setSelectedPreview({ type: "staged", versionIdx: selectedPreview.versionIdx - 1 });
    } else {
      setSelectedPreview({ type: "original" });
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[96vw] w-[82vw] max-h-[92vh] overflow-hidden p-0 sm:max-w-[96vw]">
        <div className="flex h-[92vh] flex-col overflow-hidden rounded-lg bg-cream-50">
          <DialogHeader className="border-b border-cream-200 bg-white px-6 py-4 text-left">
            <div className="flex items-start justify-between gap-4">
              <div>
                <DialogTitle className="text-2xl">Project Images: {projectName}</DialogTitle>
                <p className="mt-1 text-sm text-cream-800/50">Choose a thumbnail to preview it in the main viewer.</p>
              </div>
              <div className="rounded-full bg-cream-100 px-3 py-1 text-xs font-semibold text-cream-800/70">
                {imageGroups.length} group{imageGroups.length === 1 ? "" : "s"}
              </div>
            </div>
          </DialogHeader>

          <div className="flex-1 overflow-y-auto px-6 py-5">
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <Loader className="h-8 w-8 animate-spin text-brand-500" />
              </div>
            ) : error ? (
              <div className="rounded-xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm text-red-700">{error}</p>
                <Button onClick={fetchProjectImages} className="mt-3 bg-red-600 hover:bg-red-700">
                  Retry
                </Button>
              </div>
            ) : imageGroups.length === 0 ? (
              <div className="flex min-h-[50vh] items-center justify-center rounded-xl border border-dashed border-cream-200 bg-white">
                <div className="text-center">
                  <ImageIcon className="mx-auto mb-3 h-12 w-12 text-cream-800/30" />
                  <p className="text-lg text-cream-800/70">No images in this project yet</p>
                </div>
              </div>
            ) : (
              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.55fr)_minmax(320px,0.85fr)]">
                <div className="space-y-4">
                  <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div>
                        <div className="text-xs font-semibold uppercase tracking-wide text-brand-500">
                          {selectedPreview.type === "original" ? "Original" : "Staged version"}
                        </div>
                        <h3 className="text-lg font-semibold text-brand-900">
                          {selectedPreview.type === "original"
                            ? "Original Image"
                            : `Staged Version ${selectedPreview.versionIdx + 1}`}
                        </h3>
                      </div>
                      <div className="text-right text-xs text-cream-800/50">
                        Image {selectedGroupIdx + 1} of {imageGroups.length}
                        <br />
                        {selectedPreview.type === "original" ? "Original" : `Version ${selectedPreview.versionIdx + 1}`}
                      </div>
                    </div>

                    <div className="overflow-hidden rounded-2xl border border-cream-200 bg-cream-100">
                      <div className="relative aspect-16/10 w-full bg-cream-100">
                        {currentMainImage ? (
                          <img
                            src={currentMainImage.url}
                            alt={selectedPreview.type === "original" ? "Original" : `Staged Version ${selectedPreview.versionIdx + 1}`}
                            className="h-full w-full cursor-pointer object-contain"
                            onClick={() => setFullscreenImage(currentMainImage.url)}
                          />
                        ) : null}
                      </div>

                      <div className="flex items-center justify-between gap-3 border-t border-cream-200 bg-white px-4 py-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-brand-900">
                            {selectedPreview.type === "original" ? "Original Image" : `Staged Version ${selectedPreview.versionIdx + 1}`}
                          </p>
                          <p className="truncate text-xs text-cream-800/50">
                            {selectedPreview.type === "original" ? currentOriginal?.filename : currentVersion?.filename}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setFullscreenImage(currentMainImage?.url || null)}
                        >
                          Fullscreen
                        </Button>
                      </div>
                    </div>

                    <div className="mt-4 flex flex-wrap gap-2">
                      <Button
                        variant={selectedPreview.type === "original" ? "default" : "outline"}
                        onClick={() => setSelectedPreview({ type: "original" })}
                        className="gap-2"
                      >
                        <ImageIcon className="h-4 w-4" />
                        Original
                      </Button>
                      {currentGroup?.stagedVersions.map((version, idx) => (
                        <Button
                          key={version.id}
                          variant={selectedPreview.type === "staged" && selectedPreview.versionIdx === idx ? "default" : "outline"}
                          onClick={() => setSelectedPreview({ type: "staged", versionIdx: idx })}
                        >
                          V{idx + 1}
                        </Button>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-brand-900">Staged versions</h3>
                        <p className="text-xs text-cream-800/50">Click a thumbnail to preview it in the main viewer.</p>
                      </div>
                      <span className="rounded-full bg-brand-50 px-3 py-1 text-xs font-semibold text-brand-600">
                        {currentGroup?.stagedVersions.length || 0} variants
                      </span>
                    </div>

                    {currentGroup?.stagedVersions.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-cream-200 bg-cream-50 py-10 text-center text-sm text-cream-800/50">
                        No staged versions available
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
                        {currentGroup.stagedVersions.map((version, idx) => {
                          const isSelected = selectedPreview.type === "staged" && selectedPreview.versionIdx === idx;
                          return (
                            <button
                              key={version.id}
                              type="button"
                              onClick={() => setSelectedPreview({ type: "staged", versionIdx: idx })}
                              className={`group overflow-hidden rounded-xl border-2 bg-cream-50 text-left transition hover:-translate-y-0.5 hover:shadow-md ${
                                isSelected ? "border-brand-500 ring-2 ring-brand-100" : "border-cream-200"
                              }`}
                            >
                              <div className="relative aspect-4/3 bg-cream-100">
                                <img
                                  src={version.url}
                                  alt={`Version ${idx + 1}`}
                                  className="h-full w-full object-cover transition group-hover:scale-[1.02]"
                                />
                              </div>
                              <div className="flex items-center justify-between gap-2 border-t border-cream-200 bg-white px-3 py-2">
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold text-brand-900">Version {idx + 1}</p>
                                  <p className="truncate text-[11px] text-cream-800/50">{version.filename}</p>
                                </div>
                                <Download className="h-4 w-4 shrink-0 text-cream-800/40 group-hover:text-brand-500" />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-4">
                  {/* <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-brand-900">Navigation</h3>
                      <span className="text-xs text-cream-800/50">
                        {selectedGroupIdx + 1}/{imageGroups.length}
                      </span>
                    </div>

                    <div className="grid grid-cols-2 gap-2">
                      <Button variant="outline" onClick={handlePrevGroup} disabled={selectedGroupIdx === 0}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Previous set
                      </Button>
                      <Button variant="outline" onClick={handleNextGroup} disabled={selectedGroupIdx === imageGroups.length - 1}>
                        Next set <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>

                    <div className="mt-3 flex gap-2">
                      <Button variant="ghost" className="flex-1 justify-start" onClick={handlePrevVersion}>
                        <ChevronLeft className="mr-1 h-4 w-4" /> Previous version
                      </Button>
                      <Button variant="ghost" className="flex-1 justify-end" onClick={handleNextVersion}>
                        Next version <ChevronRight className="ml-1 h-4 w-4" />
                      </Button>
                    </div>
                  </div> */}

                  {currentGroup?.metadata && (
                    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                      <h3 className="mb-3 text-sm font-semibold text-brand-900">Details</h3>
                      <div className="space-y-3 text-xs text-cream-800/70">
                        <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                          {currentGroup.metadata.roomType && (
                            <div className="rounded-lg bg-cream-50 p-3">
                              <span className="font-semibold text-cream-800/80">Room Type</span>
                              <p className="mt-1 text-sm text-brand-900">{currentGroup.metadata.roomType}</p>
                            </div>
                          )}
                          {currentGroup.metadata.stagingStyle && (
                            <div className="rounded-lg bg-cream-50 p-3">
                              <span className="font-semibold text-cream-800/80">Style</span>
                              <p className="mt-1 text-sm text-brand-900">{currentGroup.metadata.stagingStyle}</p>
                            </div>
                          )}
                        </div>

                        {currentGroup.metadata.prompt && (
                          <div className="rounded-lg bg-cream-50 p-3">
                            <span className="font-semibold text-cream-800/80">Prompt</span>
                            <p className="mt-1 line-clamp-4 text-sm text-brand-900">{currentGroup.metadata.prompt}</p>
                          </div>
                        )}

                        {currentGroup.metadata.uploadedBy && (
                          <div className="rounded-lg bg-cream-50 p-3">
                            <span className="font-semibold text-cream-800/80">Uploaded by</span>
                            <p className="mt-1 text-sm text-brand-900">
                              {currentGroup.metadata.uploadedBy.name || currentGroup.metadata.uploadedBy.email}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {currentMainImage?.url && (
                    <div className="rounded-2xl border border-cream-200 bg-white p-4 shadow-sm">
                      <Button
                        className="w-full bg-brand-500 hover:bg-brand-600"
                        onClick={() =>
                          handleDownload(
                            currentMainImage.url,
                            selectedPreview.type === "original"
                              ? currentOriginal?.filename || "original"
                              : currentVersion?.filename || "staged"
                          )
                        }
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download current image
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          {imageGroups.length > 1 && (
            <div className="border-t border-cream-200 bg-white px-6 py-4">
              <div className="flex flex-wrap gap-2">
                {imageGroups.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSelectGroup(idx)}
                    className={`inline-flex min-w-12 items-center justify-center rounded-full border px-3 py-2 text-sm font-semibold transition ${
                      selectedGroupIdx === idx
                        ? "border-brand-500 bg-brand-500 text-white shadow"
                        : "border-cream-200 bg-cream-50 text-cream-800/80 hover:border-cream-200 hover:bg-cream-100"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 backdrop-blur"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute right-4 top-4 rounded-full bg-white p-2 text-black transition hover:bg-cream-200"
            >
              <X className="h-6 w-6" />
            </button>
            <img
              src={fullscreenImage}
              alt="Fullscreen"
              className="max-h-full max-w-full object-contain"
              onClick={(e) => e.stopPropagation()}
            />
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}