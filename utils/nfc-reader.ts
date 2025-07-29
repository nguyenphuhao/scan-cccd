import { CCCDData, ScanResult } from '@/types/cccd';

interface NFCReadResult {
  success: boolean;
  data?: any;
  error?: string;
}

export class CCCDNFCReader {
  private isSupported: boolean = false;
  private reader: any = null;

  constructor() {
    // Check if Web NFC API is supported
    this.isSupported = 'NDEFReader' in window;
  }

  isNFCSupported(): boolean {
    return this.isSupported;
  }

  async requestPermission(): Promise<boolean> {
    try {
      if (!this.isSupported) {
        throw new Error('NFC not supported on this device');
      }

      // Request NFC permissions
      const permission = await navigator.permissions.query({ name: 'nfc' as any });
      return permission.state === 'granted' || permission.state === 'prompt';
    } catch (error) {
      console.error('NFC permission error:', error);
      return false;
    }
  }

  async startReading(): Promise<ScanResult> {
    try {
      if (!this.isSupported) {
        return {
          success: false,
          error: 'NFC is not supported on this device. Please use QR code scanning instead.',
        };
      }

      // Create NFC reader
      this.reader = new (window as any).NDEFReader();

      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          this.stopReading();
          resolve({
            success: false,
            error: 'NFC reading timeout. Please ensure the CCCD card is close to your device.',
          });
        }, 30000); // 30 second timeout

        this.reader.addEventListener('reading', (event: any) => {
          clearTimeout(timeout);
          console.log('NFC tag detected:', event);
          
          const nfcData = this.parseNFCData(event);
          if (nfcData.success) {
            resolve({
              success: true,
              data: nfcData.data,
              confidence: 0.99, // NFC is very reliable
            });
          } else {
            resolve({
              success: false,
              error: 'Could not read CCCD data from NFC tag.',
            });
          }
        });

        this.reader.addEventListener('readingerror', (error: any) => {
          clearTimeout(timeout);
          console.error('NFC reading error:', error);
          resolve({
            success: false,
            error: 'NFC reading failed. Please try again.',
          });
        });

