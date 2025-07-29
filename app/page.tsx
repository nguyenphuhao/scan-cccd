'use client';

import React, { useState, useRef } from 'react';
import { Camera, Upload, Edit, Save, RotateCcw, CheckCircle } from 'lucide-react';
import CameraCapture from '@/components/CameraCapture';
import CCCDForm from '@/components/CCCDForm';
import { scanCCCD } from '@/utils/ocr';
import { CCCDData, ScanResult } from '@/types/cccd';

export default function Home() {
  const [showCamera, setShowCamera] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
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

  const handleImageCapture = async (file: File) => {
    setShowCamera(false);
    
    // Create preview URL
    const previewUrl = URL.createObjectURL(file);
    setCapturedImage(previewUrl);
    
    await processImage(file);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCapturedImage(previewUrl);
      
      await processImage(file);
    }
  };

  const processImage = async (file: File) => {
    setIsScanning(true);
    try {
      console.log('Processing image file:', file.name, file.size);
      const result = await scanCCCD(file);
      setScanResult(result);
      
      if (result.success && result.data) {
        setFormData(result.data);
      }
    } catch (error) {
      console.error('Error processing image:', error);
      setScanResult({
        success: false,
        error: 'Failed to process image. Please try again.',
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
    // Here you could save the data to a backend or local storage
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
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <h1 className="text-xl font-bold text-gray-900 text-center">
            CCCD Scanner
          </h1>
          <p className="text-sm text-gray-600 text-center mt-1">
            Vietnamese ID Card Scanner
          </p>
        </div>
      </header>

      <div className="max-w-md mx-auto p-4">
        {/* Upload/Camera Section */}
        {!scanResult?.success && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Scan CCCD Card
            </h2>
            
            <div className="space-y-4">
              {/* Camera Button */}
              <button
                onClick={() => setShowCamera(true)}
                className="w-full camera-button flex items-center justify-center space-x-2"
              >
                <Camera size={20} />
                <span>Take Photo</span>
              </button>

              {/* Upload Button */}
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full upload-button flex items-center justify-center space-x-2"
              >
                <Upload size={20} />
                <span>Upload Image</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {/* Instructions */}
            <div className="mt-6 p-4 bg-blue-50 rounded-lg">
              <h3 className="font-medium text-blue-900 mb-2">Instructions:</h3>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Ensure good lighting for better accuracy</li>
                <li>• Hold the card steady and flat</li>
                <li>• Make sure all text is clearly visible</li>
                <li>• Works with both front and back sides</li>
              </ul>
            </div>
          </div>
        )}

        {/* Captured Image Preview */}
        {capturedImage && (
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">
              Captured Image
            </h3>
            <div className="relative">
              <img 
                src={capturedImage} 
                alt="Captured CCCD" 
                className="w-full h-48 object-cover rounded-lg border"
              />
              {isScanning && (
                <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                  <div className="text-white text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white mx-auto mb-2"></div>
                    <p>Scanning CCCD...</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Loading State */}
        {isScanning && !capturedImage && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600"></div>
              <span className="text-gray-700">Scanning CCCD...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {scanResult && !scanResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-800 text-sm">{scanResult.error}</p>
            <button
              onClick={resetForm}
              className="mt-2 text-red-600 text-sm underline"
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
                <CheckCircle size={20} className="text-green-600" />
                <h2 className="text-lg font-semibold text-gray-800">
                  CCCD Information
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                >
                  <Edit size={18} />
                </button>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:text-green-800"
                  >
                    <Save size={18} />
                  </button>
                )}
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-600 hover:text-gray-800"
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

        {/* Camera Modal */}
        {showCamera && (
          <CameraCapture
            onImageCapture={handleImageCapture}
            onClose={() => setShowCamera(false)}
          />
        )}
      </div>
    </div>
  );
} 