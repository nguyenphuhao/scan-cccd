import { CCCDData, ScanResult } from '@/types/cccd';

interface GoogleVisionResponse {
  responses: Array<{
    textAnnotations: Array<{
      description: string;
      boundingPoly: {
        vertices: Array<{ x: number; y: number }>;
      };
    }>;
  }>;
}

export async function scanCCCDWithGoogleVision(imageFile: File): Promise<ScanResult> {
  try {
    console.log('Starting Google Vision OCR scan...');
    
    // Convert file to base64
    const base64 = await fileToBase64(imageFile);
    const base64Data = base64.split(',')[1]; // Remove data URL prefix
    
    // Google Cloud Vision API request
    const requestBody = {
      requests: [
        {
          image: {
            content: base64Data
          },
          features: [
            {
              type: 'TEXT_DETECTION',
              maxResults: 1
            }
          ],
          imageContext: {
            languageHints: ['vi', 'en'] // Vietnamese and English
          }
        }
      ]
    };

    // You'll need to set up Google Cloud Vision API and get an API key
    const API_KEY = process.env.NEXT_PUBLIC_GOOGLE_VISION_API_KEY;
    const response = await fetch(
      `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      }
    );

    if (!response.ok) {
      throw new Error(`Google Vision API error: ${response.status}`);
    }

    const result: GoogleVisionResponse = await response.json();
    const extractedText = result.responses[0]?.textAnnotations[0]?.description || '';
    
    console.log('Google Vision OCR completed, extracted text:', extractedText);
    
    // Parse the extracted text
    const parsedData = parseCCCDText(extractedText);
    console.log('Parsed CCCD data:', parsedData);
    
    // Check if we found any data
    const hasData = Object.values(parsedData).some(value => value && value.toString().length > 0);
    
    if (!hasData) {
      console.warn('No CCCD data found in extracted text');
      return {
        success: false,
        error: 'Could not extract CCCD information. Please ensure the card is clearly visible and try again.',
      };
    }
    
    return {
      success: true,
      data: parsedData,
      confidence: 0.95, // Google Vision typically has higher confidence
    };
  } catch (error) {
    console.error('Google Vision OCR Error:', error);
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
  console.log('Parsing Google Vision text:', text);
  
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

  // Extract card number (12 digits)
  const cardNumberMatch = text.match(/\b\d{12}\b/);
  if (cardNumberMatch) {
    data.cardNumber = cardNumberMatch[0];
    console.log('Found card number:', data.cardNumber);
  }

  // Extract dates (DD/MM/YYYY format)
  const dateMatches = text.match(/\d{2}\/\d{2}\/\d{4}/g);
  if (dateMatches && dateMatches.length >= 2) {
    data.dateOfBirth = dateMatches[0];
    data.dateOfExpiry = dateMatches[1];
    console.log('Found dates - Birth:', data.dateOfBirth, 'Expiry:', data.dateOfExpiry);
  } else if (dateMatches && dateMatches.length === 1) {
    data.dateOfBirth = dateMatches[0];
    console.log('Found single date (birth):', data.dateOfBirth);
  }

  // Extract name with multiple patterns
  const namePatterns = [
    /(?:Họ và tên|Full name|Họ tên)[:\s]*([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]{3,})/i,
    /([A-ZÀÁÂÃÈÉÊÌÍÒÓÔÕÙÚĂĐĨŨƠƯĂẠẢẤẦẨẪẬẮẰẲẴẶẸẺẼỀỀỂẾỄỆỈỊỌỎỐỒỔỖỘỚỜỞỠỢỤỦỨỪỬỮỰỲỴÝỶỸ\s]{3,})/i,
    /([A-Z][A-Z\s]+)/g
  ];
  
  for (const pattern of namePatterns) {
    const nameMatch = text.match(pattern);
    if (nameMatch && nameMatch[1] && nameMatch[1].trim().length > 2) {
      const name = nameMatch[1].trim();
      if (!name.includes('CỘNG HÒA') && !name.includes('VIỆT NAM') && !name.includes('CĂN CƯỚC')) {
        data.fullName = name;
        console.log('Found name:', data.fullName);
        break;
      }
    }
  }

  // Extract sex
  const sexPatterns = [
    /(?:Giới tính|Sex)[:\s]*(Nam|Nữ|Male|Female)/i,
    /(Nam|Nữ)/i
  ];
  
  for (const pattern of sexPatterns) {
    const sexMatch = text.match(pattern);
    if (sexMatch) {
      data.sex = sexMatch[1];
      console.log('Found sex:', data.sex);
      break;
    }
  }

  // Extract nationality
  const nationalityPatterns = [
    /(?:Quốc tịch|Nationality)[:\s]*(Việt Nam|Vietnam)/i,
    /(Việt Nam|Vietnam)/i
  ];
  
  for (const pattern of nationalityPatterns) {
    const nationalityMatch = text.match(pattern);
    if (nationalityMatch) {
      data.nationality = nationalityMatch[1];
      console.log('Found nationality:', data.nationality);
      break;
    }
  }

  // Extract place of origin
  const originPatterns = [
    /(?:Quê quán|Place of origin)[:\s]*([^,\n]+)/i,
    /(?:Quê quán)[:\s]*([^,\n]+)/i
  ];
  
  for (const pattern of originPatterns) {
    const originMatch = text.match(pattern);
    if (originMatch) {
      data.placeOfOrigin = originMatch[1].trim();
      console.log('Found place of origin:', data.placeOfOrigin);
      break;
    }
  }

  // Extract place of residence
  const residencePatterns = [
    /(?:Nơi thường trú|Place of residence)[:\s]*([^,\n]+)/i,
    /(?:Nơi thường trú)[:\s]*([^,\n]+)/i
  ];
  
  for (const pattern of residencePatterns) {
    const residenceMatch = text.match(pattern);
    if (residenceMatch) {
      data.placeOfResidence = residenceMatch[1].trim();
      console.log('Found place of residence:', data.placeOfResidence);
      break;
    }
  }

  // Additional fields for back side
  const personalIdMatch = text.match(/(?:Đặc điểm nhân dạng|Personal identification)[:\s]*([^,\n]+)/i);
  if (personalIdMatch) {
    data.personalIdentification = personalIdMatch[1].trim();
    console.log('Found personal identification:', data.personalIdentification);
  }

  const issueDateMatch = text.match(/(?:Ngày cấp|Date of issue)[:\s]*(\d{2}\/\d{2}\/\d{4})/i);
  if (issueDateMatch) {
    data.dateOfIssue = issueDateMatch[1];
    console.log('Found date of issue:', data.dateOfIssue);
  }

  const authorityMatch = text.match(/(?:Cơ quan cấp|Issuing authority)[:\s]*([^,\n]+)/i);
  if (authorityMatch) {
    data.issuingAuthority = authorityMatch[1].trim();
    console.log('Found issuing authority:', data.issuingAuthority);
  }

  console.log('Final parsed data:', data);
  return data;
} 