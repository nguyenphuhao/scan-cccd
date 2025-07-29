'use client';

import React, { useState, useRef } from 'react';
import { Upload, Edit, Save, RotateCcw, CheckCircle, AlertCircle, QrCode, ArrowLeft } from 'lucide-react';
import CCCDForm from '@/components/CCCDForm';
import Footer from '@/components/Footer';
import AISelector, { AIEngine } from '@/components/AISelector';
import { extractCCCDWithOpenAI } from '@/utils/openai-cccd-extractor';
import { extractCCCDWithGemini } from '@/utils/gemini-cccd-extractor';
import { CCCDData, ScanResult } from '@/types/cccd';

export default function Home() {
  const [isScanning, setIsScanning] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [qrDebugData, setQrDebugData] = useState<string>('');
  const [selectedAIEngine, setSelectedAIEngine] = useState<AIEngine>('gemini');
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

  const backToUpload = () => {
    setScanResult(null);
    setCapturedImage(null);
    setQrDebugData('');
    setIsEditing(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setCapturedImage(previewUrl);
      
      // Start AI extraction
      await processImageWithAI(file);
    }
  };

  const processImageWithAI = async (file: File) => {
    setIsScanning(true);
    setQrDebugData('');
    
    try {
      console.log('Starting AI extraction...');
      
      // Override console.log to capture AI processing logs
      const originalLog = console.log;
      const aiCapturedLogs: string[] = [];
      console.log = (...args) => {
        aiCapturedLogs.push(args.join(' '));
        originalLog.apply(console, args);
      };
      
      // Try AI extraction with selected engine
      console.log('Using AI engine:', selectedAIEngine);
      const aiResult = selectedAIEngine === 'openai' 
        ? await extractCCCDWithOpenAI(file)
        : await extractCCCDWithGemini(file);
      
      // Restore console.log
      console.log = originalLog;
      
      // Extract AI debug information
      const aiDebugInfo = aiCapturedLogs.join('\n');
      setQrDebugData(aiDebugInfo);
      
      if (aiResult.success && aiResult.data) {
        console.log('AI extraction successful:', aiResult.data);
        setScanResult(aiResult);
        setFormData(aiResult.data);
      } else {
        console.log('AI extraction failed');
        setScanResult({
          success: false,
          error: 'Không thể trích xuất thông tin CCCD từ ảnh. Vui lòng đảm bảo ảnh rõ nét và chứa thẻ CCCD Việt Nam.',
        });
      }
    } catch (error) {
      console.error('AI extraction failed:', error);
      setQrDebugData(`AI Extraction Error: ${error}`);
      setScanResult({
        success: false,
        error: 'Trích xuất AI thất bại. Vui lòng thử lại với ảnh rõ nét hơn.',
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
  };

  const loadSampleData = () => {
    const sampleData = {
      cardNumber: '',
      fullName: '',
      dateOfBirth: '',
      sex: '',
      nationality: '',
      placeOfOrigin: '',
      placeOfResidence: '',
      dateOfExpiry: '',
    };
    setFormData(sampleData);
    setScanResult({
      success: true,
      data: sampleData,
      confidence: 0.95,
    });
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-md mx-auto px-4 py-4">
          <div className="flex items-center justify-center">
            <div className="text-center">
              <h1 className="text-xl font-bold text-gray-900 flex items-center justify-center">
                <QrCode size={24} className="mr-2 text-green-600" />
                Quét CCCD
              </h1>
              <p className="text-sm text-gray-600">
                Ứng dụng quét CCCD bằng AI
              </p>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1 max-w-md mx-auto p-4 w-full">
        {/* AI Engine Selection */}
        {!scanResult?.success && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">Chọn công cụ AI</h2>
            <AISelector 
              selectedEngine={selectedAIEngine}
              onEngineChange={setSelectedAIEngine}
            />
          </div>
        )}

        {/* Upload Options */}
        {!scanResult?.success && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">
              Tải lên ảnh CCCD
            </h2>
            
            <div className="space-y-4">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="w-full bg-green-600 hover:bg-green-700 text-white font-medium py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Upload size={20} />
                <span>Tải lên ảnh (AI)</span>
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
            <div className="mt-6">
              <div className="p-4 bg-green-50 rounded-lg">
                <h3 className="font-medium text-green-900 mb-2 flex items-center">
                  <QrCode size={16} className="mr-2" />
                  Quét bằng AI:
                </h3>
                <ul className="text-sm text-green-800 space-y-1">
                  <li>• 📸 Tải lên ảnh CCCD rõ nét</li>
                  <li>• 🤖 Công nghệ AI nhận dạng văn bản tiên tiến</li>
                  <li>• 🎯 Độ chính xác cao cho tất cả thẻ CCCD</li>
                  <li>• 💡 Hoạt động trong nhiều điều kiện ánh sáng</li>
                  <li>• 📋 Hỗ trợ cả CCCD cũ và mới</li>
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
              Xử lý bằng AI
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
                    <p className="font-medium">Đang xử lý bằng AI...</p>
                    <p className="text-sm text-gray-300">
                      Đang trích xuất thông tin CCCD
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
              <span className="text-sm font-medium text-green-600">Trích xuất AI thành công</span>
              <span className="text-xs text-green-500">(độ chính xác 95%)</span>
            </div>
          </div>
        )}

        {/* AI Processing Debug Information */}
        {qrDebugData && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-900 mb-2 flex items-center">
              <QrCode size={16} className="mr-2" />
              Debug: Dữ liệu xử lý AI
            </h3>
            <div className="text-xs text-blue-800 bg-blue-100 p-3 rounded max-h-40 overflow-y-auto font-mono">
              {qrDebugData || 'Không tìm thấy dữ liệu xử lý AI'}
            </div>
            <div className="mt-2 text-xs text-blue-700">
              <strong>Lưu ý:</strong> Hiển thị nhật ký xử lý AI và nội dung đã trích xuất
            </div>
          </div>
        )}

        {/* Loading State */}
        {isScanning && !capturedImage && (
          <div className="bg-white rounded-lg shadow-sm border p-6 mb-6">
            <div className="flex items-center justify-center space-x-3">
              <QrCode size={24} className="animate-pulse text-blue-600" />
              <span className="text-gray-700">Đang xử lý bằng AI...</span>
            </div>
          </div>
        )}

        {/* Error Message */}
        {scanResult && !scanResult.success && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle size={16} className="text-red-600" />
              <p className="text-red-800 text-sm font-medium">Trích xuất AI thất bại</p>
            </div>
            <p className="text-red-800 text-sm">{scanResult.error}</p>
            <div className="mt-3 p-3 bg-red-100 rounded">
              <p className="text-xs text-red-700">
                <strong>Mẹo:</strong>
              </p>
              <ul className="text-xs text-red-700 mt-1 space-y-1">
                <li>• Đảm bảo ảnh rõ nét và đủ sáng</li>
                <li>• Chắc chắn tất cả văn bản trên CCCD đều có thể nhìn thấy</li>
                <li>• Thử tải lên ảnh chất lượng cao hơn</li>
                <li>• Kiểm tra ảnh có chứa CCCD Việt Nam không</li>
              </ul>
            </div>
            <button
              onClick={backToUpload}
              className="mt-3 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg text-sm flex items-center space-x-2"
            >
              <ArrowLeft size={16} />
              <span>Quay lại tải lên</span>
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
                  Thông tin CCCD
                </h2>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={() => setIsEditing(!isEditing)}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Chỉnh sửa thông tin"
                >
                  <Edit size={18} />
                </button>
                {isEditing && (
                  <button
                    onClick={handleSave}
                    className="p-2 text-green-600 hover:text-green-800"
                    title="Lưu thay đổi"
                  >
                    <Save size={18} />
                  </button>
                )}
                <button
                  onClick={backToUpload}
                  className="p-2 text-blue-600 hover:text-blue-800"
                  title="Tải lên ảnh mới"
                >
                  <ArrowLeft size={18} />
                </button>
                <button
                  onClick={resetForm}
                  className="p-2 text-gray-600 hover:text-gray-800"
                  title="Đặt lại form"
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
      </div>

      <Footer />
    </div>
  );
} 