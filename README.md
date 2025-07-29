# CCCD Scanner - Vietnamese ID Card Scanner

A Next.js web application for scanning and extracting information from Vietnamese Citizen Identity Cards (CCCD) using mobile devices. The app supports both iOS and Android browsers and can be deployed on Vercel.

## Features

- 📱 **Mobile-Optimized**: Designed specifically for mobile web browsers on iOS and Android
- 📷 **Camera Capture**: Take photos directly using the device camera
- 📁 **File Upload**: Upload existing images from the device gallery
- 🔍 **OCR Scanning**: Extract text from CCCD images using Tesseract.js with Vietnamese language support
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
- **OCR**: Tesseract.js with Vietnamese language support
- **Camera**: react-webcam
- **Icons**: Lucide React
- **Deployment**: Vercel-ready

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn

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

3. Run the development server:
```bash
npm run dev
```

4. Open [http://localhost:3000](http://localhost:3000) in your mobile browser or desktop browser with mobile emulation.

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

No environment variables are required for basic functionality. The app works entirely client-side.

## Usage

1. **Access the App**: Open the web app on your mobile device
2. **Choose Input Method**:
   - Tap "Take Photo" to use the camera
   - Tap "Upload Image" to select from gallery
3. **Capture/Select Image**: Ensure the CCCD card is clearly visible
4. **Wait for Processing**: The app will scan and extract information
5. **Review Results**: Check the extracted information in the form
6. **Edit if Needed**: Tap the edit button to modify any fields
7. **Save**: Tap the save button to store the information

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