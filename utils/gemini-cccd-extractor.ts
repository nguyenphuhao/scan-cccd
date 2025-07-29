import { GoogleGenerativeAI } from '@google/generative-ai';
import { CCCDData, ScanResult } from '@/types/cccd';

// Initialize Gemini client only when needed (client-side)
function getGeminiClient(): GoogleGenerativeAI {
  if (typeof window === 'undefined') {
    throw new Error('Gemini client can only be used on the client side');
  }
  
  const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('Gemini API key is not configured. Please add NEXT_PUBLIC_GEMINI_API_KEY to your environment variables.');
  }
  
  return new GoogleGenerativeAI(apiKey);
}

export async function extractCCCDWithGemini(imageFile: File): Promise<ScanResult> {
  try {
    console.log('Starting Gemini CCCD extraction...');
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Remove the data URL prefix to get just the base64 data
    const base64Data = base64Image.split(',')[1];
    
    // Get Gemini client
    const genAI = getGeminiClient();
    
    // Get the generative model
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.0-flash-exp",
      generationConfig: {
        temperature: 0.1,
        maxOutputTokens: 1000,
      }
    });
    
    // Create the prompt for CCCD extraction
    const prompt = createCCCDExtractionPrompt();
    
    console.log('Sending request to Gemini...');
    
    // Prepare the content for Gemini
    const contents = [
      {
        inlineData: {
          mimeType: imageFile.type || 'image/jpeg',
          data: base64Data,
        },
      },
      { text: prompt },
    ];

    const result = await model.generateContent(contents);
    const response = await result.response;
    const extractedText = response.text();
    
    if (!extractedText) {
      throw new Error('No response received from Gemini');
    }

    console.log('Gemini response:', extractedText);

    // Parse the JSON response
    const parsedData = parseGeminiResponse(extractedText);
    
    // Validate that we got some data
    const hasData = Object.values(parsedData).some(value => value && value.toString().trim().length > 0);
    
    if (!hasData) {
      return {
        success: false,
        error: 'Không thể trích xuất thông tin CCCD từ ảnh. Vui lòng đảm bảo ảnh rõ nét và chứa thẻ CCCD Việt Nam.',
      };
    }

    console.log('Parsed CCCD data:', parsedData);

    return {
      success: true,
      data: parsedData,
      confidence: 0.95,
    };

  } catch (error) {
    console.error('Gemini CCCD extraction error:', error);
    
            let errorMessage = 'Không thể trích xuất thông tin CCCD bằng Gemini AI.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Khóa API Gemini chưa được cấu hình. Vui lòng thêm khóa API vào biến môi trường.';
      } else if (error.message.includes('quota') || error.message.includes('limit')) {
        errorMessage = 'Đã vượt quá hạn ngạch API Gemini. Vui lòng thử lại sau.';
      } else if (error.message.includes('invalid') || error.message.includes('format')) {
        errorMessage = 'Định dạng ảnh không hợp lệ. Vui lòng tải lên ảnh CCCD rõ nét.';
      } else if (error.message.includes('SAFETY')) {
        errorMessage = 'Ảnh bị chặn bởi bộ lọc an toàn. Vui lòng thử ảnh khác.';
      }
    }

    return {
      success: false,
      error: errorMessage,
    };
  }
}

function createCCCDExtractionPrompt(): string {
  return `You are an expert at extracting information from Vietnamese Citizen Identity Cards (Căn cước công dân - CCCD).

Please analyze this image and extract ALL the information from the Vietnamese CCCD card. Return the data in JSON format with these exact field names:

{
  "cardNumber": "12-digit ID number",
  "fullName": "Full name as shown on card",
  "dateOfBirth": "Date of birth in DD/MM/YYYY format",
  "sex": "Nam or Nữ",
  "nationality": "Nationality (usually Việt Nam)",
  "placeOfOrigin": "Place of origin (Quê quán)",
  "placeOfResidence": "Place of residence (Nơi thường trú)",
  "dateOfExpiry": "Expiry date in DD/MM/YYYY format",
  "dateOfIssue": "Issue date in DD/MM/YYYY format if visible",
  "issuingAuthority": "Issuing authority if visible"
}

CRITICAL INSTRUCTIONS:
1. Extract text EXACTLY as it appears on the card
2. For dates, use DD/MM/YYYY format
3. If a field is not visible or unclear, use an empty string ""
4. Return ONLY valid JSON, no additional text or explanations
5. Pay special attention to Vietnamese diacritical marks (accents like ă, â, ê, ô, ơ, ư, đ)
6. The card number should be exactly 12 digits
7. Sex should be either "Nam" (male) or "Nữ" (female)
8. Names should preserve ALL Vietnamese accent marks
9. Addresses should preserve ALL Vietnamese place names with correct accents

Look carefully at ALL text on the card, including:
- Front side: Basic information
- Back side: Additional details like issue date and authority
- Small text and numbers
- Vietnamese text with proper diacritical marks

Return ONLY the JSON object, nothing else.`;
}

function parseGeminiResponse(response: string): CCCDData {
  try {
    // Clean the response to extract JSON
    let jsonString = response.trim();
    
    // Remove markdown code blocks if present
    jsonString = jsonString.replace(/```json\s*/, '').replace(/```\s*$/, '');
    
    // Find JSON object in response
    const jsonMatch = jsonString.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const cleanJson = jsonMatch[0];
    const parsed = JSON.parse(cleanJson);

    // Map to our CCCD data structure
    const cccdData: CCCDData = {
      cardNumber: parsed.cardNumber || '',
      fullName: parsed.fullName || '',
      dateOfBirth: parsed.dateOfBirth || '',
      sex: parsed.sex || '',
      nationality: parsed.nationality || 'Việt Nam',
      placeOfOrigin: parsed.placeOfOrigin || '',
      placeOfResidence: parsed.placeOfResidence || '',
      dateOfExpiry: parsed.dateOfExpiry || '',
      dateOfIssue: parsed.dateOfIssue || '',
      issuingAuthority: parsed.issuingAuthority || '',
    };

    return cccdData;

  } catch (error) {
    console.error('Error parsing Gemini response:', error);
    console.log('Raw response:', response);
    
    // Return empty data structure if parsing fails
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

async function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === 'string') {
        resolve(reader.result);
      } else {
        reject(new Error('Failed to convert file to base64'));
      }
    };
    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
} 