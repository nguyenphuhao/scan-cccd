'use client';

import React, { useRef, useState, useEffect } from 'react';
import { QrCode, CheckCircle, AlertCircle, RotateCcw } from 'lucide-react';
import { enhancedQRScan } from '@/utils/qr-scanner';

interface QRScannerProps {
  imageSrc: string;
  onQRDetected: (qrData: string, boundingBox: any) => void;
  onNoQRFound: () => void;
  onCancel: () => void;
}

export default function QRScanner({ imageSrc, onQRDetected, onNoQRFound, onCancel }: QRScannerProps) {
  const [isScanning, setIsScanning] = useState(true);
  const [qrFound, setQrFound] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);

  useEffect(() => {
    scanForQR();
  }, [imageSrc]);

  const scanForQR = async () => {
    setIsScanning(true);
    setQrFound(false);
    setScanProgress(0);

    try {
      // Convert image src to file
      const response = await fetch(imageSrc);
      const blob = await response.blob();
      const file = new File([blob], 'cccd-image.jpg', { type: 'image/jpeg' });

      // Simulate progress
      const progressInterval = setInterval(() => {
        setScanProgress(prev => Math.min(prev + 10, 90));
      }, 200);

      // Scan for QR code
      const result = await enhancedQRScan(file);

      clearInterval(progressInterval);
      setScanProgress(100);

      if (result.success) {
        console.log('QR Code found:', result);
        setQrFound(true);
        setIsScanning(false);

        // Auto-proceed after showing QR detection
        setTimeout(() => {
          onQRDetected('QR_DATA_FOUND', null);
        }, 1500);
      } else {
        console.log('No QR code detected');
        setIsScanning(false);
        
        // Auto-proceed to "no QR found" after delay
        setTimeout(() => {
          onNoQRFound();
        }, 2000);
      }
    } catch (error) {
      console.error('QR scanning error:', error);
      setIsScanning(false);
      setTimeout(() => {
        onNoQRFound();
      }, 1000);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h2 className="text-lg font-semibold flex items-center">
          <QrCode size={20} className="mr-2" />
          Scanning QR Code
        </h2>
        <div className="flex items-center space-x-2">
          <button
            onClick={scanForQR}
            className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
            title="Rescan QR Code"
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

      {/* Scanner View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="relative max-w-full max-h-full">
          <img
            src={imageSrc}
            alt="CCCD for QR scanning"
            className="max-w-full max-h-full border border-white rounded-lg"
          />

          {/* Scanning Animation */}
          {isScanning && (
            <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-lg">
              <div className="text-white text-center">
                <div className="relative w-16 h-16 mx-auto mb-4">
                  <div className="absolute inset-0 border-4 border-white border-opacity-20 rounded-lg"></div>
                  <div 
                    className="absolute inset-0 border-4 border-t-white rounded-lg animate-spin"
                    style={{ borderTopWidth: '4px' }}
                  ></div>
                </div>
                <QrCode size={32} className="mx-auto mb-2 animate-pulse" />
                <p className="text-lg font-medium">Scanning for QR Code...</p>
                <p className="text-sm text-gray-300 mt-1">Looking for CCCD QR code</p>
                
                {/* Progress Bar */}
                <div className="w-48 bg-gray-700 rounded-full h-2 mt-4 mx-auto">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${scanProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-400 mt-2">{scanProgress}% complete</p>
              </div>
            </div>
          )}

          {/* Success Animation */}
          {qrFound && (
            <div className="absolute inset-0 flex items-center justify-center bg-green-900 bg-opacity-50 rounded-lg">
              <div className="text-white text-center">
                <CheckCircle size={48} className="mx-auto mb-4 text-green-400 animate-pulse" />
                <p className="text-lg font-medium">QR Code Detected!</p>
                <p className="text-sm text-gray-300 mt-1">Processing CCCD data...</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status */}
      <div className="p-4 bg-black">
        <div className="flex items-center justify-center space-x-4">
          {isScanning ? (
            <div className="flex items-center space-x-2 text-white">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Searching for QR code... ({scanProgress}%)</span>
            </div>
          ) : qrFound ? (
            <div className="flex items-center space-x-2 text-green-400">
              <CheckCircle size={16} />
              <span>QR Code detected! Processing data...</span>
            </div>
          ) : (
            <div className="flex items-center space-x-2 text-yellow-400">
              <AlertCircle size={16} />
              <span>No QR code found. Switching to OCR mode...</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
} 