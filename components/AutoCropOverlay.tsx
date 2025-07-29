'use client';

import React, { useRef, useState, useEffect } from 'react';
import { Crop, RotateCcw, CheckCircle } from 'lucide-react';

interface AutoCropOverlayProps {
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob, boundingBox: any) => void;
  onCancel: () => void;
}

export default function AutoCropOverlay({ imageSrc, onCropComplete, onCancel }: AutoCropOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      autoDetectCard();
    }
  }, [imageSrc]);

  const autoDetectCard = async () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image
      ctx.drawImage(img, 0, 0);
      
      // Auto-detect card boundaries
      const detectedBox = detectCCCDCard(ctx, img.width, img.height);
      
      if (detectedBox) {
        setCropBox(detectedBox);
      } else {
        // Fallback: use center 80% of image
        const margin = Math.min(img.width, img.height) * 0.1;
        setCropBox({
          x: margin,
          y: margin,
          width: img.width - 2 * margin,
          height: img.height - 2 * margin
        });
      }
      
      setIsProcessing(false);
    };
    
    img.src = imageSrc;
  };

  const detectCCCDCard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    
    // Simple color-based detection for CCCD cards
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let cardPixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
        // CCCD cards typically have light blue/green background
        if (isCCCDColor(r, g, b)) {
          minX = Math.min(minX, x);
          minY = Math.min(minY, y);
          maxX = Math.max(maxX, x);
          maxY = Math.max(maxY, y);
          cardPixels++;
        }
      }
    }
    
    const totalPixels = width * height;
    const cardRatio = cardPixels / totalPixels;
    
    if (cardRatio > 0.15 && (maxX - minX) > width * 0.4 && (maxY - minY) > height * 0.4) {
      return {
        x: minX,
        y: minY,
        width: maxX - minX,
        height: maxY - minY
      };
    }
    
    return null;
  };

  const isCCCDColor = (r: number, g: number, b: number): boolean => {
    // CCCD cards have light blue/green background
    const isLight = r > 140 && g > 140 && b > 140;
    const isBlueGreen = g > r && g > b;
    const isNotTooBright = r < 240 && g < 240 && b < 240;
    
    return isLight && isBlueGreen && isNotTooBright;
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropBox) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // Check if click is inside crop box
    if (x >= cropBox.x && x <= cropBox.x + cropBox.width &&
        y >= cropBox.y && y <= cropBox.y + cropBox.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropBox.x, y: y - cropBox.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !cropBox) return;
    
    const rect = canvasRef.current!.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const newX = Math.max(0, Math.min(x - dragStart.x, rect.width - cropBox.width));
    const newY = Math.max(0, Math.min(y - dragStart.y, rect.height - cropBox.height));
    
    setCropBox({
      ...cropBox,
      x: newX,
      y: newY
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!cropBox || !canvasRef.current) return;
    
    const canvas = canvasRef.current;
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;
    
    croppedCanvas.width = cropBox.width;
    croppedCanvas.height = cropBox.height;
    
    croppedCtx.drawImage(
      canvas,
      cropBox.x, cropBox.y, cropBox.width, cropBox.height,
      0, 0, cropBox.width, cropBox.height
    );
    
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob, cropBox);
      }
    }, 'image/jpeg', 0.9);
  };

  const handleReset = () => {
    autoDetectCard();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h2 className="text-lg font-semibold">Auto-Crop CCCD Card</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleReset}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
            title="Reset Detection"
          >
            <RotateCcw size={16} />
          </button>
          <button
            onClick={onCancel}
            className="text-white text-lg font-medium"
          >
            Cancel
          </button>
        </div>
      </div>

      {/* Canvas Container */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative">
          <canvas
            ref={canvasRef}
            className="max-w-full max-h-full border border-white"
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
          />
          
          {/* Crop Box Overlay */}
          {cropBox && (
            <div
              className="absolute border-2 border-white border-dashed pointer-events-none"
              style={{
                left: cropBox.x,
                top: cropBox.y,
                width: cropBox.width,
                height: cropBox.height,
              }}
            >
              {/* Corner indicators */}
              <div className="absolute -top-1 -left-1 w-2 h-2 border-l-2 border-t-2 border-white"></div>
              <div className="absolute -top-1 -right-1 w-2 h-2 border-r-2 border-t-2 border-white"></div>
              <div className="absolute -bottom-1 -left-1 w-2 h-2 border-l-2 border-b-2 border-white"></div>
              <div className="absolute -bottom-1 -right-1 w-2 h-2 border-r-2 border-b-2 border-white"></div>
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="p-4 bg-black">
        <div className="flex items-center justify-center space-x-4">
          {isProcessing ? (
            <div className="flex items-center space-x-2 text-white">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Detecting CCCD card...</span>
            </div>
          ) : (
            <>
              <button
                onClick={handleCrop}
                className="flex items-center space-x-2 bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium"
              >
                <CheckCircle size={16} />
                <span>Crop & Continue</span>
              </button>
              <p className="text-sm text-gray-400">
                Drag to adjust crop area • CCCD card detected automatically
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 