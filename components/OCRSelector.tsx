'use client';

import React from 'react';
import { ChevronDown, Info, CheckCircle, AlertCircle } from 'lucide-react';
import { OCREngine, OCREngineConfig, OCR_ENGINES } from '@/types/ocr';

interface OCRSelectorProps {
  selectedEngine: OCREngine;
  onEngineChange: (engine: OCREngine) => void;
}

export default function OCRSelector({ selectedEngine, onEngineChange }: OCRSelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);

  const selectedConfig = OCR_ENGINES.find(engine => engine.id === selectedEngine);

  return (
    <div className="relative">
      {/* Selected Engine Display */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {selectedConfig?.isAvailable ? (
              <CheckCircle size={16} className="text-green-600" />
            ) : (
              <AlertCircle size={16} className="text-yellow-600" />
            )}
            <span className="font-medium text-gray-900">{selectedConfig?.name}</span>
          </div>
          <span className="text-sm text-gray-500">({selectedConfig?.accuracy})</span>
        </div>
        <ChevronDown size={16} className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {OCR_ENGINES.map((engine) => (
              <button
                key={engine.id}
                onClick={() => {
                  onEngineChange(engine.id);
                  setIsOpen(false);
                }}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedEngine === engine.id
                    ? 'bg-primary-50 border border-primary-200'
                    : 'hover:bg-gray-50'
                } ${!engine.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
                disabled={!engine.isAvailable}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {engine.isAvailable ? (
                        <CheckCircle size={14} className="text-green-600" />
                      ) : (
                        <AlertCircle size={14} className="text-yellow-600" />
                      )}
                      <span className="font-medium text-gray-900">{engine.name}</span>
                      {engine.requiresApiKey && (
                        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                          API Key Required
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{engine.description}</p>
                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                      <span>Accuracy: {engine.accuracy}</span>
                      <span>Cost: {engine.cost}</span>
                    </div>
                  </div>
                  {selectedEngine === engine.id && (
                    <CheckCircle size={16} className="text-primary-600 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          {/* Info Section */}
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-start space-x-2">
              <Info size={14} className="text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">OCR Engine Information:</p>
                <ul className="space-y-1">
                  <li>• <strong>Tesseract.js:</strong> Free, works offline, basic Vietnamese support</li>
                  <li>• <strong>Google Vision:</strong> High accuracy, requires API key, paid service</li>
                  <li>• <strong>VietOCR:</strong> Vietnamese-specific, requires server setup</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 