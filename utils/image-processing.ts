import { CCCDData } from '@/types/cccd';

export interface CropResult {
  croppedImage: ImageData;
  boundingBox: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  confidence: number;
}

export async function autoCropCCCD(imageFile: File): Promise<{ croppedBlob: Blob; boundingBox: any }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      // Set canvas size to image size
      canvas.width = img.width;
      canvas.height = img.height;
      
      // Draw image on canvas
      ctx.drawImage(img, 0, 0);
      
      // Get image data for processing
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      
      // Detect CCCD card boundaries
      const cardBounds = detectCCCDCard(imageData);
      
      if (cardBounds) {
        // Crop the detected card area
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d')!;
        
        croppedCanvas.width = cardBounds.width;
        croppedCanvas.height = cardBounds.height;
        
        // Draw cropped area
        croppedCtx.drawImage(
          canvas,
          cardBounds.x, cardBounds.y, cardBounds.width, cardBounds.height,
          0, 0, cardBounds.width, cardBounds.height
        );
        
        // Convert to blob
        croppedCanvas.toBlob((blob) => {
          if (blob) {
            resolve({
              croppedBlob: blob,
              boundingBox: cardBounds
            });
          } else {
            reject(new Error('Failed to create cropped image'));
          }
        }, 'image/jpeg', 0.9);
      } else {
        // If no card detected, return original image
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              croppedBlob: blob,
              boundingBox: { x: 0, y: 0, width: img.width, height: img.height }
            });
          } else {
            reject(new Error('Failed to create image'));
          }
        }, 'image/jpeg', 0.9);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

function detectCCCDCard(imageData: ImageData): { x: number; y: number; width: number; height: number } | null {
  const { width, height, data } = imageData;
  
  // CCCD cards typically have specific aspect ratios and colors
  // We'll use edge detection and contour finding
  
  // Convert to grayscale and find edges
  const edges = detectEdges(data, width, height);
  
  // Find contours (connected components)
  const contours = findContours(edges, width, height);
  
  // Filter contours by CCCD card characteristics
  const cardContours = filterCardContours(contours, width, height);
  
  if (cardContours.length > 0) {
    // Get the largest contour (most likely to be the card)
    const largestContour = cardContours.reduce((largest, current) => 
      current.area > largest.area ? current : largest
    );
    
    return {
      x: largestContour.boundingBox.x,
      y: largestContour.boundingBox.y,
      width: largestContour.boundingBox.width,
      height: largestContour.boundingBox.height
    };
  }
  
  return null;
}

function detectEdges(data: Uint8ClampedArray, width: number, height: number): Uint8Array {
  const edges = new Uint8Array(width * height);
  
  // Simple Sobel edge detection
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const idx = y * width + x;
      
      // Get surrounding pixels
      const top = data[(y - 1) * width + x];
      const bottom = data[(y + 1) * width + x];
      const left = data[y * width + (x - 1)];
      const right = data[y * width + (x + 1)];
      
      // Calculate gradient
      const gx = right - left;
      const gy = bottom - top;
      const magnitude = Math.sqrt(gx * gx + gy * gy);
      
      edges[idx] = magnitude > 30 ? 255 : 0;
    }
  }
  
  return edges;
}

function findContours(edges: Uint8Array, width: number, height: number): any[] {
  const visited = new Set<number>();
  const contours: any[] = [];
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = y * width + x;
      
      if (edges[idx] === 255 && !visited.has(idx)) {
        // Found a new contour
        const contour = traceContour(edges, width, height, x, y, visited);
        if (contour.points.length > 100) { // Minimum contour size
          contours.push(contour);
        }
      }
    }
  }
  
  return contours;
}

function traceContour(edges: Uint8Array, width: number, height: number, startX: number, startY: number, visited: Set<number>): any {
  const points: { x: number; y: number }[] = [];
  const stack: { x: number; y: number }[] = [{ x: startX, y: startY }];
  
  while (stack.length > 0) {
    const { x, y } = stack.pop()!;
    const idx = y * width + x;
    
    if (x < 0 || x >= width || y < 0 || y >= height || visited.has(idx) || edges[idx] !== 255) {
      continue;
    }
    
    visited.add(idx);
    points.push({ x, y });
    
    // Add neighbors to stack
    stack.push({ x: x + 1, y });
    stack.push({ x: x - 1, y });
    stack.push({ x, y: y + 1 });
    stack.push({ x, y: y - 1 });
  }
  
  // Calculate bounding box
  const minX = Math.min(...points.map(p => p.x));
  const maxX = Math.max(...points.map(p => p.x));
  const minY = Math.min(...points.map(p => p.y));
  const maxY = Math.max(...points.map(p => p.y));
  
  return {
    points,
    area: points.length,
    boundingBox: {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    }
  };
}

