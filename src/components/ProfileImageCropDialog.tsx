'use client';

import { useEffect, useRef, useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader } from 'lucide-react';

const PREVIEW_SIZE = 360;
const OUTPUT_SIZE = 512;

interface ProfileImageCropDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  sourceFile: File | null;
  uploading?: boolean;
  onConfirm: (croppedFile: File) => Promise<void> | void;
}

export function ProfileImageCropDialog({
  open,
  onOpenChange,
  sourceFile,
  uploading = false,
  onConfirm,
}: ProfileImageCropDialogProps) {
  const [bitmap, setBitmap] = useState<ImageBitmap | null>(null);
  const [naturalSize, setNaturalSize] = useState({ width: 0, height: 0 });
  const [offsetX, setOffsetX] = useState(0);
  const [offsetY, setOffsetY] = useState(0);
  const [isPreparing, setIsPreparing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [isImageLoading, setIsImageLoading] = useState(false);
  const [imageError, setImageError] = useState<string | null>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const dragStateRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    startOffsetX: number;
    startOffsetY: number;
  } | null>(null);

  const baseScale =
    naturalSize.width > 0 && naturalSize.height > 0
      ? Math.max(PREVIEW_SIZE / naturalSize.width, PREVIEW_SIZE / naturalSize.height)
      : 1;

  const drawWidth = naturalSize.width * baseScale;
  const drawHeight = naturalSize.height * baseScale;

  const maxOffsetX = Math.max(0, (drawWidth - PREVIEW_SIZE) / 2);
  const maxOffsetY = Math.max(0, (drawHeight - PREVIEW_SIZE) / 2);

  const clampOffset = (value: number, axis: 'x' | 'y') => {
    const limit = axis === 'x' ? maxOffsetX : maxOffsetY;
    return Math.max(-limit, Math.min(limit, value));
  };

  useEffect(() => {
    let isCancelled = false;

    if (!sourceFile) {
      setBitmap(null);
      setNaturalSize({ width: 0, height: 0 });
      setImageError(null);
      setIsImageLoading(false);
      return;
    }

    setIsImageLoading(true);
    setImageError(null);
    setBitmap(null);

    createImageBitmap(sourceFile)
      .then((nextBitmap) => {
        if (isCancelled) {
          nextBitmap.close();
          return;
        }

        setBitmap(nextBitmap);
        setNaturalSize({ width: nextBitmap.width, height: nextBitmap.height });
      })
      .catch(() => {
        if (isCancelled) return;
        setImageError('Unable to load this image file. Please choose another image.');
      })
      .finally(() => {
        if (isCancelled) return;
        setIsImageLoading(false);
      });

    return () => {
      isCancelled = true;
      setBitmap((previousBitmap) => {
        previousBitmap?.close();
        return null;
      });
    };
  }, [sourceFile]);

  useEffect(() => {
    return () => {
      setBitmap((previousBitmap) => {
        previousBitmap?.close();
        return null;
      });
    };
  }, []);

  useEffect(() => {
    const canvas = previewCanvasRef.current;
    if (!canvas) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    context.clearRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);
    context.fillStyle = '#f1f5f9';
    context.fillRect(0, 0, PREVIEW_SIZE, PREVIEW_SIZE);

    if (!bitmap || naturalSize.width <= 0 || naturalSize.height <= 0) {
      return;
    }

    const drawX = PREVIEW_SIZE / 2 + offsetX - drawWidth / 2;
    const drawY = PREVIEW_SIZE / 2 + offsetY - drawHeight / 2;

    context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
  }, [bitmap, naturalSize.width, naturalSize.height, baseScale, offsetX, offsetY]);

  useEffect(() => {
    if (naturalSize.width <= 0 || naturalSize.height <= 0) return;

    setOffsetX((current) => {
      const limit = maxOffsetX;
      return Math.max(-limit, Math.min(limit, current));
    });

    setOffsetY((current) => {
      const limit = maxOffsetY;
      return Math.max(-limit, Math.min(limit, current));
    });
  }, [maxOffsetX, maxOffsetY, naturalSize.width, naturalSize.height]);

  useEffect(() => {
    if (!open) {
      dragStateRef.current = null;
      setIsDragging(false);
    }
  }, [open]);

  const hasImage = Boolean(bitmap) && naturalSize.width > 0 && naturalSize.height > 0;

  const handlePointerDown = (event: React.PointerEvent<HTMLDivElement>) => {
    if (!hasImage) return;

    dragStateRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      startOffsetX: offsetX,
      startOffsetY: offsetY,
    };

    setIsDragging(true);
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const handlePointerMove = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    const deltaX = event.clientX - dragState.startX;
    const deltaY = event.clientY - dragState.startY;

    setOffsetX(clampOffset(dragState.startOffsetX + deltaX, 'x'));
    setOffsetY(clampOffset(dragState.startOffsetY + deltaY, 'y'));
  };

  const handlePointerUp = (event: React.PointerEvent<HTMLDivElement>) => {
    const dragState = dragStateRef.current;
    if (!dragState || dragState.pointerId !== event.pointerId) return;

    dragStateRef.current = null;
    setIsDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const createCroppedFile = async (): Promise<File | null> => {
    if (!bitmap || !sourceFile || naturalSize.width <= 0 || naturalSize.height <= 0) return null;

    const canvas = document.createElement('canvas');
    canvas.width = OUTPUT_SIZE;
    canvas.height = OUTPUT_SIZE;

    const context = canvas.getContext('2d');
    if (!context) return null;

    const outputScale = OUTPUT_SIZE / PREVIEW_SIZE;
    const drawWidth = naturalSize.width * baseScale * outputScale;
    const drawHeight = naturalSize.height * baseScale * outputScale;
    const centerX = OUTPUT_SIZE / 2 + offsetX * outputScale;
    const centerY = OUTPUT_SIZE / 2 + offsetY * outputScale;
    const drawX = centerX - drawWidth / 2;
    const drawY = centerY - drawHeight / 2;

    context.clearRect(0, 0, OUTPUT_SIZE, OUTPUT_SIZE);
    context.save();
    context.beginPath();
    context.arc(OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, OUTPUT_SIZE / 2, 0, Math.PI * 2);
    context.closePath();
    context.clip();
    context.drawImage(bitmap, drawX, drawY, drawWidth, drawHeight);
    context.restore();

    const blob = await new Promise<Blob | null>((resolve) => {
      canvas.toBlob((value) => resolve(value), 'image/png', 0.95);
    });

    if (!blob) return null;

    return new File([blob], `profile-${Date.now()}.png`, { type: 'image/png' });
  };

  const handleConfirm = async () => {
    try {
      setIsPreparing(true);
      const cropped = await createCroppedFile();
      if (!cropped) return;
      await onConfirm(cropped);
    } finally {
      setIsPreparing(false);
    }
  };

  const hasSourceFile = Boolean(sourceFile);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Adjust profile image</DialogTitle>
          <DialogDescription>
            Drag your image to adjust it inside the circle. The selected circular area will be used as your profile picture.
          </DialogDescription>
        </DialogHeader>

        {!hasSourceFile ? (
          <div className="rounded-lg border border-cream-200 bg-cream-50 p-4 text-sm text-cream-800/70">
            Select an image first.
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <div
                className={`relative overflow-hidden rounded-full border-4 border-brand-100 bg-cream-100 ${hasImage ? (isDragging ? 'cursor-grabbing' : 'cursor-grab') : 'cursor-default'}`}
                style={{ width: PREVIEW_SIZE, height: PREVIEW_SIZE }}
                onPointerDown={handlePointerDown}
                onPointerMove={handlePointerMove}
                onPointerUp={handlePointerUp}
                onPointerCancel={handlePointerUp}
              >
                <canvas
                  ref={previewCanvasRef}
                  width={PREVIEW_SIZE}
                  height={PREVIEW_SIZE}
                  className="block h-full w-full"
                />
                {isImageLoading && (
                  <div className="absolute inset-0 flex items-center justify-center bg-cream-100/70">
                    <Loader className="h-5 w-5 animate-spin text-brand-500" />
                  </div>
                )}
              </div>
            </div>

            {imageError ? (
              <p className="text-xs text-red-600 text-center">{imageError}</p>
            ) : (
              <p className="text-xs text-cream-800/50 text-center">Drag image to position inside the circle.</p>
            )}

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={uploading || isPreparing}>
                Cancel
              </Button>
              <Button onClick={handleConfirm} disabled={uploading || isPreparing || !hasImage || Boolean(imageError)}>
                {uploading || isPreparing ? <Loader className="mr-2 h-4 w-4 animate-spin" /> : null}
                Save profile image
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
