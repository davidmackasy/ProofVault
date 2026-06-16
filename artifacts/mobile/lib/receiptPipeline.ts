import { decode } from "base64-arraybuffer";

import { getSupabase, isSupabaseConfigured, PROOF_BUCKET } from "@/lib/supabase";
import { ExtractionResult } from "@/types";

export interface ReceiptReadResult extends ExtractionResult {
  itemName?: string | null;
  itemNames?: string[];
  sourceType?: "physical_receipt" | "online_order" | "unknown";
  returnPolicyText?: string | null;
  warrantyText?: string | null;
}

function guessContentType(uri: string): string {
  const lower = uri.toLowerCase();
  if (lower.includes(".png")) return "image/png";
  if (lower.includes(".webp")) return "image/webp";
  if (lower.includes(".pdf")) return "application/pdf";
  return "image/jpeg";
}

function extensionForContentType(contentType: string): string {
  if (contentType.includes("png")) return "png";
  if (contentType.includes("webp")) return "webp";
  if (contentType.includes("pdf")) return "pdf";
  return "jpg";
}

async function uriToArrayBuffer(uri: string): Promise<{ buffer: ArrayBuffer; contentType: string }> {
  if (uri.startsWith("data:")) {
    const match = uri.match(/^data:([^;]+);base64,(.+)$/);
    if (!match) throw new Error("Invalid data URI");
    return { buffer: decode(match[2]!), contentType: match[1]! };
  }

  const response = await fetch(uri);
  if (!response.ok) throw new Error("Could not read receipt image");
  const contentType =
    response.headers.get("content-type") ?? guessContentType(uri);
  const buffer = await response.arrayBuffer();
  return { buffer, contentType };
}

export async function uploadReceiptImage(
  localUri: string,
  userId: string
): Promise<{ storagePath: string; signedUrl: string }> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabase();
  const { buffer, contentType } = await uriToArrayBuffer(localUri);
  const ext = extensionForContentType(contentType);
  const storagePath = `${userId}/receipts/${Date.now()}-${Math.random().toString(36).slice(2, 9)}.${ext}`;

  const { error: uploadError } = await supabase.storage
    .from(PROOF_BUCKET)
    .upload(storagePath, buffer, {
      contentType,
      upsert: false,
    });

  if (uploadError) throw uploadError;

  const { data: signed, error: signError } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 365);

  if (signError || !signed?.signedUrl) {
    throw signError ?? new Error("Could not create signed URL");
  }

  return { storagePath, signedUrl: signed.signedUrl };
}

export async function readReceiptFromStorage(
  storagePath: string
): Promise<ReceiptReadResult | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = getSupabase();
  const { data, error } = await supabase.functions.invoke("extract-receipt", {
    body: { storagePath },
  });

  if (error) {
    console.warn("readReceiptFromStorage:", error.message);
    return null;
  }

  if (!data || data.error) return null;

  return {
    confidence: data.confidence ?? 0,
    rawExtractedText: data.rawExtractedText ?? "",
    suggestedStoreName: data.storeName ?? null,
    suggestedItemName: data.itemName ?? data.itemNames?.[0] ?? null,
    suggestedPurchaseDate: data.purchaseDate ?? null,
    suggestedPurchaseTime: data.purchaseTime ?? null,
    suggestedTotalAmount: data.totalAmount ?? null,
    suggestedCurrency: data.currency ?? null,
    suggestedReceiptNumber: data.receiptNumber ?? null,
    suggestedOrderNumber: data.orderNumber ?? null,
    suggestedReturnPolicyText: data.returnPolicyText ?? null,
    suggestedWarrantyText: data.warrantyText ?? null,
    needsReview: true,
    itemName: data.itemName ?? null,
    itemNames: data.itemNames ?? [],
    sourceType: data.sourceType ?? "unknown",
    returnPolicyText: data.returnPolicyText ?? null,
    warrantyText: data.warrantyText ?? null,
  };
}

export async function refreshSignedProofUrl(
  storagePath: string
): Promise<string | undefined> {
  if (!isSupabaseConfigured) return undefined;
  const supabase = getSupabase();
  const { data } = await supabase.storage
    .from(PROOF_BUCKET)
    .createSignedUrl(storagePath, 60 * 60 * 24 * 7);
  return data?.signedUrl;
}
