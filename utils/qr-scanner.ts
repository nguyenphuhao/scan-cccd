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
    
    // Create canvas to process image
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    const img = new Image();
    
    return new Promise((resolve) => {
      img.onload = () => {
        canvas.width = img.width;
        canvas.height = img.height;
        ctx.drawImage(img, 0, 0);
        
        // Get image data for QR scanning
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        
        // Scan for QR code using jsQR
        const qrCode = jsQR(imageData.data, imageData.width, imageData.height, {
          inversionAttempts: "dontInvert",
        });
        
        if (qrCode) {
          console.log('QR Code detected:', qrCode.data);
          
          // Parse QR code data
          const parsedData = parseQRCodeData(qrCode.data);
          
          resolve({
            success: true,
            data: parsedData,
            confidence: 0.99, // QR codes are very accurate
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

function parseQRCodeData(qrText: string): CCCDData {
  console.log('Parsing QR code text:', qrText);
  
  try {
    // CCCD QR codes typically contain pipe-separated values or JSON
    // Format example: "123456789012|NGUYEN VAN A|01/01/1990|Nam|Ha Noi, Viet Nam|01/01/2020|01/01/2030"
    
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
          cardNumber: jsonData.cccd || jsonData.id || '',
          fullName: jsonData.name || jsonData.fullName || '',
          dateOfBirth: formatDate(jsonData.dob || jsonData.dateOfBirth || ''),
          sex: jsonData.sex || jsonData.gender || '',
          nationality: 'Việt Nam',
          placeOfOrigin: jsonData.address || '',
          placeOfResidence: jsonData.address || '',
          dateOfExpiry: formatDate(jsonData.expire_date || jsonData.expiry || ''),
          dateOfIssue: formatDate(jsonData.issue_date || jsonData.issued || ''),
        };
        return parsedData;
      } catch (e) {
        console.log('Failed to parse as JSON, trying pipe-separated format');
      }
    }
    
    // Try parsing as pipe-separated values (most common for CCCD)
    if (qrText.includes('|')) {
      const parts = qrText.split('|');
      if (parts.length >= 6) {
        parsedData = {
          cardNumber: parts[0]?.trim() || '',
          fullName: parts[1]?.trim() || '',
          dateOfBirth: formatDate(parts[2]?.trim() || ''),
          sex: parts[3]?.trim() || '',
          nationality: 'Việt Nam',
          placeOfOrigin: parts[4]?.trim() || '',
          placeOfResidence: parts[4]?.trim() || '',
          dateOfExpiry: formatDate(parts[6]?.trim() || ''),
          dateOfIssue: formatDate(parts[5]?.trim() || ''),
        };
        return parsedData;
      }
    }
    
    // Try parsing as comma-separated values
    if (qrText.includes(',')) {
      const parts = qrText.split(',');
      if (parts.length >= 6) {
        parsedData = {
          cardNumber: parts[0]?.trim() || '',
          fullName: parts[1]?.trim() || '',
          dateOfBirth: formatDate(parts[2]?.trim() || ''),
          sex: parts[3]?.trim() || '',
          nationality: 'Việt Nam',
          placeOfOrigin: parts[4]?.trim() || '',
          placeOfResidence: parts[4]?.trim() || '',
          dateOfExpiry: formatDate(parts[5]?.trim() || ''),
        };
        return parsedData;
      }
    }
    
    // If no structured format is detected, try to extract information with regex
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
  }
  
  // Extract dates (DD/MM/YYYY format)
  const dateMatches = text.match(/\d{2}\/\d{2}\/\d{4}/g);
  if (dateMatches) {
    if (dateMatches.length >= 1) data.dateOfBirth = dateMatches[0];
    if (dateMatches.length >= 2) data.dateOfExpiry = dateMatches[1];
  }
  
  // Extract name (Vietnamese names)
  const nameMatch = text.match(/[A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]{3,}/);
  if (nameMatch) {
    data.fullName = nameMatch[0].trim();
  }
  
  // Extract sex
  const sexMatch = text.match(/(Nam|Nữ|Male|Female)/i);
  if (sexMatch) {
    data.sex = sexMatch[1];
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

// Enhanced QR detection function that tries multiple approaches
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
        
        // Try multiple scanning approaches
        const approaches = [
          // Original image
          () => scanImageData(ctx.getImageData(0, 0, canvas.width, canvas.height)),
          // Grayscale conversion
          () => scanGrayscale(ctx, canvas.width, canvas.height),
          // Contrast enhancement
          () => scanWithContrast(ctx, canvas.width, canvas.height),
          // Different orientations
          () => scanRotated(ctx, canvas.width, canvas.height, 90),
          () => scanRotated(ctx, canvas.width, canvas.height, 180),
          () => scanRotated(ctx, canvas.width, canvas.height, 270),
        ];
        
        for (const approach of approaches) {
          try {
            const result = approach();
            if (result) {
              console.log('QR Code detected with enhanced scan:', result.data);
              const parsedData = parseQRCodeData(result.data);
              resolve({
                success: true,
                data: parsedData,
                confidence: 0.99,
              });
              return;
            }
          } catch (e) {
            console.log('Scanning approach failed:', e);
          }
        }
        
        // No QR code found with any approach
        resolve({
          success: false,
          error: 'No QR code detected after trying multiple scanning methods.',
        });
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

function scanImageData(imageData: ImageData) {
  return jsQR(imageData.data, imageData.width, imageData.height, {
    inversionAttempts: "dontInvert",
  });
}

function scanGrayscale(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Convert to grayscale
  for (let i = 0; i < data.length; i += 4) {
    const gray = 0.299 * data[i] + 0.587 * data[i + 1] + 0.114 * data[i + 2];
    data[i] = gray;
    data[i + 1] = gray;
    data[i + 2] = gray;
  }
  
  return jsQR(data, width, height);
}

function scanWithContrast(ctx: CanvasRenderingContext2D, width: number, height: number) {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;
  
  // Enhance contrast
  const contrast = 1.5;
  for (let i = 0; i < data.length; i += 4) {
    data[i] = Math.min(255, Math.max(0, (data[i] - 128) * contrast + 128));
    data[i + 1] = Math.min(255, Math.max(0, (data[i + 1] - 128) * contrast + 128));
    data[i + 2] = Math.min(255, Math.max(0, (data[i + 2] - 128) * contrast + 128));
  }
  
  return jsQR(data, width, height);
}

function scanRotated(ctx: CanvasRenderingContext2D, width: number, height: number, degrees: number) {
  const tempCanvas = document.createElement('canvas');
  const tempCtx = tempCanvas.getContext('2d')!;
  
  if (degrees === 90 || degrees === 270) {
    tempCanvas.width = height;
    tempCanvas.height = width;
  } else {
    tempCanvas.width = width;
    tempCanvas.height = height;
  }
  
  tempCtx.translate(tempCanvas.width / 2, tempCanvas.height / 2);
  tempCtx.rotate((degrees * Math.PI) / 180);
  tempCtx.drawImage(ctx.canvas, -width / 2, -height / 2, width, height);
  
  const imageData = tempCtx.getImageData(0, 0, tempCanvas.width, tempCanvas.height);
  return jsQR(imageData.data, imageData.width, imageData.height);
} 