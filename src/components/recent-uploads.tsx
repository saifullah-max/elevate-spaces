"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import { getRecentUploads, PairedUpload } from "@/services/image.service";
import { Download, X } from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

export default function RecentUploads() {
  const PAGE_SIZE = 8;
  const [uploads, setUploads] = useState<PairedUpload[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selected, setSelected] = useState<PairedUpload | null>(null);
  const [view, setView] = useState<"staged" | "original">("staged");
  const [selectedVariantIdx, setSelectedVariantIdx] = useState(0);
  const [currentPage, setCurrentPage] = useState(1);

  const totalPages = Math.max(1, Math.ceil(uploads.length / PAGE_SIZE));
  const clampedCurrentPage = Math.min(currentPage, totalPages);
  const startIdx = (clampedCurrentPage - 1) * PAGE_SIZE;
  const pagedUploads = uploads.slice(startIdx, startIdx + PAGE_SIZE);

  const fetchUploads = async () => {
    try {
      const data = await getRecentUploads(50);
      setUploads(data.uploads);
      setCurrentPage(1);
      setError(null);
    } catch (err: any) {
      setError(err.message || "Failed to load uploads");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUploads();

    const onRefreshRequested = () => {
      fetchUploads();
    };

    window.addEventListener("elevate:recent-uploads-refresh", onRefreshRequested);
    return () => {
      window.removeEventListener("elevate:recent-uploads-refresh", onRefreshRequested);
    };
  }, []);

  const handleDownload = async (url: string, filename: string) => {
    const res = await fetch(url);
    const blob = await res.blob();
    const blobUrl = window.URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.href = blobUrl;
    link.download = filename;
    link.click();

    window.URL.revokeObjectURL(blobUrl);
  };

  const activeStagedVariant =
    selected?.stagedVariants && selected.stagedVariants.length > 0
      ? selected.stagedVariants[selectedVariantIdx] || selected.stagedVariants[0]
      : selected?.staged;

  const activeImage = view === "staged" && activeStagedVariant ? activeStagedVariant : selected?.original;

  return (
    <section className="max-w-6xl mx-auto py-10 md:py-12 px-4">
      <h2 className="text-2xl font-bold mb-6 text-slate-900">
        Recent Uploads
      </h2>

      {loading && <div className="text-slate-500">Loading...</div>}
      {error && <div className="text-red-600">{error}</div>}

      {!loading && uploads.length > 0 && (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {pagedUploads.map((pair, idx) => (
              <div
                key={`${pair.groupId || pair.original.url}-${idx}`}
                onClick={() => {
                  setSelected(pair);
                  setSelectedVariantIdx(0);
                  setView(pair.staged ? "staged" : "original");
                }}
                className="
                  bg-white rounded-xl border border-slate-200 cursor-pointer
                  hover:shadow-lg hover:-translate-y-1 transition
                "
              >
                <div className="aspect-4/3 md:aspect-video bg-slate-100 overflow-hidden rounded-t-xl">
                  <Image
                    src={pair.original.url}
                    alt={pair.original.filename}
                    width={400}
                    height={300}
                    unoptimized
                    className="w-full h-full object-cover"
                  />
                </div>

                <div className="p-3 text-xs text-slate-600">
                  <p className="font-semibold truncate">
                    {pair.original.filename}
                  </p>
                  <p>{new Date(pair.createdAt).toLocaleString()}</p>
                  {(pair.staged || (pair.stagedVariants && pair.stagedVariants.length > 0)) && (
                    <span className="text-emerald-600 font-semibold md:font-bold">
                      {(pair.stagedVariants?.length || 1)} staged versions
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div className="mt-6">
              <Pagination>
                <PaginationContent>
                  <PaginationItem>
                    <PaginationPrevious
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((prev) => Math.max(1, prev - 1));
                      }}
                      className={clampedCurrentPage === 1 ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>

                  {Array.from({ length: totalPages }).map((_, idx) => {
                    const page = idx + 1;
                    const isNearCurrent = Math.abs(page - clampedCurrentPage) <= 1;
                    const isEdge = page === 1 || page === totalPages;

                    if (!isNearCurrent && !isEdge) {
                      if (page === clampedCurrentPage - 2 || page === clampedCurrentPage + 2) {
                        return (
                          <PaginationItem key={`ellipsis-${page}`}>
                            <PaginationEllipsis />
                          </PaginationItem>
                        );
                      }
                      return null;
                    }

                    return (
                      <PaginationItem key={page}>
                        <PaginationLink
                          href="#"
                          isActive={page === clampedCurrentPage}
                          onClick={(e) => {
                            e.preventDefault();
                            setCurrentPage(page);
                          }}
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    );
                  })}

                  <PaginationItem>
                    <PaginationNext
                      href="#"
                      onClick={(e) => {
                        e.preventDefault();
                        setCurrentPage((prev) => Math.min(totalPages, prev + 1));
                      }}
                      className={clampedCurrentPage === totalPages ? "pointer-events-none opacity-50" : ""}
                    />
                  </PaginationItem>
                </PaginationContent>
              </Pagination>
            </div>
          )}
        </>
      )}

      {/* MODAL */}
      {selected && activeImage && (
        <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center px-3 md:p-4 md:backdrop-blur-sm">
          <div
            className="
              bg-white w-full max-w-sm sm:max-w-md
              md:max-w-4xl md:max-h-[90vh]
              h-auto md:h-auto
              rounded-xl md:rounded-2xl
              shadow-2xl flex flex-col overflow-hidden
            "
          >
            {/* Header */}
            <div className="flex items-center justify-between px-4 md:px-5 py-3 md:py-4 border-b">
              <div className="min-w-0">
                <h3 className="text-sm md:text-base font-semibold">
                  Image Preview
                </h3>
                <p className="text-[11px] md:text-xs text-slate-500 truncate max-w-55">
                  {activeImage.filename}
                </p>
              </div>

              <button
                onClick={() => setSelected(null)}
                className="h-8 w-8 md:h-9 md:w-9 rounded-full hover:bg-slate-100 flex items-center justify-center"
              >
                <X size={16} className="md:hidden" />
                <X size={18} className="hidden md:block" />
              </button>
            </div>

            {/* Toggle */}
            {(selected.staged || (selected.stagedVariants && selected.stagedVariants.length > 0)) && (
              <div className="flex justify-center gap-2 py-2">
                {["staged", "original"].map((type) => (
                  <button
                    key={type}
                    onClick={() => setView(type as any)}
                    className={`
                      px-3 py-1 text-xs md:px-4 md:py-1.5 md:text-sm
                      rounded-full border transition
                      ${view === type
                        ? "bg-emerald-600 text-white border-emerald-600"
                        : "bg-white text-slate-600 hover:bg-slate-100"
                      }
                    `}
                  >
                    {type}
                  </button>
                ))}
              </div>
            )}

            {view === "staged" && selected.stagedVariants && selected.stagedVariants.length > 0 && (
              <div className="px-4 md:px-5 pb-2">
                <p className="text-xs text-slate-500 mb-2">Variants</p>
                <div className="flex gap-2 overflow-x-auto">
                  {selected.stagedVariants.map((variant, idx) => (
                    <button
                      key={variant.id || `${variant.url}-${idx}`}
                      onClick={() => setSelectedVariantIdx(idx)}
                      className={`shrink-0 w-16 h-12 rounded border-2 overflow-hidden ${
                        idx === selectedVariantIdx ? "border-emerald-600" : "border-slate-200"
                      }`}
                    >
                      <Image
                        src={variant.url}
                        alt={`Variant ${idx + 1}`}
                        width={64}
                        height={48}
                        unoptimized
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Image */}
            <div className="flex-1 flex items-center justify-center bg-slate-50 px-3 py-2 md:p-4 overflow-auto">
              <Image
                src={activeImage.url}
                alt={activeImage.filename}
                width={1000}
                height={700}
                unoptimized
                className="
                  max-h-[45vh] sm:max-h-[60vh] md:max-h-[70vh]
                  w-auto object-contain rounded-lg
                "
              />
            </div>

            {/* Footer */}
            <div className="px-4 md:px-5 py-3 md:py-4 border-t flex justify-end gap-2 md:gap-3">
              <button
                onClick={() => setSelected(null)}
                className="px-3 py-1.5 md:px-5 md:py-2.5 text-xs md:text-sm border rounded-md md:rounded-lg hover:bg-slate-100"
              >
                Close
              </button>

              <button
                onClick={() =>
                  handleDownload(activeImage.url, activeImage.filename)
                }
                className="
                  flex items-center gap-2
                  px-4 py-1.5 md:px-5 md:py-2.5
                  text-xs md:text-sm font-semibold
                  bg-emerald-600 text-white
                  rounded-md md:rounded-lg
                  hover:bg-emerald-700
                "
              >
                <Download size={14} className="md:hidden" />
                <Download size={16} className="hidden md:block" />
                Download
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
