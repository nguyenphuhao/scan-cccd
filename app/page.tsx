'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Edit, Save, RotateCcw, CheckCircle, AlertCircle, QrCode, Wifi } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import CCCDForm from '@/components/CCCDForm';
import Footer from '@/components/Footer';
import NFCScanner from '@/components/NFCScanner';
import { enhancedQRScan } from '@/utils/qr-scanner';
import { nfcReader } from '@/utils/nfc-reader';
import { CCCDData, ScanResult } from '@/types/cccd';

export default function Home() {
  const [showCamera, setShowCamera] = useState(false);
  const [showNFCScanner, setShowNFCScanner] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [scanMethod, setScanMethod] = useState<'nfc' | 'qr'>('nfc');
  const [qrDebugData, setQrDebugData] = useState<string>('');
  const [isNFCSupported, setIsNFCSupported] = useState(false);
  const [formData, setFormData] = useState<CCCDData>({
    cardNumber: '',
    fullName: '',
    dateOfBirth: '',
    sex: '',
    nationality: '',
    placeOfOrigin: '',
    placeOfResidence: '',
    dateOfExpiry: '',
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    // Check NFC support on component mount
    setIsNFCSupported(nfcReader.isNFCSupported());
  }, []);

  const handleNFCScan = () => {
    setScanMethod('nfc');
    setShowNFCScanner(true);
  };

  const handleNFCDetected = (data: CCCDData) => {
    setShowNFCScanner(false);
    setScanResult({
      success: true,
      data: data,
      confidence: 0.99,
    });
    setFormData(data);
    console.log('NFC scan successful:', data);
  };

  const handleNFCFailed = (error: string) => {
    setShowNFCScanner(false);
    setScanResult({
      success: false,
      error: error,
    });
    console.log('NFC scan failed:', error);
  };

  const handleImageCapture = async (file: File) => {
    setShowCamera(false);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCapturedImage(previewUrl);
    
    // Start QR scanning
    await processImageWithQR(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCapturedImage(previewUrl);
      
      // Start QR scanning
      await processImageWithQR(file);
    }
  };

  const processImageWithQR = async (file: File) => {
    setIsScanning(true);
    setScanMethod('qr');
    setQrDebugData('');
    
    try {
      console.log('Starting QR scan...');
      
      // Override console.log to capture QR scanning logs
      const originalLog = console.log;
      const qrCapturedLogs: string[] = [];
      console.log = (...args) => {
        qrCapturedLogs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      // Try QR code scanning
      const qrResult = await enhancedQRScan(file);
      
      // Restore console.log
      console.log = originalLog;
      
      // Extract QR debug information
      const qrDebugInfo = qrCapturedLogs.join('\n');
      setQrDebugData(qrDebugInfo);
      
      if (qrResult.success && qrResult.data) {
        console.log('QR code scan successful:', qrResult.data);
        setScanResult(qrResult);
        setFormData(qrResult.data);
      } else {
        console.log('No QR code found');
        setScanResult({
          success: false,
          error: 'No QR code detected on the CCCD card. Please ensure the QR code is clearly visible and try again.',
        });
      }
    } catch (error) {
      console.error('QR scanning failed:', error);
      setQrDebugData(`QR Scan Error: ${error}`);
      setScanResult({
        success: false,
        error: 'QR code scanning failed. Please try again with a clearer image.',
      });
    } finally {
      setIsScanning(false);
    }
  };

  const handleFormChange = (field: keyof CCCDData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = () => {
    setIsEditing(false);
    console.log('Saving CCCD data:', formData);
  };

  const resetForm = () => {
    setFormData({
      cardNumber: '',
      fullName: '',
      dateOfBirth: '',
      sex: '',
      nationality: '',
      placeOfOrigin: '',
      placeOfResidence: '',
      dateOfExpiry: '',
    });
    setScanResult(null);
    setIsEditing(false);
    setCapturedImage(null);
    setQrDebugData('');
    setScanMethod('nfc');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 flex items-center justify-center">
                <Wifi size={24} className="mr-2 text-blue-600" />
                <QrCode size={24} className="mr-2 text-green-600" />
                CCCD Scanner
              </h1>
              <p className="text-sm text-gray-600">
                NFC & QR Code Scanner for Vietnamese ID Cards
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto p-4 w-full">
        {/* Scan Options */}
        {!scanResult?.success && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Choose Scanning Method
            </h2>
            
            <div className="space-y-4">
              {/* NFC Button */}
              {isNFCSupported ? (
                <button
                  onClick={handleNFCScan}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Wifi size={20} />
                  <span>Scan with NFC</span>
                  <span className="bg-blue-500 text-xs px-2 py-1 rounded">RECOMMENDED</span>
                </button>
              ) : (
                <div className="w-full bg-gray-300 text-gray-500 font-medium py-4 px-6 rounded-lg flex items-center justify-center space-x-2">
                  <Wifi size={20} />
                  <span>NFC Not Supported</span>
                </div>
              )}

              {/* QR Code Options */}
              <div className="space-y-2">
                <button
                  onClick={() => setShowCamera(true)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Camera size={20} />
                  <span>Take Photo (QR)</span>
                </button>

                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-3 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
                >
                  <Upload size={20} />
                  <span>Upload Image (QR)</span>
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Instructions */}
            <div className="mt-6 space-y-4">
              {isNFCSupported && (
                <div className="p-4 bg-blue-50 rounded-lg">
                  <h3 className="font-medium text-blue-900 mb-2 flex items-center">
                    <Wifi size={16} className="mr-2" />
                    NFC Scanning (Recommended):
                  </h3>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• ✨ Instant wireless scanning</li>
                    <li>• 🎯 99.9% accuracy</li>
                    <li>• 📱 Just tap your card to the phone</li>
                    <li>• 🔒 Secure and fast</li>
                  </ul>
                </div>
              )}
              
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2 flex items-center">
                  <QrCode size={16} className="mr-2" />
                  QR Code Scanning:
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 📸 Take photo or upload image</li>
                  <li>• 🎯 99% accuracy with QR codes</li>
                  <li>• 💡 Ensure good lighting</li>
                  <li>• 📋 Works with newer CCCD cards</li>
                </ul>
              </div>
            </div>
          </div>
        )}

        {/* Image Preview */}
        {capturedImage && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3 flex items-center">
              <QrCode size={20} className="mr-2 text-blue-600" />
              QR Code Scanning
            </h3>
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="CCCD Image" 
                className="w-full h-48 object-cover rounded-lg border"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="relative w-12 h-12 mx-auto mb-3">
                      <QrCode size={48} className="animate-pulse" />
                      <div className="absolute inset-0 border-2 border-white border-dashed animate-ping"></div>
                    </div>
                    <p className="font-medium">Scanning QR Code...</p>
                    <p className="text-sm text-gray-300">
                      Looking for CCCD QR code data
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Success Indicator */}
        {scanResult?.success && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <div className="flex items-center justify-center space-x-2">
              <QrCode size={16} className="text-green-600" />
              <CheckCircle size={16} className="text-green-600" />
              <span className="text-sm font-medium text-green-600">QR Code Successfully Scanned</span>
              <span className="text-xs text-green-500">(99% accuracy)</span>
            </div>
          </div>
        )}

        {/* QR Code Debug Information */}
        {qrDebugData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              <QrCode size={16} className="mr-2" />
              Debug: QR Code Scanning Data
            </h3>
            <div className="text-xs text-blue-800 bg-blue-100 p-3 rounded max-h-40 overflow-y-auto font-mono">
              {qrDebugData || 'No QR code data found'}
            </div>
            <div className="mt-2 text-xs text-blue-700">
              <strong>Note:</strong> This shows the raw QR code content and parsing process
            </div>
          </div>
        )}

        {/* Loading State */}
        {isScanning && !capturedImage && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <QrCode size={24} className="animate-pulse text-blue-600" />
              <span className="text-gray-700">Scanning QR Code...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {scanResult && !scanResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <p className="text-red-800 text-sm font-medium">QR Code Not Found</p>
            </div>
            <p className="text-red-800 text-sm">{scanResult.error}</p>
            <div className="mt-3 p-3 bg-red-100 rounded">
              <p className="text-xs text-red-700">
                <strong>Tips:</strong>
              </p>
              <ul className="text-xs text-red-700 mt-1 space-y-1">
                <li>• Ensure the QR code is clearly visible</li>
                <li>• Check if your CCCD has a QR code (newer cards only)</li>
                <li>• Try better lighting conditions</li>
                <li>• Make sure the QR code is not damaged or scratched</li>
              </ul>
            </div>
            <button
              onClick={resetForm}
              className="mt-3 text-red-600 text-sm underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Success Result */}
        {scanResult?.success && (
          <div className="bg-white rounded-lg shadow-sm border">
            {/* Header with actions */}
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center space-x-2">
                <QrCode size={20} className="text-green-600" />
                <CheckCircle size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  CCCD Information
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Edit Information"
                >
                  <Edit size={18} />
                </button>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:text-green-800"
                    title="Save Changes"
                  >
                    <Save size={18} />
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Scan New Card"
                >
                  <RotateCcw size={18} />
                </button>
              </div>
            </div>

            {/* Form */}
            <CCCDForm
              data={formData}
              onChange={handleFormChange}
              isEditing={isEditing}
            />
          </div>
        )}

        {/* NFC Scanner Modal */}
        {showNFCScanner && (
          <NFCScanner
            onNFCDetected={handleNFCDetected}
            onNFCFailed={handleNFCFailed}
            onCancel={() => setShowNFCScanner(false)}
          />
        )}

        {/* Camera Modal */}
        {showCamera && (
          <CameraCapture
            onImageCapture={handleImageCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>

      <Footer />
    </div>
  );
} 