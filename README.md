# CCCD Scanner - Vietnamese ID Card Scanner

A Next.js web application for scanning and extracting information from Vietnamese Citizen Identity Cards (CCCD) using mobile devices. The app supports both iOS and Android browsers and can be deployed on Vercel.

## Features

- 📱 **Mobile-Optimized**: Designed specifically for mobile web browsers on iOS and Android
- 📷 **Camera Capture**: Take photos directly using the device camera
- 📁 **File Upload**: Upload existing images from the device gallery
- 🤖 **AI-Powered Extraction**: Advanced AI text recognition using OpenAI GPT-4 Vision or Google Gemini
- 🔍 **Multiple Extraction Methods**: Choose between OpenAI and Gemini for optimal accuracy and cost
- 📝 **Form Population**: Automatically populate form fields with extracted information
- ✏️ **Editable Results**: Edit extracted information before saving
- 🎨 **Modern UI**: Clean, responsive design with Tailwind CSS

## Supported CCCD Fields

The app can extract and display the following information from Vietnamese CCCD cards:

### Front Side
- Card Number (Số CCCD)
- Full Name (Họ và tên)
- Date of Birth (Ngày sinh)
- Sex (Giới tính)
- Nationality (Quốc tịch)
- Place of Origin (Quê quán)
- Place of Residence (Nơi thường trú)
- Date of Expiry (Có giá trị đến)

### Back Side (if available)
- Personal Identification (Đặc điểm nhân dạng)
- Date of Issue (Ngày cấp)
- Issuing Authority (Cơ quan cấp)

## Tech Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **AI Engines**: OpenAI GPT-4 Vision, Google Gemini 2.0 Flash
- **Fallback OCR**: Tesseract.js with Vietnamese language support
- **Camera**: react-webcam
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenAI API key (for GPT-4 Vision) OR Google AI API key (for Gemini)

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd scan-cccd
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Copy the example environment file
cp .env.example .env

# Edit .env file and add your actual API keys:
# At minimum, you need ONE of the following API keys:
NEXT_PUBLIC_OPENAI_API_KEY=sk-your-actual-openai-key-here
NEXT_PUBLIC_GEMINI_API_KEY=your-actual-gemini-key-here
```

**🔑 Getting API Keys:**

**OpenAI (Recommended for highest accuracy):**
1. Visit [OpenAI Platform](https://platform.openai.com/api-keys)
2. Create an account and add billing information
3. Generate a new API key
4. Cost: ~$0.01-0.03 per image

**Google Gemini (Recommended for cost-effectiveness):**
1. Visit [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Sign in with Google account
3. Create a new API key
4. Cost: Generous free tier available

**⚠️ Important:** 
- Keep your API keys secure and never commit them to version control
- You only need ONE API key to use the application
- Both engines support Vietnamese text with high accuracy

4. Run the development server:
```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser with mobile emulation.

### Building for Production

```bash
npm run build
npm start
```

## Deployment on Vercel

1. Push your code to a GitHub repository
2. Connect your repository to Vercel
3. Deploy with the following settings:
   - Framework Preset: Next.js
   - Build Command: `npm run build`
   - Output Directory: `.next`
   - Install Command: `npm install`

### Environment Variables

Set up the following environment variables in your Vercel dashboard:

```bash
NEXT_PUBLIC_OPENAI_API_KEY=your_openai_api_key_here
NEXT_PUBLIC_GEMINI_API_KEY=your_gemini_api_key_here
```

**Note**: At least one API key is required for AI-powered extraction to work.

## AI Engines Comparison

| Feature | OpenAI GPT-4 Vision | Google Gemini 2.0 Flash |
|---------|-------------------|-------------------------|
| **Accuracy** | 95%+ | 94%+ |
| **Speed** | 3-5 seconds | 1-3 seconds |
| **Cost** | $0.01-0.03/image | Free tier available |
| **Vietnamese Support** | Excellent | Excellent |
| **API Limits** | Pay-per-use | Generous free quotas |
| **Best For** | Highest accuracy needs | Cost-effective processing |

### Choosing an AI Engine

- **Choose OpenAI** if you need maximum accuracy and don't mind paying per request
- **Choose Gemini** if you want fast processing with generous free quotas
- Both engines support Vietnamese diacritical marks and handle complex layouts

## Usage

1. **Access the App**: Open the web app on your mobile device
2. **Choose AI Engine**: Select between OpenAI or Gemini based on your needs
3. **Choose Input Method**:
   - Tap "Take Photo (AI)" to use the camera
   - Tap "Upload Image (AI)" to select from gallery
4. **Capture/Select Image**: Ensure the CCCD card is clearly visible
5. **Wait for AI Processing**: The app will extract information using AI
6. **Review Results**: Check the extracted information in the form
7. **Edit if Needed**: Tap the edit button to modify any fields
8. **Save**: Tap the save button to store the information

## Mobile Optimization Features

- **Touch-Friendly**: Large buttons and touch targets
- **Responsive Design**: Optimized for various screen sizes
- **Camera Integration**: Native camera access on mobile devices
- **File Upload**: Gallery integration for image selection
- **Progressive Web App**: Can be installed as a PWA

## Browser Compatibility

- ✅ Chrome (Android)
- ✅ Safari (iOS)
- ✅ Firefox (Android)
- ✅ Samsung Internet
- ✅ Edge (Mobile)

## Development

### Project Structure

```
scan-cccd/
├── app/                    # Next.js app directory
│   ├── globals.css        # Global styles
│   ├── layout.tsx         # Root layout
│   └── page.tsx           # Main page component
├── components/             # React components
│   ├── CameraCapture.tsx  # Camera capture component
│   └── CCCDForm.tsx       # Form display component
├── types/                  # TypeScript type definitions
│   └── cccd.ts           # CCCD data types
├── utils/                  # Utility functions
│   └── ocr.ts            # OCR processing logic
└── public/                 # Static assets
```

### Adding New Features

1. **New OCR Fields**: Update the `parseCCCDText` function in `utils/ocr.ts`
2. **UI Components**: Add new components in the `components/` directory
3. **Types**: Extend the `CCCDData` interface in `types/cccd.ts`

## Troubleshooting

### Common Issues

1. **Camera Not Working**: Ensure HTTPS is enabled (required for camera access)
2. **OCR Not Accurate**: Try with better lighting and clearer images
3. **Mobile Layout Issues**: Test on actual mobile devices, not just desktop emulation

### Performance Tips

- Use high-quality images for better OCR accuracy
- Ensure good lighting when taking photos
- Keep the card steady and flat during capture

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test on mobile devices
5. Submit a pull request

## License

This project is licensed under the MIT License.

## Support

For issues and questions, please open an issue on the GitHub repository. 