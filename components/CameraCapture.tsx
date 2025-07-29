'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onImageCapture, onClose }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current) {
      setIsCapturing(true);
      const imageSrc = webcamRef.current.getScreenshot();
      if (imageSrc) {
        // Convert base64 to file
        fetch(imageSrc)
          .then(res => res.blob())
          .then(blob => {
            const file = new File([blob], 'cccd-photo.jpg', { type: 'image/jpeg' });
            onImageCapture(file);
          })
          .catch(error => {
            console.error('Error capturing image:', error);
            setIsCapturing(false);
          });
      }
    }
  }, [onImageCapture]);

  const switchCamera = () => {
    setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
  };

  const videoConstraints = {
    width: { ideal: 1280 },
    height: { ideal: 720 },
    facingMode: facingMode,
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <button
          onClick={onClose}
          className="text-white text-lg font-medium"
        >
          Cancel
        </button>
        <h1 className="text-lg font-semibold">Take Photo</h1>
        <button
          onClick={switchCamera}
          className="p-2 rounded-full bg-gray-800"
        >
          <RotateCcw size={20} />
        </button>
      </div>

      {/* Camera View */}
      <div className="flex-1 relative">
        <Webcam
          ref={webcamRef}
          audio={false}
          screenshotFormat="image/jpeg"
          videoConstraints={videoConstraints}
          className="w-full h-full object-cover"
        />
        
        {/* Overlay for guidance */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <div className="border-2 border-white border-dashed rounded-lg w-80 h-48 opacity-50"></div>
        </div>
      </div>

      {/* Controls */}
      <div className="p-6 bg-black">
        <div className="flex justify-center">
          <button
            onClick={capture}
            disabled={isCapturing}
            className="w-16 h-16 bg-white rounded-full flex items-center justify-center disabled:opacity-50"
          >
            <Camera size={32} className="text-black" />
          </button>
        </div>
        
        {isCapturing && (
          <div className="text-center text-white mt-4">
            Processing image...
          </div>
        )}
      </div>
    </div>
  );
} 