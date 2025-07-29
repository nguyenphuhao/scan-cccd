import Tesseract from 'tesseract.js';
import { CCCDData, ScanResult } from '@/types/cccd';

export async function scanCCCD(imageFile: File): Promise<ScanResult> {
  try {
    // Initialize Tesseract with Vietnamese language
    const worker = await Tesseract.createWorker('vie+eng');
    
    // Set worker parameters for better accuracy
    await worker.setParameters({
      tessedit_char_whitelist: '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyzÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠàáâãèéêìíòóôõùúăđĩũơƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾưăạảấầẩẫậắằẳẵặẹẻẽềềểếỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪễệỉịọỏốồổỗộớờởỡợụủứừỬỮỰỲỴÝỶỸửữựỳỵýỷỹ /-.,()',
      tessedit_pageseg_mode: Tesseract.PSM.SINGLE_BLOCK,
    });

    // Convert file to base64
    const base64 = await fileToBase64(imageFile);
    
    // Perform OCR
    const { data: { text } } = await worker.recognize(base64);
    
    // Terminate worker
    await worker.terminate();
    
    // Parse the extracted text
    const parsedData = parseCCCDText(text);
    
    return {
      success: true,
      data: parsedData,
      confidence: 0.8, // Placeholder confidence score
    };
  } catch (error) {
    console.error('OCR Error:', error);
    return {
      success: false,
      error: 'Failed to scan CCCD. Please try again with a clearer image.',
    };
  }
}

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = error => reject(error);
  });
}

function parseCCCDText(text: string): CCCDData {
  const lines = text.split('\n').filter(line => line.trim());
  
  // Initialize data object
  const data: CCCDData = {
    cardNumber: '',
    fullName: '',
    dateOfBirth: '',
    sex: '',
    nationality: '',
    placeOfOrigin: '',
    placeOfResidence: '',
    dateOfExpiry: '',
  };

  // Extract card number (usually 12 digits)
  const cardNumberMatch = text.match(/\b\d{12}\b/);
  if (cardNumberMatch) {
    data.cardNumber = cardNumberMatch[0];
  }

  // Extract dates (DD/MM/YYYY format)
  const dateMatches = text.match(/\d{2}\/\d{2}\/\d{4}/g);
  if (dateMatches && dateMatches.length >= 2) {
    data.dateOfBirth = dateMatches[0];
    data.dateOfExpiry = dateMatches[1];
  }

  // Extract name (look for Vietnamese name patterns)
  const nameMatch = text.match(/(?:Họ và tên|Full name)[:\s]*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]+)/i);
  if (nameMatch) {
    data.fullName = nameMatch[1].trim();
  }

  // Extract sex
  const sexMatch = text.match(/(?:Giới tính|Sex)[:\s]*(Nam|Nữ|Male|Female)/i);
  if (sexMatch) {
    data.sex = sexMatch[1];
  }

  // Extract nationality
  const nationalityMatch = text.match(/(?:Quốc tịch|Nationality)[:\s]*(Việt Nam|Vietnam)/i);
  if (nationalityMatch) {
    data.nationality = nationalityMatch[1];
  }

  // Extract place of origin and residence
  const originMatch = text.match(/(?:Quê quán|Place of origin)[:\s]*([^,\n]+)/i);
  if (originMatch) {
    data.placeOfOrigin = originMatch[1].trim();
  }

  const residenceMatch = text.match(/(?:Nơi thường trú|Place of residence)[:\s]*([^,\n]+)/i);
  if (residenceMatch) {
    data.placeOfResidence = residenceMatch[1].trim();
  }

  return data;
} 