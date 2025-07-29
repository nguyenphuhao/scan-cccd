'use client';

import React from 'react';
import { ChevronDown, Zap, Brain, CheckCircle, AlertCircle } from 'lucide-react';

export type AIEngine = 'openai' | 'gemini';

interface AIEngineConfig {
  id: AIEngine;
  name: string;
  description: string;
  accuracy: string;
  cost: string;
  speed: string;
  isAvailable: boolean;
  icon: React.ReactNode;
}

interface AISelectorProps {
  selectedEngine: AIEngine;
  onEngineChange: (engine: AIEngine) => void;
}

const AI_ENGINES: AIEngineConfig[] = [
  {
    id: 'gemini',
    name: 'Google Gemini 2.0 Flash',
    description: 'AI nhanh và chính xác với hỗ trợ đa ngôn ngữ mạnh mẽ',
    accuracy: '94%+',
    cost: 'Có gói miễn phí',
    speed: '1-3 giây',
    isAvailable: true,
    icon: <Zap size={16} className="text-blue-600" />,
  },
  {
    id: 'openai',
    name: 'OpenAI GPT-4 Vision',
    description: 'AI tiên tiến với khả năng nhận dạng văn bản tiếng Việt xuất sắc',
    accuracy: '95%+',
    cost: '$0.01-0.03/ảnh',
    speed: '3-5 giây',
    isAvailable: true,
    icon: <Brain size={16} className="text-purple-600" />,
  },
  
];

export default function AISelector({ selectedEngine, onEngineChange }: AISelectorProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectedConfig = AI_ENGINES.find(engine => engine.id === selectedEngine);

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-white border border-gray-300 rounded-lg px-4 py-3 flex items-center justify-between hover:border-gray-400 focus:outline-none focus:ring-2 focus:ring-primary-500"
      >
        <div className="flex items-center space-x-3">
          <div className="flex items-center space-x-2">
            {selectedConfig?.icon}
            <span className="font-medium text-gray-900">{selectedConfig?.name}</span>
          </div>
          <span className="text-sm text-gray-500">({selectedConfig?.accuracy})</span>
        </div>
        <ChevronDown 
          size={16} 
          className={`text-gray-500 transition-transform ${isOpen ? 'rotate-180' : ''}`} 
        />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-gray-300 rounded-lg shadow-lg z-50">
          <div className="p-2">
            {AI_ENGINES.map((engine) => (
              <button
                key={engine.id}
                onClick={() => {
                  onEngineChange(engine.id);
                  setIsOpen(false);
                }}
                disabled={!engine.isAvailable}
                className={`w-full text-left p-3 rounded-md transition-colors ${
                  selectedEngine === engine.id 
                    ? 'bg-primary-50 border border-primary-200' 
                    : 'hover:bg-gray-50'
                } ${!engine.isAvailable ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      {engine.icon}
                      <span className="font-medium text-gray-900">{engine.name}</span>
                      {engine.isAvailable ? (
                        <CheckCircle size={14} className="text-green-600" />
                      ) : (
                        <AlertCircle size={14} className="text-yellow-600" />
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-2">{engine.description}</p>
                                    <div className="flex items-center space-x-4 text-xs text-gray-500">
                  <span>Độ chính xác: {engine.accuracy}</span>
                  <span>Chi phí: {engine.cost}</span>
                  <span>Tốc độ: {engine.speed}</span>
                </div>
                  </div>
                  {selectedEngine === engine.id && (
                    <CheckCircle size={16} className="text-primary-600 ml-2" />
                  )}
                </div>
              </button>
            ))}
          </div>
          
          <div className="border-t border-gray-200 p-3 bg-gray-50">
            <div className="flex items-start space-x-2">
              <Brain size={14} className="text-gray-500 mt-0.5" />
              <div className="text-xs text-gray-600">
                <p className="font-medium mb-1">So sánh công cụ AI:</p>
                <ul className="space-y-1">
                  <li>• <strong>OpenAI:</strong> Độ chính xác cao nhất, giá cao cấp</li>
                  <li>• <strong>Gemini:</strong> Xử lý nhanh, gói miễn phí hấp dẫn</li>
                  <li>• Cả hai đều hỗ trợ dấu tiếng Việt</li>
                  <li>• Chọn dựa trên sở thích độ chính xác vs chi phí</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 