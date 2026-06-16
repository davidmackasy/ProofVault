import { computeStatusFromItem } from "@/context/purchaseUtils";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";
import { refreshSignedProofUrl } from "@/lib/receiptPipeline";
import { ProofFile, PurchaseItem, PurchaseStatus } from "@/types";

type DbPurchase = {
  id: string;
  user_id: string;
  item_name: string;
  item_description: string | null;
  store_name: string | null;
  category: string | null;
  purchase_date: string | null;
  purchase_time: string | null;
  total_amount: number | null;
  currency: string | null;
  receipt_number: string | null;
  order_number: string | null;
  return_deadline: string | null;
  warranty_expiry: string | null;
  status: string;
  proof_complete: boolean;
  notes: string | null;
  return_policy_text: string | null;
  warranty_text: string | null;
  source_type: string;
  extraction_result: PurchaseItem["extractionResult"] | null;
  created_at: string;
  updated_at: string;
  proof_files: DbProofFile[] | null;
};

type DbProofFile = {
  id: string;
  purchase_id: string;
  user_id: string;
  type: string;
  storage_path: string | null;
  file_url: string | null;
  text_value: string | null;
  created_at: string;
};

async function mapProofFile(row: DbProofFile, itemId: string): Promise<ProofFile> {
  let fileUrl = row.file_url ?? undefined;
  if (row.storage_path) {
    const signed = await refreshSignedProofUrl(row.storage_path);
    if (signed) fileUrl = signed;
  }
  return {
    id: row.id,
    itemId,
    userId: row.user_id,
    type: row.type as ProofFile["type"],
    fileUrl,
    textValue: row.text_value ?? undefined,
    createdAt: row.created_at,
  };
}

async function mapPurchase(row: DbPurchase): Promise<PurchaseItem> {
  const proofPack = row.proof_files
    ? await Promise.all(row.proof_files.map((p) => mapProofFile(p, row.id)))
    : [];

  return {
    id: row.id,
    userId: row.user_id,
    itemName: row.item_name,
    itemDescription: row.item_description ?? undefined,
    storeName: row.store_name ?? undefined,
    category: row.category ?? undefined,
    purchaseDate: row.purchase_date ?? undefined,
    purchaseTime: row.purchase_time ?? undefined,
    totalAmount: row.total_amount ?? undefined,
    currency: row.currency ?? undefined,
    receiptNumber: row.receipt_number ?? undefined,
    orderNumber: row.order_number ?? undefined,
    returnDeadline: row.return_deadline ?? undefined,
    warrantyExpiry: row.warranty_expiry ?? undefined,
    status: row.status as PurchaseStatus,
    proofComplete: row.proof_complete,
    proofPack,
    notes: row.notes ?? undefined,
    sourceType: row.source_type as PurchaseItem["sourceType"],
    extractionResult: row.extraction_result ?? undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export async function fetchPurchasesFromSupabase(): Promise<PurchaseItem[]> {
  if (!isSupabaseConfigured) return [];
  const supabase = getSupabase();
  const { data, error } = await supabase
    .from("purchases")
    .select("*, proof_files(*)")
    .order("created_at", { ascending: false });

  if (error) throw error;
  if (!data) return [];
  return Promise.all(data.map((row) => mapPurchase(row as DbPurchase)));
}

export interface SavePurchaseInput {
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
  notes?: string;
  returnPolicyText?: string;
  warrantyText?: string;
  sourceType: PurchaseItem["sourceType"];
  extractionResult?: PurchaseItem["extractionResult"];
  receiptStoragePath?: string;
  receiptFileUrl?: string;
  localReceiptUri?: string;
}

export async function savePurchaseToSupabase(
  input: SavePurchaseInput,
  userId: string
): Promise<string> {
  if (!isSupabaseConfigured) {
    throw new Error("Supabase is not configured");
  }

  const supabase = getSupabase();
  const hasReceipt = !!(input.receiptStoragePath || input.receiptFileUrl || input.localReceiptUri);
  const draft: Omit<PurchaseItem, "id" | "createdAt" | "updatedAt" | "proofPack"> = {
    userId,
    itemName: input.itemName,
    itemDescription: input.itemDescription,
    storeName: input.storeName,
    category: input.category,
    purchaseDate: input.purchaseDate,
    purchaseTime: input.purchaseTime,
    totalAmount: input.totalAmount,
    currency: input.currency ?? "USD",
    receiptNumber: input.receiptNumber,
    orderNumber: input.orderNumber,
    returnDeadline: input.returnDeadline,
    warrantyExpiry: input.warrantyExpiry,
    notes: input.notes,
    sourceType: input.sourceType,
    extractionResult: input.extractionResult,
    proofComplete: hasReceipt,
    status: hasReceipt ? "returnable" : "needs_proof",
  };

  const status = computeStatusFromItem({
    ...draft,
    id: "",
    proofPack: hasReceipt
      ? [{ id: "", itemId: "", userId, type: "receipt", createdAt: "" }]
      : [],
    createdAt: "",
    updatedAt: "",
  });

  const { data: purchase, error: purchaseError } = await supabase
    .from("purchases")
    .insert({
      user_id: userId,
      item_name: input.itemName,
      item_description: input.itemDescription ?? null,
      store_name: input.storeName ?? null,
      category: input.category ?? null,
      purchase_date: input.purchaseDate ?? null,
      purchase_time: input.purchaseTime ?? null,
      total_amount: input.totalAmount ?? null,
      currency: input.currency ?? "USD",
      receipt_number: input.receiptNumber ?? null,
      order_number: input.orderNumber ?? null,
      return_deadline: input.returnDeadline ?? null,
      warranty_expiry: input.warrantyExpiry ?? null,
      notes: input.notes ?? null,
      return_policy_text: input.returnPolicyText ?? null,
      warranty_text: input.warrantyText ?? null,
      source_type: input.sourceType,
      extraction_result: input.extractionResult ?? null,
      proof_complete: hasReceipt,
      status,
    })
    .select("id")
    .single();

  if (purchaseError || !purchase) throw purchaseError ?? new Error("Save failed");

  if (hasReceipt) {
    const { error: proofError } = await supabase.from("proof_files").insert({
      purchase_id: purchase.id,
      user_id: userId,
      type: "receipt",
      storage_path: input.receiptStoragePath ?? null,
      file_url: input.receiptFileUrl ?? input.localReceiptUri ?? null,
    });
    if (proofError) throw proofError;
  }

  return purchase.id;
}