function filterCardContours(contours: any[], imageWidth: number, imageHeight: number): any[] {
  return contours.filter(contour => {
    const { width, height } = contour.boundingBox;
    
    // CCCD cards have specific characteristics:
    // 1. Aspect ratio is roughly 1.6:1 (width:height)
    const aspectRatio = width / height;
    const expectedRatio = 1.6;
    const ratioTolerance = 0.3;
    
    // 2. Card should be reasonably sized (not too small or too large)
    const minSize = Math.min(imageWidth, imageHeight) * 0.1;
    const maxSize = Math.min(imageWidth, imageHeight) * 0.9;
    
    // 3. Card should be rectangular (not too irregular)
    const area = width * height;
    const contourArea = contour.area;
    const rectangularity = contourArea / area; // Should be close to 1 for rectangles
    
    return (
      Math.abs(aspectRatio - expectedRatio) < ratioTolerance &&
      width > minSize && height > minSize &&
      width < maxSize && height < maxSize &&
      rectangularity > 0.6
    );
  });
}

// Alternative: Use a simpler approach with color-based detection
export async function simpleCCCDDetection(imageFile: File): Promise<{ croppedBlob: Blob; boundingBox: any }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);
      
      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const bounds = findCCCDByColor(imageData);
      
      if (bounds) {
        const croppedCanvas = document.createElement('canvas');
        const croppedCtx = croppedCanvas.getContext('2d')!;
        
        croppedCanvas.width = bounds.width;
        croppedCanvas.height = bounds.height;
        
        croppedCtx.drawImage(
          canvas,
          bounds.x, bounds.y, bounds.width, bounds.height,
          0, 0, bounds.width, bounds.height
        );
        
        croppedCanvas.toBlob((blob) => {
          if (blob) {
            resolve({
              croppedBlob: blob,
              boundingBox: bounds
            });
          } else {
            reject(new Error('Failed to create cropped image'));
          }
        }, 'image/jpeg', 0.9);
      } else {
        // Return original if no card detected
        canvas.toBlob((blob) => {
          if (blob) {
            resolve({
              croppedBlob: blob,
              boundingBox: { x: 0, y: 0, width: img.width, height: img.height }
            });
          } else {
            reject(new Error('Failed to create image'));
          }
        }, 'image/jpeg', 0.9);
      }
    };
    
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = URL.createObjectURL(imageFile);
  });
}

function findCCCDByColor(imageData: ImageData): { x: number; y: number; width: number; height: number } | null {
  const { width, height, data } = imageData;
  
  // CCCD cards typically have a light blue/green background
  // Look for areas with consistent light blue/green color
  
  let minX = width, minY = height, maxX = 0, maxY = 0;
  let cardPixels = 0;
  
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const idx = (y * width + x) * 4;
      const r = data[idx];
      const g = data[idx + 1];
      const b = data[idx + 2];
      
      // Check if pixel is in CCCD card color range (light blue/green)
      if (isCCCDColor(r, g, b)) {
        minX = Math.min(minX, x);
        minY = Math.min(minY, y);
        maxX = Math.max(maxX, x);
        maxY = Math.max(maxY, y);
        cardPixels++;
      }
    }
  }
  
  // Only return bounds if we found enough card pixels
  const totalPixels = width * height;
  const cardRatio = cardPixels / totalPixels;
  
  if (cardRatio > 0.1 && (maxX - minX) > width * 0.3 && (maxY - minY) > height * 0.3) {
    return {
      x: minX,
      y: minY,
      width: maxX - minX,
      height: maxY - minY
    };
  }
  
  return null;
}

function isCCCDColor(r: number, g: number, b: number): boolean {
  // CCCD cards typically have light blue/green background
  // Check if color is in the expected range
  const isLight = r > 150 && g > 150 && b > 150; // Light colors
  const isBlueGreen = g > r && g > b; // More green than red/blue
  const isNotTooBright = r < 250 && g < 250 && b < 250; // Not pure white
  
  return isLight && isBlueGreen && isNotTooBright;
} 