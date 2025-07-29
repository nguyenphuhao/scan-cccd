'use client';

import React, { useRef, useState, useCallback } from 'react';
import Webcam from 'react-webcam';
import { Camera, RotateCcw, X } from 'lucide-react';

interface CameraCaptureProps {
  onImageCapture: (file: File) => void;
  onClose: () => void;
}

export default function CameraCapture({ onImageCapture, onClose }: CameraCaptureProps) {
  const webcamRef = useRef<Webcam>(null);
  const [facingMode, setFacingMode] = useState<'user' | 'environment'>('environment');
  const [isCapturing, setIsCapturing] = useState(false);

  const capture = useCallback(() => {
    if (webcamRef.current && !isCapturing) {
      setIsCapturing(true);
      
      try {
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
        } else {
          console.error('Failed to capture screenshot');
          setIsCapturing(false);
        }
      } catch (error) {
        console.error('Error during capture:', error);
        setIsCapturing(false);
      }
    }
  }, [onImageCapture, isCapturing]);

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
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
        >
          <X size={20} />
        </button>
        <h1 className="text-lg font-semibold">Scan CCCD Card</h1>
        <button
          onClick={switchCamera}
          className="p-2 rounded-full bg-gray-800 hover:bg-gray-700"
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
        
        {/* CCCD Frame Overlay */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          {/* Main CCCD Frame */}
          <div className="relative">
            {/* Card Frame */}
            <div className="border-4 border-white border-dashed rounded-lg w-80 h-48 relative">
              {/* Corner indicators */}
              <div className="absolute -top-2 -left-2 w-4 h-4 border-l-4 border-t-4 border-white"></div>
              <div className="absolute -top-2 -right-2 w-4 h-4 border-r-4 border-t-4 border-white"></div>
              <div className="absolute -bottom-2 -left-2 w-4 h-4 border-l-4 border-b-4 border-white"></div>
              <div className="absolute -bottom-2 -right-2 w-4 h-4 border-r-4 border-b-4 border-white"></div>
              
              {/* Center guide */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-white text-sm font-medium bg-black bg-opacity-50 px-2 py-1 rounded">
                  CCCD Card
                </div>
              </div>
            </div>
            
            {/* Instructions */}
            <div className="absolute -bottom-16 left-0 right-0 text-center text-white">
              <p className="text-sm bg-black bg-opacity-50 px-3 py-2 rounded">
                Position the card within the frame
              </p>
            </div>
          </div>
        </div>

        {/* Capture Button */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2">
          <button
            onClick={capture}
            disabled={isCapturing}
            className="w-20 h-20 bg-white rounded-full flex items-center justify-center disabled:opacity-50 shadow-lg"
          >
            {isCapturing ? (
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-800"></div>
            ) : (
              <Camera size={32} className="text-black" />
            )}
          </button>
        </div>

        {/* Status Message */}
        {isCapturing && (
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <div className="bg-black bg-opacity-75 text-white px-4 py-2 rounded-lg">
              Processing image...
            </div>
          </div>
        )}
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black text-white text-center">
        <p className="text-sm text-gray-300">
          Ensure the entire CCCD card is visible within the frame
        </p>
      </div>
    </div>
  );
} 