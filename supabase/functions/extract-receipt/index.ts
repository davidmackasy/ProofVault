import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.1";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

const EXTRACTION_PROMPT = `You are a purchase-proof reading engine.

You are given an image that is proof of a purchase. It may be a paper receipt, online order screenshot, email receipt screenshot, warranty card, or confirmation page.

Extract the purchase details and return ONLY valid JSON. Do not include prose, markdown, or explanations.

Return this JSON shape:

{
  "storeName": string | null,
  "purchaseDate": string | null,
  "purchaseTime": string | null,
  "totalAmount": number | null,
  "currency": string | null,
  "items": [
    {
      "name": string,
      "price": number | null
    }
  ],
  "sourceType": "physical_receipt" | "online_order" | "unknown",
  "receiptNumber": string | null,
  "orderNumber": string | null,
  "returnPolicyText": string | null,
  "warrantyText": string | null,
  "confidence": number,
  "rawExtractedText": string
}

Rules:
- If a field is not clearly visible, return null.
- Do not guess aggressively.
- Do not invent a store, date, total, return window, or warranty.
- Null is better than wrong.
- Lower confidence for blurry, cropped, partial, or unclear images.
- Return confidence between 0 and 1.`;

interface ExtractedReceipt {
  storeName: string | null;
  purchaseDate: string | null;
  purchaseTime: string | null;
  totalAmount: number | null;
  currency: string | null;
  items: { name: string; price: number | null }[];
  sourceType: "physical_receipt" | "online_order" | "unknown";
  receiptNumber: string | null;
  orderNumber: string | null;
  returnPolicyText: string | null;
  warrantyText: string | null;
  confidence: number;
  rawExtractedText: string;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return jsonResponse({ error: "Missing authorization" }, 401);
    }

    const { storagePath } = await req.json();
    if (!storagePath || typeof storagePath !== "string") {
      return jsonResponse({ error: "storagePath is required" }, 400);
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const openAiKey = Deno.env.get("OPENAI_API_KEY");

    if (!openAiKey) {
      return jsonResponse({ error: "Receipt reading is not configured" }, 503);
    }

    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const {
      data: { user },
      error: userError,
    } = await userClient.auth.getUser();

    if (userError || !user) {
      return jsonResponse({ error: "Unauthorized" }, 401);
    }

    const pathUserId = storagePath.split("/")[0];
    if (pathUserId !== user.id) {
      return jsonResponse({ error: "Forbidden" }, 403);
    }

    const adminClient = createClient(supabaseUrl, supabaseServiceKey);
    const { data: fileData, error: downloadError } = await adminClient.storage
      .from("proof-images")
      .download(storagePath);

    if (downloadError || !fileData) {
      return jsonResponse({ error: "Could not load receipt image" }, 404);
    }

    const buffer = await fileData.arrayBuffer();
    const base64 = btoa(
      new Uint8Array(buffer).reduce(
        (data, byte) => data + String.fromCharCode(byte),
        ""
      )
    );
    const mimeType = fileData.type || "image/jpeg";
    const dataUrl = `data:${mimeType};base64,${base64}`;

    const openAiResponse = await fetch(
      "https://api.openai.com/v1/chat/completions",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${openAiKey}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          response_format: { type: "json_object" },
          messages: [
            {
              role: "user",
              content: [
                { type: "text", text: EXTRACTION_PROMPT },
                { type: "image_url", image_url: { url: dataUrl } },
              ],
            },
          ],
          max_tokens: 1200,
        }),
      }
    );

    if (!openAiResponse.ok) {
      const errText = await openAiResponse.text();
      console.error("OpenAI error:", errText);
      return jsonResponse({ error: "Could not read receipt" }, 502);
    }

    const openAiJson = await openAiResponse.json();
    const content = openAiJson.choices?.[0]?.message?.content;
    if (!content) {
      return jsonResponse({ error: "Empty response" }, 502);
    }

    const parsed = JSON.parse(content) as ExtractedReceipt;
    const primaryItemName =
      parsed.items?.[0]?.name ??
      parsed.storeName ??
      null;

    return jsonResponse({
      storeName: parsed.storeName,
      purchaseDate: parsed.purchaseDate,
      purchaseTime: parsed.purchaseTime,
      totalAmount: parsed.totalAmount,
      currency: parsed.currency,
      itemNames: parsed.items?.map((i) => i.name).filter(Boolean) ?? [],
      itemName: primaryItemName,
      sourceType: parsed.sourceType ?? "unknown",
      receiptNumber: parsed.receiptNumber,
      orderNumber: parsed.orderNumber,
      returnPolicyText: parsed.returnPolicyText,
      warrantyText: parsed.warrantyText,
      confidence: parsed.confidence ?? 0,
      rawExtractedText: parsed.rawExtractedText ?? "",
      needsReview: true,
    });
  } catch (error) {
    console.error("extract-receipt error:", error);
    return jsonResponse({ error: "Could not read receipt" }, 500);
  }
});

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "Content-Type": "application/json" },
  });
}