        // Start scanning
        this.reader.scan({ signal: new AbortController().signal })
          .catch((error: any) => {
            clearTimeout(timeout);
            console.error('NFC scan error:', error);
            resolve({
              success: false,
              error: 'Failed to start NFC scanning. Please check permissions.',
            });
          });
      });
    } catch (error) {
      console.error('NFC start reading error:', error);
      return {
        success: false,
        error: 'NFC functionality is not available.',
      };
    }
  }

  stopReading(): void {
    if (this.reader) {
      try {
        this.reader.stop?.();
      } catch (error) {
        console.error('Error stopping NFC reader:', error);
      }
      this.reader = null;
    }
  }

  private parseNFCData(event: any): NFCReadResult {
    try {
      const { message } = event;
      let cccdData: CCCDData | null = null;

      // Parse NDEF records
      for (const record of message.records) {
        console.log('NFC Record:', record);
        
        if (record.recordType === 'text') {
          // Handle text records
          const textData = new TextDecoder().decode(record.data);
          console.log('NFC Text Data:', textData);
          cccdData = this.parseCCCDText(textData);
        } else if (record.recordType === 'mime') {
          // Handle MIME type records (common for CCCD)
          const mimeData = new TextDecoder().decode(record.data);
          console.log('NFC MIME Data:', mimeData);
          cccdData = this.parseCCCDText(mimeData);
        } else if (record.recordType === 'url') {
          // Handle URL records
          const urlData = new TextDecoder().decode(record.data);
          console.log('NFC URL Data:', urlData);
          cccdData = this.parseURLData(urlData);
        }

        if (cccdData) break; // Found valid data
      }

      if (cccdData) {
        return {
          success: true,
          data: cccdData,
        };
      }

      return {
        success: false,
        error: 'No CCCD data found in NFC tag',
      };
    } catch (error) {
      console.error('NFC parsing error:', error);
      return {
        success: false,
        error: 'Failed to parse NFC data',
      };
    }
  }

  private parseCCCDText(text: string): CCCDData | null {
    try {
      // CCCD NFC data is usually in JSON format or pipe-separated
      let data: CCCDData = {
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
      if (text.startsWith('{')) {
        const jsonData = JSON.parse(text);
        data = {
          cardNumber: jsonData.cccd || jsonData.id || jsonData.cardNumber || '',
          fullName: jsonData.name || jsonData.fullName || jsonData.ho_ten || '',
          dateOfBirth: this.formatDate(jsonData.dob || jsonData.dateOfBirth || jsonData.ngay_sinh || ''),
          sex: jsonData.sex || jsonData.gender || jsonData.gioi_tinh || '',
          nationality: 'Việt Nam',
          placeOfOrigin: jsonData.placeOfOrigin || jsonData.que_quan || '',
          placeOfResidence: jsonData.placeOfResidence || jsonData.noi_thuong_tru || '',
          dateOfExpiry: this.formatDate(jsonData.expiry || jsonData.dateOfExpiry || jsonData.ngay_het_han || ''),
          dateOfIssue: this.formatDate(jsonData.issued || jsonData.dateOfIssue || jsonData.ngay_cap || ''),
        };
        return data;
      }

      // Try pipe-separated format
      if (text.includes('|')) {
        const parts = text.split('|');
        if (parts.length >= 6) {
          data = {
            cardNumber: parts[0]?.trim() || '',
            fullName: parts[1]?.trim() || '',
            dateOfBirth: this.formatDate(parts[2]?.trim() || ''),
            sex: parts[3]?.trim() || '',
            nationality: 'Việt Nam',
            placeOfOrigin: parts[4]?.trim() || '',
            placeOfResidence: parts[4]?.trim() || '', // Often same as origin
            dateOfExpiry: this.formatDate(parts[5]?.trim() || ''),
          };
          return data;
        }
      }

      return null;
    } catch (error) {
      console.error('Error parsing CCCD text:', error);
      return null;
    }
  }

  private parseURLData(url: string): CCCDData | null {
    try {
      // Some CCCD cards store data as URL parameters
      const urlObj = new URL(url);
      const params = urlObj.searchParams;

      const data: CCCDData = {
        cardNumber: params.get('cccd') || params.get('id') || '',
        fullName: params.get('name') || params.get('fullName') || '',
        dateOfBirth: this.formatDate(params.get('dob') || params.get('dateOfBirth') || ''),
        sex: params.get('sex') || params.get('gender') || '',
        nationality: 'Việt Nam',
        placeOfOrigin: params.get('origin') || params.get('placeOfOrigin') || '',
        placeOfResidence: params.get('residence') || params.get('placeOfResidence') || '',
        dateOfExpiry: this.formatDate(params.get('expiry') || params.get('dateOfExpiry') || ''),
      };

      // Check if we got any meaningful data
      if (data.cardNumber || data.fullName) {
        return data;
      }

      return null;
    } catch (error) {
      console.error('Error parsing URL data:', error);
      return null;
    }
  }

  private formatDate(dateStr: string): string {
    if (!dateStr) return '';
    
    // Handle various date formats
    const formats = [
      /(\d{2})\/(\d{2})\/(\d{4})/, // DD/MM/YYYY
      /(\d{4})-(\d{2})-(\d{2})/, // YYYY-MM-DD
      /(\d{2})-(\d{2})-(\d{4})/, // DD-MM-YYYY
    ];
    
    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[1]) { // YYYY-MM-DD
          return `${match[3]}/${match[2]}/${match[1]}`;
        }
        return dateStr; // Already in correct format
      }
    }
    
    return dateStr;
  }
}

// Export singleton instance
export const nfcReader = new CCCDNFCReader(); 