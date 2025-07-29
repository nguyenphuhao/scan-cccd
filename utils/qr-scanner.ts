import jsQR from 'jsqr';
import { CCCDData, ScanResult } from '@/types/cccd';

interface QRCodeData {
  cccd: string;
  name: string;
  dob: string;
  sex: string;
  address: string;
  issue_date: string;
  expire_date: string;
  [key: string]: any;
}

export async function scanQRCode(imageFile: File): Promise<ScanResult> {
  try {
    console.log('Starting QR code scan...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for QR scanning
        console.log('Getting image data from canvas:', canvas.width, 'x', canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (!imageData || !imageData.data) {
          console.error('Failed to get ImageData from canvas');
          resolve({
            success: false,
            error: 'Failed to process image data. Please try a different image.',
          });
          return;
        }
        
        console.log('ImageData obtained successfully:', imageData.width, 'x', imageData.height, 'data length:', imageData.data.length);
        
        // Try multiple scanning approaches
        const qrResult = tryMultipleQRScans(imageData, canvas, ctx);
        
        if (qrResult) {
          console.log('QR Code detected:', qrResult);
          const parsedData = parseQRCodeData(qrResult);
          resolve({
            success: true,
            data: parsedData,
            confidence: 0.99,
          });
        } else {
          console.log('No QR code found');
          resolve({
            success: false,
            error: 'No QR code detected on the CCCD card. Please ensure the QR code is clearly visible.',
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load image for QR scanning.',
        });
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  } catch (error) {
    console.error('QR Scanner Error:', error);
    return {
      success: false,
      error: 'QR code scanning failed. Please try again.',
    };
  }
}

function tryMultipleQRScans(imageData: ImageData, canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D): string | null {
  // Validate imageData first
  if (!imageData) {
    console.error('ImageData is null or undefined');
    return null;
  }
  
  if (!imageData.data) {
    console.error('ImageData.data is null or undefined');
    return null;
  }
  
  if (!imageData.width || !imageData.height) {
    console.error('ImageData dimensions are invalid:', imageData.width, imageData.height);
    return null;
  }
  
  const width = imageData.width;
  const height = imageData.height;
  
  console.log('Trying multiple QR scan approaches...');
  console.log('ImageData info:', { width, height, dataLength: imageData.data.length });
  
  // Approach 1: Original image
  try {
    let result = jsQR(imageData.data, width, height, {
      inversionAttempts: "dontInvert",
    });
    if (result) {
      console.log('QR found with original image');
      return result.data;
    }
  } catch (error) {
    console.error('Error in approach 1:', error);
  }

  // Approach 2: Inverted colors
  try {
    let result = jsQR(imageData.data, width, height, {
      inversionAttempts: "onlyInvert",
    });
    if (result) {
      console.log('QR found with inverted colors');
      return result.data;
    }
  } catch (error) {
    console.error('Error in approach 2:', error);
  }

  // Approach 3: Try both inversions
  try {
    let result = jsQR(imageData.data, width, height, {
      inversionAttempts: "attemptBoth",
    });
    if (result) {
      console.log('QR found with both inversions');
      return result.data;
    }
  } catch (error) {
    console.error('Error in approach 3:', error);
  }

  // Approach 4: Enhanced contrast
  try {
    const contrastData = enhanceContrast(imageData);
    if (!contrastData || !contrastData.data) {
      console.error('Failed to enhance contrast');
      return null;
    }
    let result = jsQR(contrastData.data, contrastData.width, contrastData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (result) {
      console.log('QR found with enhanced contrast');
      return result.data;
    }
  } catch (error) {
    console.error('Error in approach 4:', error);
  }

  // Approach 5: Grayscale conversion
  try {
    const grayscaleData = convertToGrayscale(imageData);
    if (!grayscaleData || !grayscaleData.data) {
      console.error('Failed to convert to grayscale');
      return null;
    }
    let result = jsQR(grayscaleData.data, grayscaleData.width, grayscaleData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (result) {
      console.log('QR found with grayscale');
      return result.data;
    }
  } catch (error) {
    console.error('Error in approach 5:', error);
  }

  // Approach 6: Try different regions of the image
  const regions = [
    { x: Math.floor(width * 0.6), y: 0, w: Math.floor(width * 0.4), h: Math.floor(height * 0.4) }, // Top right (most likely)
    { x: 0, y: 0, w: Math.floor(width * 0.4), h: Math.floor(height * 0.4) }, // Top left
    { x: Math.floor(width * 0.6), y: Math.floor(height * 0.6), w: Math.floor(width * 0.4), h: Math.floor(height * 0.4) }, // Bottom right
    { x: 0, y: Math.floor(height * 0.6), w: Math.floor(width * 0.4), h: Math.floor(height * 0.4) }, // Bottom left
  ];

  for (let i = 0; i < regions.length; i++) {
    const region = regions[i];
    try {
      const regionData = ctx.getImageData(region.x, region.y, region.w, region.h);
      let result = jsQR(regionData.data, regionData.width, regionData.height, {
        inversionAttempts: "attemptBoth",
      });
      if (result) {
        console.log(`QR found in region ${i}: ${region.x},${region.y}`);
        return result.data;
      }
    } catch (error) {
      console.log(`Error scanning region ${i}:`, error);
    }
  }

  // Approach 7: Scale up the image for better detection
  try {
    const scaledCanvas = document.createElement('canvas');
    const scaledCtx = scaledCanvas.getContext('2d')!;
    const scale = 2;
    scaledCanvas.width = width * scale;
    scaledCanvas.height = height * scale;
    
    scaledCtx.imageSmoothingEnabled = false;
    scaledCtx.drawImage(canvas, 0, 0, width * scale, height * scale);
    
    const scaledData = scaledCtx.getImageData(0, 0, scaledCanvas.width, scaledCanvas.height);
    let result = jsQR(scaledData.data, scaledData.width, scaledData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (result) {
      console.log('QR found with scaled image');
      return result.data;
    }
  } catch (error) {
    console.log('Error with scaled approach:', error);
  }

  // Approach 8: Binary threshold
  try {
    const binaryData = applyBinaryThreshold(imageData);
    if (!binaryData || !binaryData.data) {
      console.error('Failed to apply binary threshold');
      return null;
    }
    let result = jsQR(binaryData.data, binaryData.width, binaryData.height, {
      inversionAttempts: "attemptBoth",
    });
    if (result) {
      console.log('QR found with binary threshold');
      return result.data;
    }
  } catch (error) {
    console.log('Error with binary threshold approach:', error);
  }

  console.log('No QR code found with any approach');
  return null;
}

function enhanceContrast(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const contrast = 50; // Increase contrast
  const factor = (259 * (contrast + 255)) / (255 * (259 - contrast));
  
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, factor * (data[i] - 128) + 128));     // Red
    data[i + 1] = Math.min(255, Math.max(0, factor * (data[i + 1] - 128) + 128)); // Green
    data[i + 2] = Math.min(255, Math.max(0, factor * (data[i + 2] - 128) + 128)); // Blue
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

function convertToGrayscale(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;     // Red
    data[i + 1] = gray; // Green
    data[i + 2] = gray; // Blue
    // Alpha channel (data[i + 3]) remains unchanged
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

function applyBinaryThreshold(imageData: ImageData): ImageData {
  const data = new Uint8ClampedArray(imageData.data);
  const threshold = 128;
  
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    const binary = gray > threshold ? 255 : 0;
    data[i] = binary;     // Red
    data[i + 1] = binary; // Green
    data[i + 2] = binary; // Blue
  }
  
  return new ImageData(data, imageData.width, imageData.height);
}

// Enhanced QR detection function
export async function enhancedQRScan(imageFile: File): Promise<ScanResult> {
  try {
    console.log('Starting enhanced QR code scan...');
    
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        console.log(`Image dimensions: ${img.width}x${img.height}`);
        
        // Get image data
        console.log('Getting image data from enhanced scan canvas:', canvas.width, 'x', canvas.height);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        if (!imageData || !imageData.data) {
          console.error('Failed to get ImageData from enhanced scan canvas');
          resolve({
            success: false,
            error: 'Failed to process image data for enhanced scanning.',
          });
          return;
        }
        
        console.log('Enhanced scan ImageData obtained:', imageData.width, 'x', imageData.height, 'data length:', imageData.data.length);
        
        // Try multiple scanning approaches with detailed logging
        const qrText = tryMultipleQRScans(imageData, canvas, ctx);
        
        if (qrText) {
          console.log('QR Code text found:', qrText);
          const parsedData = parseQRCodeData(qrText);
          console.log('Parsed CCCD data:', parsedData);
          
          resolve({
            success: true,
            data: parsedData,
            confidence: 0.99,
          });
        } else {
          console.log('Enhanced scan failed - no QR code detected');
          resolve({
            success: false,
            error: 'No QR code detected after trying multiple scanning methods.',
          });
        }
      };
      
      img.onerror = () => {
        resolve({
          success: false,
          error: 'Failed to load image for QR scanning.',
        });
      };
      
      img.src = URL.createObjectURL(imageFile);
    });
  } catch (error) {
    console.error('Enhanced QR Scanner Error:', error);
    return {
      success: false,
      error: 'QR code scanning failed. Please try again.',
    };
  }
}

function parseQRCodeData(qrText: string): CCCDData {
  console.log('Parsing QR code text:', qrText);
  
  try {
    let parsedData: CCCDData = {
      cardNumber: '',
      fullName: '',
      dateOfBirth: '',
      sex: '',
      nationality: 'Việt Nam',
      placeOfOrigin: '',
      placeOfResidence: '',
      dateOfExpiry: '',
    };
    
    // Try parsing as JSON first
    if (qrText.startsWith('{') || qrText.startsWith('[')) {
      try {
        const jsonData = JSON.parse(qrText) as QRCodeData;
        parsedData = {
          cardNumber: jsonData.cccd || jsonData.id || jsonData.cardNumber || '',
          fullName: jsonData.name || jsonData.fullName || jsonData.ho_ten || '',
          dateOfBirth: formatDate(jsonData.dob || jsonData.dateOfBirth || jsonData.ngay_sinh || ''),
          sex: jsonData.sex || jsonData.gender || jsonData.gioi_tinh || '',
          nationality: 'Việt Nam',
          placeOfOrigin: jsonData.placeOfOrigin || jsonData.que_quan || '',
          placeOfResidence: jsonData.placeOfResidence || jsonData.noi_thuong_tru || '',
          dateOfExpiry: formatDate(jsonData.expiry || jsonData.dateOfExpiry || jsonData.ngay_het_han || ''),
          dateOfIssue: formatDate(jsonData.issued || jsonData.dateOfIssue || jsonData.ngay_cap || ''),
        };
        return parsedData;
      } catch (e) {
        console.log('Failed to parse as JSON, trying other formats');
      }
    }
    
    // Try parsing as pipe-separated values (most common for CCCD)
    if (qrText.includes('|')) {
      const parts = qrText.split('|');
      console.log('Pipe-separated parts:', parts);
      if (parts.length >= 6) {
        parsedData = {
          cardNumber: parts[0]?.trim() || '',
          fullName: parts[1]?.trim() || '',
          dateOfBirth: formatDate(parts[2]?.trim() || ''),
          sex: parts[3]?.trim() || '',
          nationality: 'Việt Nam',
          placeOfOrigin: parts[4]?.trim() || '',
          placeOfResidence: parts[5]?.trim() || parts[4]?.trim() || '', // Often same as origin
          dateOfExpiry: formatDate(parts[6]?.trim() || ''),
          dateOfIssue: formatDate(parts[7]?.trim() || ''),
        };
        return parsedData;
      }
    }
    
    // Try parsing as comma-separated values
    if (qrText.includes(',')) {
      const parts = qrText.split(',');
      console.log('Comma-separated parts:', parts);
      if (parts.length >= 6) {
        parsedData = {
          cardNumber: parts[0]?.trim() || '',
          fullName: parts[1]?.trim() || '',
          dateOfBirth: formatDate(parts[2]?.trim() || ''),
          sex: parts[3]?.trim() || '',
          nationality: 'Việt Nam',
          placeOfOrigin: parts[4]?.trim() || '',
          placeOfResidence: parts[5]?.trim() || '',
          dateOfExpiry: formatDate(parts[6]?.trim() || ''),
        };
        return parsedData;
      }
    }
    
    // If no structured format, try to extract information with regex
    console.log('No structured format found, trying regex extraction');
    return extractDataWithRegex(qrText);
    
  } catch (error) {
    console.error('Error parsing QR code data:', error);
    return {
      cardNumber: '',
      fullName: '',
      dateOfBirth: '',
      sex: '',
      nationality: 'Việt Nam',
      placeOfOrigin: '',
      placeOfResidence: '',
      dateOfExpiry: '',
    };
  }
}

function extractDataWithRegex(text: string): CCCDData {
  console.log('Extracting data with regex from:', text);
  
  const data: CCCDData = {
    cardNumber: '',
    fullName: '',
    dateOfBirth: '',
    sex: '',
    nationality: 'Việt Nam',
    placeOfOrigin: '',
    placeOfResidence: '',
    dateOfExpiry: '',
  };
  
  // Extract 12-digit card number
  const cardNumberMatch = text.match(/\b\d{12}\b/);
  if (cardNumberMatch) {
    data.cardNumber = cardNumberMatch[0];
    console.log('Found card number:', data.cardNumber);
  }
  
  // Extract dates (DD/MM/YYYY format)
  const dateMatches = text.match(/\d{2}\/\d{2}\/\d{4}/g);
  if (dateMatches) {
    if (dateMatches.length >= 1) data.dateOfBirth = dateMatches[0];
    if (dateMatches.length >= 2) data.dateOfExpiry = dateMatches[1];
    console.log('Found dates:', dateMatches);
  }
  
  // Extract Vietnamese names (uppercase)
  const nameMatch = text.match(/[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]{3,}/);
  if (nameMatch) {
    const name = nameMatch[0].trim();
    if (!name.includes('CỘNG HÒA') && !name.includes('VIỆT NAM') && !name.includes('CĂN CƯỚC')) {
      data.fullName = name;
      console.log('Found name:', data.fullName);
    }
  }
  
  // Extract sex
  const sexMatch = text.match(/(Nam|Nữ|Male|Female)/i);
  if (sexMatch) {
    data.sex = sexMatch[1];
    console.log('Found sex:', data.sex);
  }
  
  return data;
}

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  
  // Handle various date formats and convert to DD/MM/YYYY
  const formats = [
    /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
    /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
    /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    /(\d{8})/, // DDMMYYYY
  ];
  
  for (const format of formats) {
    const match = dateStr.match(format);
    if (match) {
      if (format === formats[1]) { // YYYY-MM-DD
        return `${match[3]}/${match[2]}/${match[1]}`;
      } else if (format === formats[3]) { // DDMMYYYY
        return `${match[1].slice(0,2)}/${match[1].slice(2,4)}/${match[1].slice(4,8)}`;
      } else {
        return dateStr; // Already in correct format
      }
    }
  }
  
  return dateStr;
} 