import { decode, encode } from "base64-arraybuffer";

import { normalizePurchaseDate, normalizeTime } from "@/lib/receiptNormalize";
import { getSupabase, isSupabaseConfigured, PROOF_BUCKET } from "@/lib/supabase";
import { ExtractionResult } from "@/types";

export interface ReceiptItem {
  name: string;
  price: number | null;
}

/** Matches the edge function response shape. */
export interface ReceiptExtractResponse {
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

export interface ReceiptReadResult extends ExtractionResult {
  success: boolean;
  isReceipt: boolean;
  items: ReceiptItem[];
  itemName?: string | null;
  itemNames?: string[];
  sourceType?: "physical_receipt" | "online_order" | "unknown";
  returnPolicyText?: string | null;
  warrantyText?: string | null;
  error?: string | null;
}

const EMPTY_FAILURE: ReceiptReadResult = {
  success: false,
  isReceipt: false,
  confidence: 0,
  rawExtractedText: "",
  items: [],
  needsReview: true,
  suggestedStoreName: null,
  suggestedItemName: null,
  suggestedPurchaseDate: null,
  suggestedPurchaseTime: null,
  suggestedTotalAmount: null,
  suggestedCurrency: null,
  suggestedReceiptNumber: null,
  suggestedOrderNumber: null,
  suggestedReturnPolicyText: null,
  suggestedWarrantyText: null,
  error: "Could not read receipt",
};

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

async function uriToArrayBuffer(
  uri: string
): Promise<{ buffer: ArrayBuffer; contentType: string }> {
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

function mapExtractionPayload(data: Record<string, unknown>): ReceiptReadResult {
  const items = Array.isArray(data.items)
    ? (data.items as ReceiptItem[]).filter((i) => i?.name)
    : [];
  const itemNames = items.map((i) => i.name);
  const itemName = itemNames[0] ?? null;
  const storeName = (data.storeName as string | null) ?? null;
  const purchaseDate = normalizePurchaseDate(data.purchaseDate as string | null);
  const purchaseTime = normalizeTime(data.purchaseTime as string | null);
  const rawTotal = data.totalAmount;
  const totalAmount =
    typeof rawTotal === "number"
      ? rawTotal
      : rawTotal != null
      ? parseFloat(String(rawTotal))
      : null;

  return {
    success: data.success === true,
    isReceipt: data.isReceipt === true,
    confidence: typeof data.confidence === "number" ? data.confidence : 0,
    rawExtractedText: (data.rawExtractedText as string) ?? "",
    suggestedStoreName: storeName,
    suggestedItemName: itemName,
    suggestedPurchaseDate: purchaseDate,
    suggestedPurchaseTime: purchaseTime,
    suggestedTotalAmount: Number.isFinite(totalAmount!) ? totalAmount : null,
    suggestedCurrency: (data.currency as string | null) ?? null,
    suggestedReceiptNumber: (data.receiptNumber as string | null) ?? null,
    suggestedOrderNumber: (data.orderNumber as string | null) ?? null,
    suggestedReturnPolicyText: (data.returnPolicyText as string | null) ?? null,
    suggestedWarrantyText: (data.warrantyText as string | null) ?? null,
    needsReview: true,
    items,
    itemName,
    itemNames,
    sourceType: "physical_receipt",
    returnPolicyText: (data.returnPolicyText as string | null) ?? null,
    warrantyText: (data.warrantyText as string | null) ?? null,
    error: (data.error as string | null) ?? null,
  };
}

const EXTRACT_TIMEOUT_MS = 45_000;

async function invokeExtractReceipt(
  body: Record<string, unknown>
): Promise<ReceiptReadResult> {
  if (!isSupabaseConfigured) return { ...EMPTY_FAILURE };

  const supabase = getSupabase();

  const invokePromise = supabase.functions.invoke("extract-receipt", { body });
  const timeoutPromise = new Promise<never>((_, reject) =>
    setTimeout(() => reject(new Error("timeout")), EXTRACT_TIMEOUT_MS)
  );

  try {
    const { data, error } = await Promise.race([invokePromise, timeoutPromise]);

    if (data && typeof data === "object") {
      return mapExtractionPayload(data as Record<string, unknown>);
    }

    if (error) {
      console.warn("extract-receipt invoke error:", error.message);
      const ctx = (error as { context?: { json?: () => Promise<unknown> } })
        .context;
      if (ctx?.json) {
        try {
          const payload = (await ctx.json()) as Record<string, unknown>;
          return mapExtractionPayload(payload);
        } catch {
          // ignore
        }
      }
    }
  } catch (err) {
    console.warn("extract-receipt failed:", err);
  }

  return { ...EMPTY_FAILURE };
}

export function hasUsefulExtractedDetails(result: ReceiptReadResult | null): boolean {
  if (!result?.success || !result.isReceipt) return false;
  return !!(
    result.suggestedStoreName ||
    result.suggestedPurchaseDate ||
    result.suggestedTotalAmount != null ||
    result.suggestedItemName ||
    (result.items && result.items.length > 0)
  );
}

export function isNotReceiptImage(result: ReceiptReadResult | null): boolean {
  if (!result) return false;
  return result.success && !result.isReceipt;
}

export async function ensureReceiptReadingSession(): Promise<string | null> {
  if (!isSupabaseConfigured) return null;

  const supabase = getSupabase();
  const { data: sessionData } = await supabase.auth.getSession();
  if (sessionData.session?.user.id) {
    return sessionData.session.user.id;
  }

  try {
    const { data, error } = await supabase.auth.signInAnonymously();
    if (error) {
      console.warn("Anonymous session unavailable:", error.message);
      return null;
    }
    return data.session?.user.id ?? null;
  } catch (err) {
    console.warn("Could not start receipt reading session:", err);
    return null;
  }
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

async function readReceiptFromStorage(
  storagePath: string
): Promise<ReceiptReadResult> {
  return invokeExtractReceipt({ storagePath });
}

async function readReceiptFromLocalImage(
  localUri: string
): Promise<ReceiptReadResult> {
  const { buffer, contentType } = await uriToArrayBuffer(localUri);
  const imageBase64 = encode(buffer);
  return invokeExtractReceipt({ imageBase64, mimeType: contentType });
}

/** Upload then read; falls back to direct image payload if storage read fails. */
export async function readReceiptImage(
  localUri: string,
  userId: string | null
): Promise<{
  extraction: ReceiptReadResult;
  storagePath: string | null;
  signedUrl: string | null;
}> {
  let storagePath: string | null = null;
  let signedUrl: string | null = null;
  let extraction: ReceiptReadResult = { ...EMPTY_FAILURE };

  if (!isSupabaseConfigured) {
    return { extraction, storagePath, signedUrl };
  }

  if (userId && userId !== "local-user") {
    try {
      const uploaded = await uploadReceiptImage(localUri, userId);
      storagePath = uploaded.storagePath;
      signedUrl = uploaded.signedUrl;
      extraction = await readReceiptFromStorage(storagePath);
    } catch (err) {
      console.warn("Receipt upload failed, trying direct read:", err);
    }
  }

  if (!extraction.success && !extraction.isReceipt) {
    const direct = await readReceiptFromLocalImage(localUri);
    if (direct.success || direct.isReceipt || direct.suggestedStoreName) {
      extraction = direct;
    } else if (!extraction.success) {
      extraction = direct;
    }
  }

  return { extraction, storagePath, signedUrl };
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
