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
  const containerRef = useRef<HTMLDivElement>(null);
  const [isProcessing, setIsProcessing] = useState(true);
  const [cropBox, setCropBox] = useState<{ x: number; y: number; width: number; height: number } | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isResizing, setIsResizing] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [resizeHandle, setResizeHandle] = useState<string>('');
  const [imageScale, setImageScale] = useState(1);
  const [imageOffset, setImageOffset] = useState({ x: 0, y: 0 });

  useEffect(() => {
    if (canvasRef.current) {
      autoDetectCard();
    }
  }, [imageSrc]);

  const autoDetectCard = async () => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Calculate scale to fit image in container
      const containerWidth = container.clientWidth;
      const containerHeight = container.clientHeight;
      const scaleX = containerWidth / img.width;
      const scaleY = containerHeight / img.height;
      const scale = Math.min(scaleX, scaleY, 1); // Don't scale up
      
      setImageScale(scale);
      
      // Calculate image position (centered)
      const scaledWidth = img.width * scale;
      const scaledHeight = img.height * scale;
      const offsetX = (containerWidth - scaledWidth) / 2;
      const offsetY = (containerHeight - scaledHeight) / 2;
      
      setImageOffset({ x: offsetX, y: offsetY });
      
      // Set canvas size to actual image size for processing
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Auto-detect card boundaries (in original image coordinates)
      const detectedBox = detectCCCDCard(ctx, img.width, img.height);
      
      if (detectedBox) {
        // Convert to display coordinates
        setCropBox({
          x: detectedBox.x * scale + offsetX,
          y: detectedBox.y * scale + offsetY,
          width: detectedBox.width * scale,
          height: detectedBox.height * scale
        });
      } else {
        // Fallback: use center 80% of displayed image
        const margin = Math.min(scaledWidth, scaledHeight) * 0.1;
        setCropBox({
          x: offsetX + margin,
          y: offsetY + margin,
          width: scaledWidth - 2 * margin,
          height: scaledHeight - 2 * margin
        });
      }
      
      setIsProcessing(false);
    };
    
    img.src = imageSrc;
  };

  const detectCCCDCard = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    const imageData = ctx.getImageData(0, 0, width, height);
    const { data } = imageData;
    
    let minX = width, minY = height, maxX = 0, maxY = 0;
    let cardPixels = 0;
    
    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const idx = (y * width + x) * 4;
        const r = data[idx];
        const g = data[idx + 1];
        const b = data[idx + 2];
        
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
    const isLight = r > 140 && g > 140 && b > 140;
    const isBlueGreen = g > r && g > b;
    const isNotTooBright = r < 240 && g < 240 && b < 240;
    
    return isLight && isBlueGreen && isNotTooBright;
  };

  const getMousePosition = (e: React.MouseEvent) => {
    const container = containerRef.current!;
    const rect = container.getBoundingClientRect();
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top
    };
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!cropBox) return;
    
    const { x, y } = getMousePosition(e);
    
    // Check if clicking on resize handles
    const handleSize = 10;
    const handles = [
      { name: 'nw', x: cropBox.x, y: cropBox.y },
      { name: 'ne', x: cropBox.x + cropBox.width, y: cropBox.y },
      { name: 'sw', x: cropBox.x, y: cropBox.y + cropBox.height },
      { name: 'se', x: cropBox.x + cropBox.width, y: cropBox.y + cropBox.height },
    ];
    
    for (const handle of handles) {
      if (Math.abs(x - handle.x) <= handleSize && Math.abs(y - handle.y) <= handleSize) {
        setIsResizing(true);
        setResizeHandle(handle.name);
        setDragStart({ x, y });
        return;
      }
    }
    
    // Check if clicking inside crop box for dragging
    if (x >= cropBox.x && x <= cropBox.x + cropBox.width &&
        y >= cropBox.y && y <= cropBox.y + cropBox.height) {
      setIsDragging(true);
      setDragStart({ x: x - cropBox.x, y: y - cropBox.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!cropBox) return;
    
    const { x, y } = getMousePosition(e);
    
    if (isResizing) {
      const deltaX = x - dragStart.x;
      const deltaY = y - dragStart.y;
      
      let newBox = { ...cropBox };
      
      switch (resizeHandle) {
        case 'nw':
          newBox.x = Math.max(imageOffset.x, cropBox.x + deltaX);
          newBox.y = Math.max(imageOffset.y, cropBox.y + deltaY);
          newBox.width = cropBox.width - deltaX;
          newBox.height = cropBox.height - deltaY;
          break;
        case 'ne':
          newBox.y = Math.max(imageOffset.y, cropBox.y + deltaY);
          newBox.width = Math.max(50, cropBox.width + deltaX);
          newBox.height = cropBox.height - deltaY;
          break;
        case 'sw':
          newBox.x = Math.max(imageOffset.x, cropBox.x + deltaX);
          newBox.width = cropBox.width - deltaX;
          newBox.height = Math.max(50, cropBox.height + deltaY);
          break;
        case 'se':
          newBox.width = Math.max(50, cropBox.width + deltaX);
          newBox.height = Math.max(50, cropBox.height + deltaY);
          break;
      }
      
      // Ensure crop box stays within image bounds
      const maxX = imageOffset.x + (canvasRef.current!.width * imageScale);
      const maxY = imageOffset.y + (canvasRef.current!.height * imageScale);
      
      newBox.width = Math.min(newBox.width, maxX - newBox.x);
      newBox.height = Math.min(newBox.height, maxY - newBox.y);
      newBox.width = Math.max(50, newBox.width);
      newBox.height = Math.max(50, newBox.height);
      
      setCropBox(newBox);
      setDragStart({ x, y });
    } else if (isDragging) {
      const newX = x - dragStart.x;
      const newY = y - dragStart.y;
      
      // Constrain to image bounds
      const maxX = imageOffset.x + (canvasRef.current!.width * imageScale) - cropBox.width;
      const maxY = imageOffset.y + (canvasRef.current!.height * imageScale) - cropBox.height;
      
      setCropBox({
        ...cropBox,
        x: Math.max(imageOffset.x, Math.min(newX, maxX)),
        y: Math.max(imageOffset.y, Math.min(newY, maxY))
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
    setIsResizing(false);
    setResizeHandle('');
  };

  const handleCrop = () => {
    if (!cropBox || !canvasRef.current) return;
    
    // Convert display coordinates back to original image coordinates
    const originalX = (cropBox.x - imageOffset.x) / imageScale;
    const originalY = (cropBox.y - imageOffset.y) / imageScale;
    const originalWidth = cropBox.width / imageScale;
    const originalHeight = cropBox.height / imageScale;
    
    const canvas = canvasRef.current;
    const croppedCanvas = document.createElement('canvas');
    const croppedCtx = croppedCanvas.getContext('2d')!;
    
    croppedCanvas.width = originalWidth;
    croppedCanvas.height = originalHeight;
    
    croppedCtx.drawImage(
      canvas,
      originalX, originalY, originalWidth, originalHeight,
      0, 0, originalWidth, originalHeight
    );
    
    croppedCanvas.toBlob((blob) => {
      if (blob) {
        onCropComplete(blob, {
          x: originalX,
          y: originalY,
          width: originalWidth,
          height: originalHeight
        });
      }
    }, 'image/jpeg', 0.9);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h2 className="text-lg font-semibold">Auto-Crop CCCD Card</h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={autoDetectCard}
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

      {/* Image Container */}
      <div className="flex-1 p-4">
        <div 
          ref={containerRef}
          className="relative w-full h-full bg-gray-900 rounded-lg overflow-hidden"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          style={{ cursor: isDragging ? 'grabbing' : isResizing ? 'nwse-resize' : 'grab' }}
        >
          {/* Hidden canvas for processing */}
          <canvas ref={canvasRef} className="hidden" />
          
          {/* Display image */}
          <img
            src={imageSrc}
            alt="CCCD"
            className="absolute pointer-events-none"
            style={{
              left: imageOffset.x,
              top: imageOffset.y,
              width: canvasRef.current ? canvasRef.current.width * imageScale : 'auto',
              height: canvasRef.current ? canvasRef.current.height * imageScale : 'auto',
            }}
          />
          
          {/* Crop Box */}
          {cropBox && (
            <>
              {/* Crop overlay */}
              <div
                className="absolute border-2 border-white border-dashed bg-transparent pointer-events-none"
                style={{
                  left: cropBox.x,
                  top: cropBox.y,
                  width: cropBox.width,
                  height: cropBox.height,
                }}
              />
              
              {/* Resize handles */}
              {[
                { name: 'nw', x: cropBox.x - 5, y: cropBox.y - 5 },
                { name: 'ne', x: cropBox.x + cropBox.width - 5, y: cropBox.y - 5 },
                { name: 'sw', x: cropBox.x - 5, y: cropBox.y + cropBox.height - 5 },
                { name: 'se', x: cropBox.x + cropBox.width - 5, y: cropBox.y + cropBox.height - 5 },
              ].map((handle) => (
                <div
                  key={handle.name}
                  className="absolute w-3 h-3 bg-white border border-gray-400 cursor-nwse-resize"
                  style={{
                    left: handle.x,
                    top: handle.y,
                  }}
                />
              ))}
            </>
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
                Drag to move • Drag corners to resize • Auto-detected CCCD area
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  );
} 