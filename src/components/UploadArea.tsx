import React from "react";
import { UploadCloud, X } from "lucide-react";

interface UploadAreaProps {
  limitReached: boolean;
  setFile: (file: File | null) => void;
  setFiles?: (files: File[]) => void;
  setStagedImageUrls: (urls: string[]) => void;
  setError: (err: string | null) => void;
}

export function UploadArea({ limitReached, setFile, setFiles, setStagedImageUrls, setError }: UploadAreaProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const modalFileInputRef = React.useRef<HTMLInputElement>(null);
  const [selectedFiles, setSelectedFilesLocal] = React.useState<File[]>([]);
  const [showModal, setShowModal] = React.useState(false);

  const handleDivClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files && files.length > 0) {
      const newFiles = Array.from(files);
      const updatedFiles = [...selectedFiles, ...newFiles];
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
      const updatedFiles = [...selectedFiles, ...newFiles];
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
            onClick={() => setShowModal(true)}
            className="text-sm text-indigo-600 hover:text-indigo-700 font-semibold transition"
          >
            View all uploaded images ({selectedFiles.length})
          </button>
        )}

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
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-slate-900">Uploaded Images ({selectedFiles.length})</h2>
              <button
                onClick={() => setShowModal(false)}
                className="p-1 hover:bg-slate-100 rounded-lg transition"
              >
                <X className="w-6 h-6 text-slate-600" />
              </button>
            </div>

            {/* Images Grid */}
            {selectedFiles.length > 0 && (
              <div className="mb-6">
                <p className="text-sm text-slate-600 mb-3 font-semibold">Your selected photos:</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {selectedFiles.map((file, index) => (
                    <div key={index} className="relative group">
                      <img
                        src={URL.createObjectURL(file)}
                        alt={`Upload ${index + 1}`}
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                      <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition rounded-lg flex items-center justify-center">
                        <button
                          onClick={() => removeImage(index)}
                          className="opacity-0 group-hover:opacity-100 p-2 bg-red-600 text-white rounded-full hover:bg-red-700 transition"
                          title="Remove image"
                        >
                          <X className="w-5 h-5" />
                        </button>
                      </div>
                      <span className="absolute top-1 left-1 bg-indigo-600 text-white text-xs font-bold px-2 py-1 rounded">
                        {index + 1}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Add More Photos Section */}
            <div className="border-t border-slate-200 pt-4">
              <p className="text-sm text-slate-600 mb-3 font-semibold">Add more photos:</p>
              <div
                onClick={() => modalFileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-300 rounded-lg p-4 text-center cursor-pointer hover:border-indigo-500 transition group"
              >
                <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1 group-hover:text-indigo-500 transition-colors" />
                <span className="text-xs text-slate-600 font-medium block">
                  Click to add more photos
                </span>
              </div>
              <input
                type="file"
                ref={modalFileInputRef}
                className="hidden"
                accept="image/jpeg,image/png"
                multiple
                onChange={handleModalFileAdd}
              />
            </div>

            {/* Close Button */}
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 bg-indigo-600 text-white font-semibold rounded-lg hover:bg-indigo-700 transition"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
