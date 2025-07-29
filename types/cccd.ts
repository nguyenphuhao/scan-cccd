export interface CCCDData {
  cardNumber: string;
  fullName: string;
  dateOfBirth: string;
  sex: string;
  nationality: string;
  placeOfOrigin: string;
  placeOfResidence: string;
  dateOfExpiry: string;
  personalIdentification?: string;
  dateOfIssue?: string;
  issuingAuthority?: string;
  fingerprints?: {
    leftIndex: string;
    rightIndex: string;
  };
}

export interface ScanResult {
  success: boolean;
  data?: CCCDData;
  error?: string;
  confidence?: number;
}

export interface FormData extends CCCDData {
  // Additional form fields if needed
} 