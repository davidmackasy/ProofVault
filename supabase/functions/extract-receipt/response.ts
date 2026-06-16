export interface ReceiptItem {
  name: string;
  price: number | null;
}

export interface ExtractReceiptResponse {
  success: boolean;
  isReceipt: boolean;
  storeName: string | null;
  purchaseDate: string | null;
  purchaseTime: string | null;
  totalAmount: number | null;
  currency: string | null;
  items: ReceiptItem[];
  receiptNumber: string | null;
  orderNumber: string | null;
  returnPolicyText: string | null;
  warrantyText: string | null;
  confidence: number;
  rawExtractedText: string;
  error: string | null;
}

export function failureResponse(
  error = "Could not read receipt"
): ExtractReceiptResponse {
  return {
    success: false,
    isReceipt: false,
    storeName: null,
    purchaseDate: null,
    purchaseTime: null,
    totalAmount: null,
    currency: null,
    items: [],
    receiptNumber: null,
    orderNumber: null,
    returnPolicyText: null,
    warrantyText: null,
    confidence: 0,
    rawExtractedText: "",
    error,
  };
}

export function emptyReceiptResponse(
  rawExtractedText = ""
): ExtractReceiptResponse {
  return {
    success: true,
    isReceipt: false,
    storeName: null,
    purchaseDate: null,
    purchaseTime: null,
    totalAmount: null,
    currency: null,
    items: [],
    receiptNumber: null,
    orderNumber: null,
    returnPolicyText: null,
    warrantyText: null,
    confidence: 0,
    rawExtractedText,
    error: null,
  };
}
