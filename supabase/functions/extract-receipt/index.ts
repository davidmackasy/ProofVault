import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

import { getGoogleAccessToken, parseServiceAccount } from "./googleAuth.ts";
import { parseExpenseDocument } from "./parseDocument.ts";
import { ExtractReceiptResponse, failureResponse } from "./response.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

async function loadImageBytes(
  supabaseUrl: string,
  serviceKey: string,
  storagePath: string | null,
  imageBase64: string | null,
  mimeType: string
): Promise<{ content: string; mimeType: string }> {
  if (imageBase64) {
    return { content: imageBase64, mimeType };
  }

  if (!storagePath) {
    throw new Error("No image provided");
  }

  const adminClient = createClient(supabaseUrl, serviceKey);
  const { data: fileData, error } = await adminClient.storage
    .from("proof-images")
    .download(storagePath);

  if (error || !fileData) {
    throw new Error("Could not load receipt image");
  }

  const buffer = await fileData.arrayBuffer();
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (const b of bytes) binary += String.fromCharCode(b);
  const content = btoa(binary);
  return { content, mimeType: fileData.type || mimeType };
}

async function processWithDocumentAi(
  content: string,
  mimeType: string
): Promise<ExtractReceiptResponse> {
  const projectId = Deno.env.get("GOOGLE_CLOUD_PROJECT_ID");
  const location = Deno.env.get("GOOGLE_DOCUMENTAI_LOCATION") ?? "us";
  const processorId = Deno.env.get("GOOGLE_DOCUMENTAI_PROCESSOR_ID");
  const serviceAccountJson = Deno.env.get("GOOGLE_SERVICE_ACCOUNT_JSON");

  if (!projectId || !processorId || !serviceAccountJson) {
    console.error("[extract-receipt] Document AI not configured");
    return failureResponse("Could not read receipt");
  }

  console.log("[extract-receipt] Document AI request started", {
    mimeType,
    contentBytes: content.length,
    location,
    processorId,
  });

  const serviceAccount = parseServiceAccount(serviceAccountJson);
  const accessToken = await getGoogleAccessToken(serviceAccount);

  const url =
    `https://${location}-documentai.googleapis.com/v1/projects/${projectId}` +
    `/locations/${location}/processors/${processorId}:process`;

  const response = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${accessToken}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      skipHumanReview: true,
      rawDocument: { content, mimeType },
    }),
  });

  if (!response.ok) {
    const errText = await response.text();
    console.error("[extract-receipt] Document AI error:", response.status, errText.slice(0, 500));
    return failureResponse("Could not read receipt");
  }

  const result = await response.json();
  const document = result.document;
  if (!document) {
    console.error("[extract-receipt] Document AI response missing document");
    return failureResponse("Could not read receipt");
  }

  const entityCount = document.entities?.length ?? 0;
  const textLength = document.text?.length ?? 0;
  console.log("[extract-receipt] Document AI response received", {
    entityCount,
    textLength,
  });

  const parsed = parseExpenseDocument(document);
  console.log("[extract-receipt] Parsed fields", {
    success: parsed.success,
    isReceipt: parsed.isReceipt,
    storeName: parsed.storeName,
    purchaseDate: parsed.purchaseDate,
    purchaseTime: parsed.purchaseTime,
    totalAmount: parsed.totalAmount,
    currency: parsed.currency,
    itemCount: parsed.items.length,
    receiptNumber: parsed.receiptNumber,
    confidence: parsed.confidence,
  });

  return parsed;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse(failureResponse("Could not read receipt"), 401);
    }

    const body = await req.json();
    const storagePath =
      typeof body.storagePath === "string" ? body.storagePath : null;
    const imageBase64 =
      typeof body.imageBase64 === "string" ? body.imageBase64 : null;
    const mimeType =
      typeof body.mimeType === "string" ? body.mimeType : "image/jpeg";

    if (!storagePath && !imageBase64) {
      return jsonResponse(failureResponse("Could not read receipt"), 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse(failureResponse("Could not read receipt"), 401);
    }

    if (storagePath) {
      const pathUserId = storagePath.split("/")[0];
      if (pathUserId !== user.id) {
        return jsonResponse(failureResponse("Could not read receipt"), 403);
      }
    }

    console.log("[extract-receipt] Request received", {
      userId: user.id,
      hasStoragePath: !!storagePath,
      storagePath: storagePath ?? undefined,
      hasBase64: !!imageBase64,
      base64Length: imageBase64?.length ?? 0,
      mimeType,
    });

    const { content, mimeType: resolvedMime } = await loadImageBytes(
      supabaseUrl,
      supabaseServiceKey,
      storagePath,
      imageBase64,
      mimeType
    );

    const result = await processWithDocumentAi(content, resolvedMime);
    console.log("[extract-receipt] Final response", {
      success: result.success,
      isReceipt: result.isReceipt,
      confidence: result.confidence,
    });
    return jsonResponse(result);
  } catch (error) {
    console.error("extract-receipt error:", error);
    return jsonResponse(failureResponse("Could not read receipt"));
  }
});

function jsonResponse(body: ExtractReceiptResponse, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
