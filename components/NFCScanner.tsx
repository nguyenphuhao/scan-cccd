'use client';

import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertCircle, CheckCircle, X } from 'lucide-react';
import { nfcReader } from '@/utils/nfc-reader';

interface NFCScannerProps {
  onNFCDetected: (data: any) => void;
  onNFCFailed: (error: string) => void;
  onCancel: () => void;
}

export default function NFCScanner({ onNFCDetected, onNFCFailed, onCancel }: NFCScannerProps) {
  const [isScanning, setIsScanning] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [scanProgress, setScanProgress] = useState(0);
  const [status, setStatus] = useState<'checking' | 'ready' | 'scanning' | 'success' | 'error'>('checking');

  useEffect(() => {
    checkNFCSupport();
    return () => {
      nfcReader.stopReading();
    };
  }, []);

  const checkNFCSupport = async () => {
    const supported = nfcReader.isNFCSupported();
    setIsSupported(supported);
    
    if (supported) {
      const hasPermission = await nfcReader.requestPermission();
      if (hasPermission) {
        setStatus('ready');
        startScanning();
      } else {
        setStatus('error');
        onNFCFailed('NFC permission denied. Please enable NFC in your device settings.');
      }
    } else {
      setStatus('error');
      onNFCFailed('NFC is not supported on this device.');
    }
  };

  const startScanning = async () => {
    setIsScanning(true);
    setStatus('scanning');
    setScanProgress(0);

    // Animate progress
    const progressInterval = setInterval(() => {
      setScanProgress(prev => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        return prev + 2;
      });
    }, 300);

    try {
      const result = await nfcReader.startReading();
      clearInterval(progressInterval);
      
      if (result.success) {
        setStatus('success');
        setScanProgress(100);
        setTimeout(() => {
          onNFCDetected(result.data);
        }, 1000);
      } else {
        setStatus('error');
        onNFCFailed(result.error || 'NFC reading failed');
      }
    } catch (error) {
      clearInterval(progressInterval);
      setStatus('error');
      onNFCFailed('NFC scanning error occurred');
    } finally {
      setIsScanning(false);
    }
  };

  const handleCancel = () => {
    nfcReader.stopReading();
    onCancel();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-75 z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-black text-white">
        <h2 className="text-lg font-semibold flex items-center">
          <Wifi size={20} className="mr-2" />
          NFC Scanner
        </h2>
        <button
          onClick={handleCancel}
          className="p-2 rounded-lg bg-gray-800 hover:bg-gray-700"
        >
          <X size={16} />
        </button>
      </div>

      {/* Scanner View */}
      <div className="flex-1 flex items-center justify-center p-4">
        <div className="text-center text-white max-w-sm">
          {status === 'checking' && (
            <>
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-white mx-auto mb-4"></div>
              <h3 className="text-xl font-semibold mb-2">Checking NFC Support</h3>
              <p className="text-gray-300">Verifying device capabilities...</p>
            </>
          )}

          {status === 'ready' && (
            <>
              <Wifi size={64} className="mx-auto mb-4 text-blue-400" />
              <h3 className="text-xl font-semibold mb-2">NFC Ready</h3>
              <p className="text-gray-300">Preparing to scan CCCD card...</p>
            </>
          )}

          {status === 'scanning' && (
            <>
              <div className="relative w-24 h-24 mx-auto mb-4">
                <div className="absolute inset-0 rounded-full border-4 border-gray-600"></div>
                <div 
                  className="absolute inset-0 rounded-full border-4 border-blue-400 border-t-transparent animate-spin"
                ></div>
                <Wifi size={32} className="absolute inset-0 m-auto text-blue-400 animate-pulse" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Scanning for NFC</h3>
              <p className="text-gray-300 mb-4">Hold your CCCD card close to the device</p>
              
              {/* Progress Bar */}
              <div className="w-full bg-gray-700 rounded-full h-2 mb-2">
                <div 
                  className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.min(scanProgress, 100)}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-400">{Math.min(scanProgress, 100)}% - Keep card close</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle size={64} className="mx-auto mb-4 text-green-400" />
              <h3 className="text-xl font-semibold mb-2">NFC Data Detected!</h3>
              <p className="text-gray-300">Processing CCCD information...</p>
            </>
          )}

          {status === 'error' && (
            <>
              <WifiOff size={64} className="mx-auto mb-4 text-red-400" />
              <h3 className="text-xl font-semibold mb-2">NFC Not Available</h3>
              <p className="text-gray-300 mb-4">This device doesn't support NFC or it's disabled</p>
              <div className="bg-red-900 bg-opacity-50 rounded-lg p-4 text-left">
                <h4 className="font-medium mb-2">To use NFC scanning:</h4>
                <ul className="text-sm space-y-1">
                  <li>• Enable NFC in device settings</li>
                  <li>• Use a modern Android device (Chrome 89+)</li>
                  <li>• Ensure your CCCD has NFC capability</li>
                  <li>• Use QR scanning as alternative</li>
                </ul>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Instructions */}
      <div className="p-4 bg-black border-t border-gray-800">
        <div className="text-center text-gray-300">
          {status === 'scanning' ? (
            <p className="text-sm">
              📱 Hold the CCCD card against the back of your phone
            </p>
          ) : status === 'ready' ? (
            <p className="text-sm">
              NFC scanning provides instant, accurate data extraction
            </p>
          ) : (
            <p className="text-sm">
              NFC scanning is only available on supported devices
            </p>
          )}
        </div>
      </div>
    </div>
  );
} 