import React from "react";
import { UploadCloud } from "lucide-react";

interface UploadAreaProps {
  limitReached: boolean;
  setFile: (file: File | null) => void;
  setStagedImageUrls: (urls: string[]) => void;
  setError: (err: string | null) => void;
}

export function UploadArea({ limitReached, setFile, setStagedImageUrls, setError }: UploadAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files[0]) {
      const selectedFile = files[0];
      setFile(selectedFile);
      setStagedImageUrls([]); // reset previous result
      setError(null);
    }
  };

  return (
    <div
      onClick={limitReached ? undefined : handleDivClick}
      className={`border-2 border-dashed border-slate-300 rounded-lg p-6 text-center ${limitReached
        ? "cursor-not-allowed opacity-60"
        : "cursor-pointer hover:border-indigo-500"
        } bg-white transition-colors group`}
    >
      <UploadCloud className="w-8 h-8 mx-auto text-slate-400 mb-2 group-hover:text-indigo-500 transition-colors" />
      <span className="text-xs text-slate-600 font-medium block">
        {limitReached ? "Demo Limit Reached" : "Click to Upload"}
      </span>
      <span className="text-[10px] text-slate-400 block mt-1">
        Single JPG/PNG
      </span>

      <input
        type="file"
        ref={fileInputRef}
        className="hidden"
        accept="image/jpeg,image/png"
        onChange={handleFileChange}
        disabled={limitReached}
      />
    </div>
  );
}
