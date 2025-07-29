import OpenAI from 'openai';
import { CCCDData, ScanResult } from '@/types/cccd';

// Initialize OpenAI client only when needed (client-side)
function getOpenAIClient(): OpenAI {
  if (typeof window === 'undefined') {
    throw new Error('OpenAI client can only be used on the client side');
  }
  
  const apiKey = process.env.NEXT_PUBLIC_OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('OpenAI API key is not configured. Please add NEXT_PUBLIC_OPENAI_API_KEY to your environment variables.');
  }
  
  return new OpenAI({
    apiKey: apiKey,
    dangerouslyAllowBrowser: true // Required for client-side usage
  });
}

export async function extractCCCDWithOpenAI(imageFile: File): Promise<ScanResult> {
  try {
    console.log('Starting OpenAI CCCD extraction...');
    
    // Convert image to base64
    const base64Image = await fileToBase64(imageFile);
    
    // Create the prompt for CCCD extraction
    const prompt = createCCCDExtractionPrompt();
    
    console.log('Sending request to OpenAI...');
    
    // Get OpenAI client
    const openai = getOpenAIClient();
    
    const response = await openai.chat.completions.create({
      model: "gpt-4-vision-preview",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt
            },
            {
              type: "image_url",
              image_url: {
                url: base64Image,
                detail: "high"
              }
            }
          ]
        }
      ],
      max_tokens: 1000,
      temperature: 0.1 // Low temperature for consistent extraction
    });

    const extractedText = response.choices[0]?.message?.content;
    
    if (!extractedText) {
      throw new Error('No response received from OpenAI');
    }

    console.log('OpenAI response:', extractedText);

    // Parse the JSON response
    const parsedData = parseOpenAIResponse(extractedText);
    
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
    console.error('OpenAI CCCD extraction error:', error);
    
            let errorMessage = 'Không thể trích xuất thông tin CCCD bằng AI.';
    
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        errorMessage = 'Khóa API OpenAI chưa được cấu hình. Vui lòng thêm khóa API vào biến môi trường.';
      } else if (error.message.includes('rate limit') || error.message.includes('quota')) {
        errorMessage = 'Đã vượt quá giới hạn API OpenAI. Vui lòng thử lại sau.';
      } else if (error.message.includes('invalid image')) {
        errorMessage = 'Định dạng ảnh không hợp lệ. Vui lòng tải lên ảnh CCCD rõ nét.';
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

Please analyze the image and extract the following information from the Vietnamese CCCD card. Return the data in JSON format with these exact field names:

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

Important instructions:
1. Extract text exactly as it appears on the card
2. For dates, use DD/MM/YYYY format
3. If a field is not visible or unclear, use an empty string ""
4. Return only valid JSON, no additional text or explanations
5. Pay special attention to Vietnamese diacritical marks (accents)
6. The card number should be exactly 12 digits
7. Sex should be either "Nam" (male) or "Nữ" (female)

Return only the JSON object, nothing else.`;
}

function parseOpenAIResponse(response: string): CCCDData {
  try {
    // Clean the response to extract JSON
    const jsonMatch = response.match(/\{[\s\S]*\}/);
    
    if (!jsonMatch) {
      throw new Error('No JSON found in response');
    }

    const jsonString = jsonMatch[0];
    const parsed = JSON.parse(jsonString);

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
    console.error('Error parsing OpenAI response:', error);
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