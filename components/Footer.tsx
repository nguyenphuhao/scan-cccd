import React from 'react';
import { Github, ExternalLink, Heart } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-white border-t border-gray-200 mt-12">
      <div className="max-w-md mx-auto px-4 py-6">
        <div className="text-center">
          {/* Main Footer Content */}
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              CCCD Scanner
            </h3>
            <p className="text-sm text-gray-600 mb-4">
              Vietnamese Citizen Identity Card Scanner
            </p>
          </div>

          {/* Repository Links */}
          <div className="flex items-center justify-center space-x-4 mb-4">
            <a
              href="https://github.com/nguyenphuhao/scan-cccd"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 transition-colors"
            >
              <Github size={16} />
              <span className="text-sm">Repository</span>
              <ExternalLink size={12} />
            </a>
          </div>

          {/* Developer Information */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
              <span>Developed with</span>
              <Heart size={12} className="text-red-500" />
              <span>by</span>
              <a
                href="https://github.com/nguyenphuhao"
                target="_blank"
                rel="noopener noreferrer"
                className="font-medium text-primary-600 hover:text-primary-700 transition-colors"
              >
                Nguyen Phu Hao
              </a>
            </div>
          </div>

          {/* Tech Stack */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400 mb-2">Built with:</p>
            <div className="flex items-center justify-center space-x-3 text-xs text-gray-500">
              <span className="bg-gray-100 px-2 py-1 rounded">Next.js</span>
              <span className="bg-gray-100 px-2 py-1 rounded">TypeScript</span>
              <span className="bg-gray-100 px-2 py-1 rounded">Tailwind CSS</span>
              <span className="bg-gray-100 px-2 py-1 rounded">Tesseract.js</span>
            </div>
          </div>

          {/* Copyright */}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <p className="text-xs text-gray-400">
              © 2024 Nguyen Phu Hao. Open source project.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
} 