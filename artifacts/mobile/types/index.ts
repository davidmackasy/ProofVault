export type PurchaseStatus =
  | "returnable"
  | "ending_soon"
  | "under_warranty"
  | "needs_proof"
  | "expired"
  | "archived"
  | "fully_protected";

export type ProofType =
  | "receipt"
  | "online_order"
  | "item_photo"
  | "serial_number"
  | "box_photo"
  | "warranty_card"
  | "notes";

export interface ProofFile {
  id: string;
  itemId: string;
  userId: string;
  type: ProofType;
  fileUrl?: string;
  thumbnailUrl?: string;
  textValue?: string;
  createdAt: string;
}

export interface ExtractionResult {
  confidence: number;
  rawExtractedText?: string;
  suggestedStoreName?: string | null;
  suggestedItemName?: string | null;
  suggestedPurchaseDate?: string | null;
  suggestedPurchaseTime?: string | null;
  suggestedTotalAmount?: number | null;
  suggestedCurrency?: string | null;
  suggestedReceiptNumber?: string | null;
  suggestedOrderNumber?: string | null;
  suggestedReturnPolicyText?: string | null;
  suggestedWarrantyText?: string | null;
  needsReview: boolean;
}

export interface PurchaseItem {
  id: string;
  userId: string;
  itemName: string;
  itemDescription?: string;
  storeName?: string;
  category?: string;
  purchaseDate?: string;
  purchaseTime?: string;
  totalAmount?: number;
  currency?: string;
  receiptNumber?: string;
  orderNumber?: string;
  returnDeadline?: string;
  warrantyExpiry?: string;
  status: PurchaseStatus;
  proofComplete: boolean;
  proofPack: ProofFile[];
  notes?: string;
  sourceType: "physical_receipt" | "online_order" | "manual" | "unknown";
  extractionResult?: ExtractionResult;
  createdAt: string;
  updatedAt: string;
}
