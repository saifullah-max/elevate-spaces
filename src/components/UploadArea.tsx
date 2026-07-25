import React from "react";
import { UploadCloud, X } from "lucide-react";
import { CustomStylingModal } from "@/components/CustomStylingModal";
import { RoomType, StagingStyle } from "@/lib/errors";

interface UploadAreaProps {
  limitReached: boolean;
  setFile: (file: File | null) => void;
  setFiles?: (files: File[]) => void;
  setStagedImageUrls: (urls: string[]) => void;
  setError: (err: string | null) => void;
  // Optional: lock style selection for guests/starter plans
  forceSameStyleForAll?: boolean;
  perImageSettings?: Array<{ roomType: RoomType | undefined; stagingStyle: StagingStyle | undefined; prompt?: string; areaType?: 'interior' | 'exterior' }>;
  setPerImageSettings?: React.Dispatch<React.SetStateAction<Array<{ roomType: RoomType | undefined; stagingStyle: StagingStyle | undefined; prompt?: string; areaType?: 'interior' | 'exterior' }>>>;
  areaType?: "interior" | "exterior";
  onApplyCustom?: () => void;
  onCustomStylingChange?: (enabled: boolean) => void;
  // Sync custom styling state with parent component (demo.tsx)
  enableCustomStyling?: boolean;
  onEnableCustomStylingChange?: (enabled: boolean) => void;
  imageDimensions?: Array<{ width: number; height: number }>;
  imageDimensionsRef?: React.MutableRefObject<Array<{ width: number; height: number }>>;
  customStylingModalOpen?: boolean;
  onCustomStylingModalChange?: (open: boolean) => void;
}

export function UploadArea({ limitReached, setFile, setFiles, setStagedImageUrls, setError, forceSameStyleForAll, perImageSettings, setPerImageSettings, areaType, onApplyCustom, onCustomStylingChange, enableCustomStyling, onEnableCustomStylingChange, imageDimensions, imageDimensionsRef, customStylingModalOpen = false, onCustomStylingModalChange }: UploadAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFilesLocal] = React.useState<File[]>([]);
  const [localPerImageSettings, setLocalPerImageSettings] = React.useState<Array<{ roomType: RoomType | undefined; stagingStyle: StagingStyle | undefined; prompt?: string; areaType?: 'interior' | 'exterior' }>>([]);
  const maxMultiImages = 15;

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const allowed = Math.max(0, maxMultiImages - selectedFiles.length);
      const sliced = newFiles.slice(0, allowed);
      const updatedFiles = [...selectedFiles, ...sliced];
      setSelectedFilesLocal(updatedFiles);
      setFiles?.(updatedFiles);
      setFile(updatedFiles[0] || null);
      setStagedImageUrls([]); // reset previous result
      setError(null);
    }
  };

  const handleModalFileAdd = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const allowed = Math.max(0, maxMultiImages - selectedFiles.length);
      const sliced = newFiles.slice(0, allowed);
      const updatedFiles = [...selectedFiles, ...sliced];
      setSelectedFilesLocal(updatedFiles);
      setFiles?.(updatedFiles);
      setFile(updatedFiles[0] || null);
      setStagedImageUrls([]); // reset previous result
      setError(null);
      // Reset the input
      if (modalFileInputRef.current) {
        modalFileInputRef.current.value = '';
      }
    }
  };

  const removeImage = (index: number) => {
    const updatedFiles = selectedFiles.filter((_, i) => i !== index);
    setSelectedFilesLocal(updatedFiles);
    setFiles?.(updatedFiles);
    if (updatedFiles.length > 0) {
      setFile(updatedFiles[0]);
    } else {
      setFile(null);
    }
    setStagedImageUrls([]); // reset previous result
    setError(null);
  };

  return (
    <>
      <div className="space-y-2">
        {selectedFiles.length > 0 && (
          <button
            onClick={() => onCustomStylingModalChange?.(true)}
            className="text-sm text-brand-500 hover:text-brand-600 font-semibold transition"
          >
            View all uploaded images ({selectedFiles.length}/15)
          </button>
        )}

        <div
          data-meta-event="upload-photo"
          onClick={limitReached ? undefined : handleDivClick}
          className={`border-2 border-dashed border-cream-200 rounded-lg p-6 text-center ${limitReached
            ? "cursor-not-allowed opacity-60"
            : "cursor-pointer hover:border-brand-500"
            } bg-white transition-colors group`}
        >
          <UploadCloud className="w-8 h-8 mx-auto text-cream-800/40 mb-2 group-hover:text-brand-500 transition-colors" />
          <span className="text-xs text-cream-800/70 font-medium block">
            {limitReached ? "Demo Limit Reached" : "Click to Upload"}
          </span>
          <span className="text-[10px] text-cream-800/40 block mt-1">
            JPG/PNG, single or multiple
          </span>

          <input
            type="file"
            ref={fileInputRef}
            className="hidden"
            accept="image/jpeg,image/png"
            multiple
            onChange={handleFileChange}
            disabled={limitReached}
          />
        </div>
      </div>

      {/* MODAL: View & Manage Uploaded Images */}
      {customStylingModalOpen && (
        <CustomStylingModal
          isOpen={true}
          onClose={() => onCustomStylingModalChange?.(false)}
          selectedFiles={selectedFiles}
          perImageSettings={(perImageSettings || localPerImageSettings) as any}
          setPerImageSettings={(setPerImageSettings || setLocalPerImageSettings) as any}
          areaType={(areaType || "interior") as any}
          enableCustomStyling={enableCustomStyling}
          onEnableCustomStylingChange={onEnableCustomStylingChange}
          onApply={() => {
            onCustomStylingModalChange?.(false);
            onApplyCustom?.();
          }}
          onCustomStylingChange={(enabled) => onCustomStylingChange?.(enabled)}
          onRemoveFile={(index) => {
            const updatedFiles = selectedFiles.filter((_, i) => i !== index);
            setSelectedFilesLocal(updatedFiles);
            setFiles?.(updatedFiles);
            setFile(updatedFiles[0] || null);
            setStagedImageUrls([]);
            setError(null);

            if (setPerImageSettings) {
              setPerImageSettings((previous) => previous.filter((_, i) => i !== index));
            }
          }}
          onAddFiles={() => modalFileInputRef.current?.click()}
          forceSameStyleForAll={forceSameStyleForAll}
          imageDimensions={imageDimensions}
          imageDimensionsRef={imageDimensionsRef}
        />
      )}

      <input
        type="file"
        ref={modalFileInputRef}
        className="hidden"
        accept="image/jpeg,image/png"
        multiple
        onChange={handleModalFileAdd}
        disabled={limitReached}
      />
    </>
  );
}
