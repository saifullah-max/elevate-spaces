'use client'
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Loader, ChevronLeft, ChevronRight, Download, X } from "lucide-react";
import Image from "next/image";
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
  const [selectedVersionIdx, setSelectedVersionIdx] = useState(0);
  const [fullscreenImage, setFullscreenImage] = useState<string | null>(null);

  useEffect(() => {
    if (open && projectId) {
      fetchProjectImages();
    }
  }, [open, projectId]);

  const fetchProjectImages = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getProjectImages(projectId);
      setImageGroups(result.data?.imageGroups || []);
      setSelectedGroupIdx(0);
      setSelectedVersionIdx(0);
    } catch (err: any) {
      const message = err.message || "Failed to fetch project images";
      setError(message);
      showError(message);
    } finally {
      setLoading(false);
    }
  };

  const currentGroup = imageGroups[selectedGroupIdx];
  const currentOriginal = currentGroup?.original;
  const currentVersion = currentGroup?.stagedVersions[selectedVersionIdx];

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
    } catch (err) {
      showError("Failed to download image");
    }
  };

  const handleNextGroup = () => {
    if (selectedGroupIdx < imageGroups.length - 1) {
      setSelectedGroupIdx(selectedGroupIdx + 1);
      setSelectedVersionIdx(0);
    }
  };

  const handlePrevGroup = () => {
    if (selectedGroupIdx > 0) {
      setSelectedGroupIdx(selectedGroupIdx - 1);
      setSelectedVersionIdx(0);
    }
  };

  const handleNextVersion = () => {
    if (selectedVersionIdx < currentGroup.stagedVersions.length - 1) {
      setSelectedVersionIdx(selectedVersionIdx + 1);
    }
  };

  const handlePrevVersion = () => {
    if (selectedVersionIdx > 0) {
      setSelectedVersionIdx(selectedVersionIdx - 1);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl">Project Images: {projectName}</DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="flex items-center justify-center py-16">
            <Loader className="w-8 h-8 animate-spin text-indigo-600" />
          </div>
        ) : error ? (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
            <Button
              onClick={fetchProjectImages}
              className="mt-3 bg-red-600 hover:bg-red-700"
            >
              Retry
            </Button>
          </div>
        ) : imageGroups.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-slate-500 text-lg">No images in this project yet</p>
          </div>
        ) : (
          <div className="space-y-6">
            {/* Image Counter */}
            <div className="flex items-center justify-between px-4 py-2 bg-slate-100 rounded-lg">
              <span className="text-sm font-semibold text-slate-700">
                Image {selectedGroupIdx + 1} of {imageGroups.length}
              </span>
              <span className="text-xs text-slate-600">
                Version {selectedVersionIdx + 1} of {currentGroup?.stagedVersions.length || 0}
              </span>
            </div>

            {/* Main Image Display */}
            <div className="space-y-4">
              {/* Original + Staged Toggle */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setFullscreenImage(currentOriginal?.url || null)}
                  className="flex-1"
                >
                  View Original
                </Button>
              </div>

              {/* Original Image Preview */}
              <div className="border-2 border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                <div className="relative aspect-video flex items-center justify-center bg-slate-100">
                  {currentOriginal && (
                    <img
                      src={currentOriginal.url}
                      alt="Original"
                      className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-80 transition"
                      onClick={() => setFullscreenImage(currentOriginal.url)}
                    />
                  )}
                </div>
                <div className="p-3 bg-white border-t border-slate-200">
                  <p className="text-xs font-semibold text-slate-900">Original Image</p>
                  <p className="text-xs text-slate-500 truncate">{currentOriginal?.filename}</p>
                </div>
              </div>

              {/* Staged Versions */}
              <div>
                <h3 className="text-sm font-semibold text-slate-900 mb-3">
                  Staged Versions ({currentGroup?.stagedVersions.length || 0})
                </h3>

                {currentGroup?.stagedVersions.length === 0 ? (
                  <div className="text-center py-8 bg-slate-50 rounded-lg border border-slate-200">
                    <p className="text-slate-500 text-sm">No staged versions available</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {/* Current Staged Version Display */}
                    <div className="border-2 border-indigo-300 rounded-xl overflow-hidden bg-slate-50">
                      <div className="relative aspect-video flex items-center justify-center bg-slate-100">
                        {currentVersion && (
                          <img
                            src={currentVersion.url}
                            alt={`Staged Version ${selectedVersionIdx + 1}`}
                            className="max-h-full max-w-full object-contain cursor-pointer hover:opacity-80 transition"
                            onClick={() => setFullscreenImage(currentVersion.url)}
                          />
                        )}
                      </div>
                      <div className="p-3 bg-white border-t border-indigo-300">
                        <div className="flex items-center justify-between">
                          <div className="flex-1">
                            <p className="text-xs font-semibold text-indigo-900">
                              Staged Version {selectedVersionIdx + 1} of {currentGroup?.stagedVersions.length}
                            </p>
                            <p className="text-xs text-slate-500 truncate">{currentVersion?.filename}</p>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() =>
                              handleDownload(
                                currentVersion?.url || "",
                                currentVersion?.filename || "staged"
                              )
                            }
                            className="ml-2"
                          >
                            <Download className="w-3 h-3" />
                          </Button>
                        </div>
                      </div>
                    </div>

                    {/* Version Navigation */}
                    <div className="flex items-center justify-between gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handlePrevVersion}
                        disabled={selectedVersionIdx === 0}
                      >
                        <ChevronLeft className="w-4 h-4" />
                      </Button>

                      {/* Thumbnail Grid */}
                      <div className="flex gap-2 flex-1 overflow-x-auto pb-2">
                        {currentGroup?.stagedVersions.map((version, idx) => (
                          <button
                            key={version.id}
                            onClick={() => setSelectedVersionIdx(idx)}
                            className={`flex-shrink-0 w-16 h-12 rounded-lg border-2 overflow-hidden transition ${
                              selectedVersionIdx === idx
                                ? "border-indigo-600 ring-2 ring-indigo-300"
                                : "border-slate-200 hover:border-slate-300"
                            }`}
                          >
                            <img
                              src={version.url}
                              alt={`Version ${idx + 1}`}
                              className="w-full h-full object-cover"
                            />
                          </button>
                        ))}
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleNextVersion}
                        disabled={selectedVersionIdx === currentGroup?.stagedVersions.length - 1}
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                )}
              </div>

              {/* Metadata */}
              {currentGroup?.metadata && (
                <div className="p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-2">
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    {currentGroup.metadata.roomType && (
                      <div>
                        <span className="font-semibold text-slate-700">Room Type:</span>
                        <span className="text-slate-600 ml-1">{currentGroup.metadata.roomType}</span>
                      </div>
                    )}
                    {currentGroup.metadata.stagingStyle && (
                      <div>
                        <span className="font-semibold text-slate-700">Style:</span>
                        <span className="text-slate-600 ml-1">{currentGroup.metadata.stagingStyle}</span>
                      </div>
                    )}
                  </div>
                  {currentGroup.metadata.prompt && (
                    <div className="text-xs">
                      <span className="font-semibold text-slate-700">Prompt:</span>
                      <p className="text-slate-600 mt-1 line-clamp-2">{currentGroup.metadata.prompt}</p>
                    </div>
                  )}
                  {currentGroup.metadata.uploadedBy && (
                    <div className="text-xs text-slate-600 pt-2 border-t border-slate-200">
                      Uploaded by: {currentGroup.metadata.uploadedBy.name || currentGroup.metadata.uploadedBy.email}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Image Group Navigation */}
            <div className="flex items-center justify-between gap-2 pt-4 border-t border-slate-200">
              <Button
                variant="outline"
                onClick={handlePrevGroup}
                disabled={selectedGroupIdx === 0}
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous Image
              </Button>

              <div className="flex gap-1 flex-1 justify-center overflow-x-auto px-2">
                {imageGroups.map((_, idx) => (
                  <button
                    key={idx}
                    onClick={() => {
                      setSelectedGroupIdx(idx);
                      setSelectedVersionIdx(0);
                    }}
                    className={`flex-shrink-0 w-10 h-10 rounded border-2 text-xs font-semibold transition ${
                      selectedGroupIdx === idx
                        ? "border-indigo-600 bg-indigo-600 text-white"
                        : "border-slate-300 text-slate-700 hover:border-slate-400"
                    }`}
                  >
                    {idx + 1}
                  </button>
                ))}
              </div>

              <Button
                variant="outline"
                onClick={handleNextGroup}
                disabled={selectedGroupIdx === imageGroups.length - 1}
              >
                Next Image
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}

        {/* Fullscreen Image Modal */}
        {fullscreenImage && (
          <div
            className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center backdrop-blur p-4"
            onClick={() => setFullscreenImage(null)}
          >
            <button
              onClick={() => setFullscreenImage(null)}
              className="absolute top-4 right-4 bg-white text-black rounded-full p-2 hover:bg-slate-200 transition"
            >
              <X className="w-6 h-6" />
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
