import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ReceiptReadResult } from "@/lib/receiptPipeline";
import { ExtractionResult } from "@/types";

export type ReadStatus = "idle" | "uploading" | "reading" | "done" | "partial";

interface AddPurchaseFlowContextValue {
  capturedReceiptUri: string | null;
  setCapturedReceiptUri: (uri: string | null) => void;
  receiptStoragePath: string | null;
  receiptSignedUrl: string | null;
  setReceiptUpload: (storagePath: string, signedUrl: string) => void;
  extractionResult: ReceiptReadResult | null;
  setExtractionResult: (result: ReceiptReadResult | null) => void;
  readStatus: ReadStatus;
  setReadStatus: (status: ReadStatus) => void;
  readComplete: boolean;
  setReadComplete: (complete: boolean) => void;
  clearCapturedReceipt: () => void;
  resetFlow: () => void;
}

const AddPurchaseFlowContext = createContext<AddPurchaseFlowContextValue | null>(
  null
);

export function AddPurchaseFlowProvider({ children }: { children: ReactNode }) {
  const [capturedReceiptUri, setCapturedReceiptUriState] = useState<
    string | null
  >(null);
  const [receiptStoragePath, setReceiptStoragePath] = useState<string | null>(
    null
  );
  const [receiptSignedUrl, setReceiptSignedUrl] = useState<string | null>(null);
  const [extractionResult, setExtractionResultState] =
    useState<ReceiptReadResult | null>(null);
  const [readStatus, setReadStatus] = useState<ReadStatus>("idle");
  const [readComplete, setReadComplete] = useState(false);

  const setCapturedReceiptUri = useCallback((uri: string | null) => {
    setCapturedReceiptUriState(uri);
  }, []);

  const setReceiptUpload = useCallback((storagePath: string, signedUrl: string) => {
    setReceiptStoragePath(storagePath);
    setReceiptSignedUrl(signedUrl);
  }, []);

  const setExtractionResult = useCallback((result: ReceiptReadResult | null) => {
    setExtractionResultState(result);
  }, []);

  const clearCapturedReceipt = useCallback(() => {
    setCapturedReceiptUriState(null);
    setReceiptStoragePath(null);
    setReceiptSignedUrl(null);
    setExtractionResultState(null);
    setReadStatus("idle");
    setReadComplete(false);
  }, []);

  const resetFlow = useCallback(() => {
    clearCapturedReceipt();
  }, [clearCapturedReceipt]);

  const value = useMemo(
    () => ({
      capturedReceiptUri,
      setCapturedReceiptUri,
      receiptStoragePath,
      receiptSignedUrl,
      setReceiptUpload,
      extractionResult,
      setExtractionResult,
      readStatus,
      setReadStatus,
      readComplete,
      setReadComplete,
      clearCapturedReceipt,
      resetFlow,
    }),
    [
      capturedReceiptUri,
      setCapturedReceiptUri,
      receiptStoragePath,
      receiptSignedUrl,
      setReceiptUpload,
      extractionResult,
      setExtractionResult,
      readStatus,
      readComplete,
      clearCapturedReceipt,
      resetFlow,
    ]
  );

  return (
    <AddPurchaseFlowContext.Provider value={value}>
      {children}
    </AddPurchaseFlowContext.Provider>
  );
}

export function useAddPurchaseFlow() {
  const context = useContext(AddPurchaseFlowContext);
  if (!context) {
    throw new Error(
      "useAddPurchaseFlow must be used within AddPurchaseFlowProvider"
    );
  }
  return context;
}

export function toExtractionResult(
  read: ReceiptReadResult | null
): ExtractionResult | undefined {
  if (!read) return undefined;
  return {
    confidence: read.confidence,
    rawExtractedText: read.rawExtractedText,
    suggestedStoreName: read.suggestedStoreName,
    suggestedItemName: read.suggestedItemName,
    suggestedPurchaseDate: read.suggestedPurchaseDate,
    suggestedPurchaseTime: read.suggestedPurchaseTime,
    suggestedTotalAmount: read.suggestedTotalAmount,
    suggestedCurrency: read.suggestedCurrency,
    suggestedReceiptNumber: read.suggestedReceiptNumber,
    suggestedOrderNumber: read.suggestedOrderNumber,
    suggestedReturnPolicyText: read.suggestedReturnPolicyText,
    suggestedWarrantyText: read.suggestedWarrantyText,
    needsReview: read.needsReview,
  };
}
