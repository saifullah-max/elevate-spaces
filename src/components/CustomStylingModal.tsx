"use client";

import React, { useState } from "react";
import { X } from "lucide-react";
import { RoomType, StagingStyle } from "@/lib/errors";
import { exteriorOptions, interiorOptions, stagingStyles } from "./data/dropdown";

interface CustomStylingModalProps {
  isOpen: boolean;
  onClose: () => void;
  selectedFiles: File[];
  perImageSettings: Array<{
    roomType: RoomType | undefined;
    stagingStyle: StagingStyle | undefined;
  }>;
  setPerImageSettings: (settings: Array<{
    roomType: RoomType | undefined;
    stagingStyle: StagingStyle | undefined;
  }>) => void;
  areaType: "interior" | "exterior";
  onApply: () => void;
}

export function CustomStylingModal({
  isOpen,
  onClose,
  selectedFiles,
  perImageSettings,
  setPerImageSettings,
  areaType,
  onApply,
}: CustomStylingModalProps) {
  const [applySameStyleForAll, setApplySameStyleForAll] = useState(true);

  if (!isOpen) return null;

  const options = areaType === "interior" ? interiorOptions : exteriorOptions;

  const handleRoomTypeChange = (index: number, value: RoomType | undefined) => {
    const newSettings = [...perImageSettings];
    newSettings[index] = { ...newSettings[index], roomType: value };
    setPerImageSettings(newSettings);
  };

  const handleStagingStyleChange = (index: number, value: StagingStyle | undefined) => {
    const newSettings = [...perImageSettings];
    if (applySameStyleForAll) {
      // Apply same style to all images
      newSettings.forEach((_, i) => {
        newSettings[i] = { ...newSettings[i], stagingStyle: value };
      });
    } else {
      // Apply only to this image
      newSettings[index] = { ...newSettings[index], stagingStyle: value };
    }
    setPerImageSettings(newSettings);
  };

  return (
    <div className="fixed inset-0 bg-black/50 bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-center">
          <h2 className="text-2xl font-bold">Customize Each Image</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {/* Apply Same Style for All Checkbox */}
          {areaType === "interior" && (
            <div className="mb-6 pb-6 border-b">
              <label className="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={applySameStyleForAll}
                  onChange={(e) => setApplySameStyleForAll(e.target.checked)}
                  className="w-4 h-4 rounded"
                />
                <span className="text-sm font-semibold text-slate-700">
                  Apply same styling style for all images
                </span>
              </label>
            </div>
          )}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {selectedFiles.map((file, index) => (
              <div
                key={index}
                className="border rounded-lg p-4 bg-gray-50"
              >
                {/* Image Preview */}
                <div className="mb-4">
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Image ${index + 1}`}
                    className="w-full h-48 object-cover rounded-lg"
                  />
                  <p className="text-sm text-gray-600 mt-2">
                    Image {index + 1} of {selectedFiles.length}
                  </p>
                </div>

                {/* Room Type Dropdown */}
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    {areaType === "interior" ? "Room Type" : "Area Type"}
                  </label>
                  <select
                    value={perImageSettings[index]?.roomType || ""}
                    onChange={(e) =>
                      handleRoomTypeChange(index, e.target.value as RoomType)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select {areaType === "interior" ? "Room" : "Area"}...</option>
                    {options.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Staging Style Dropdown */}
                {areaType === "interior" && (!applySameStyleForAll || index === 0) && (
                  <div className="mb-4">
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Staging Style {applySameStyleForAll && index === 0 ? "(applies to all)" : ""}
                    </label>
                    <select
                      value={perImageSettings[index]?.stagingStyle || ""}
                      onChange={(e) =>
                        handleStagingStyleChange(index, e.target.value as StagingStyle)
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select Style...</option>
                      {stagingStyles.map((style) => (
                        <option key={style.value} value={style.value}>
                          {style.label}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 bg-gray-50 border-t p-6 flex justify-end gap-4">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-100"
          >
            Cancel
          </button>
          <button
            onClick={onApply}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Apply Custom Styling
          </button>
        </div>
      </div>
    </div>
  );
}
