import {
  emptyReceiptResponse,
  ExtractReceiptResponse,
  ReceiptItem,
} from "./response.ts";

interface DocumentEntity {
  type?: string;
  mentionText?: string;
  confidence?: number;
  normalizedValue?: {
    text?: string;
    moneyValue?: { currencyCode?: string; units?: string; nanos?: number };
    dateValue?: { year?: number; month?: number; day?: number };
    datetimeValue?: {
      year?: number;
      month?: number;
      day?: number;
      hours?: number;
      minutes?: number;
      seconds?: number;
    };
  };
  properties?: DocumentEntity[];
}

interface DocumentAiDocument {
  text?: string;
  entities?: DocumentEntity[];
}

const RECEIPT_ENTITY_TYPES = new Set([
  "supplier_name",
  "supplier_address",
  "supplier_phone",
  "receipt_date",
  "receipt_time",
  "purchase_time",
  "total_amount",
  "net_amount",
  "tax_amount",
  "tip_amount",
  "line_item",
  "currency",
  "invoice_id",
  "purchase_order",
]);

function pad2(n: number): string {
  return String(n).padStart(2, "0");
}

function moneyToNumber(mv?: {
  units?: string;
  nanos?: number;
}): number | null {
  if (mv?.units == null && mv?.nanos == null) return null;
  const units = parseFloat(mv?.units ?? "0");
  const nanos = (mv?.nanos ?? 0) / 1e9;
  const total = units + nanos;
  return Number.isFinite(total) ? total : null;
}

function entityText(entity: DocumentEntity): string | null {
  return (
    entity.mentionText?.trim() ||
    entity.normalizedValue?.text?.trim() ||
    null
  );
}

function dateFromEntity(entity: DocumentEntity): string | null {
  const dv = entity.normalizedValue?.dateValue;
  if (dv?.year && dv?.month && dv?.day) {
    return `${dv.year}-${pad2(dv.month)}-${pad2(dv.day)}`;
  }
  const dtv = entity.normalizedValue?.datetimeValue;
  if (dtv?.year && dtv?.month && dtv?.day) {
    return `${dtv.year}-${pad2(dtv.month)}-${pad2(dtv.day)}`;
  }
  const text = entityText(entity);
  if (!text) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
  const slash = text.match(/^(\d{1,2})[/-](\d{1,2})[/-](\d{2,4})/);
  if (slash) {
    let [, a, b, y] = slash;
    const year = y!.length === 2 ? `20${y}` : y!;
    let month = a!;
    let day = b!;
    if (parseInt(a!, 10) > 12 && parseInt(b!, 10) <= 12) {
      day = a!;
      month = b!;
    }
    return `${year}-${pad2(parseInt(month, 10))}-${pad2(parseInt(day, 10))}`;
  }
  return null;
}

function timeFromEntity(entity: DocumentEntity): string | null {
  const dtv = entity.normalizedValue?.datetimeValue;
  if (dtv?.hours != null && dtv?.minutes != null) {
    return `${pad2(dtv.hours)}:${pad2(dtv.minutes)}`;
  }
  const text = entityText(entity);
  if (!text) return null;
  const match = text.match(/(\d{1,2}):(\d{2})(?::(\d{2}))?\s*(AM|PM)?/i);
  if (!match) return text;
  let hours = parseInt(match[1]!, 10);
  const minutes = match[2]!;
  const ampm = match[4]?.toUpperCase();
  if (ampm === "PM" && hours < 12) hours += 12;
  if (ampm === "AM" && hours === 12) hours = 0;
  return `${pad2(hours)}:${minutes}`;
}

function firstEntity(
  entities: DocumentEntity[],
  type: string
): DocumentEntity | undefined {
  return entities.find((e) => e.type === type);
}

function parseLineItem(entity: DocumentEntity): ReceiptItem | null {
  const props = entity.properties ?? [];
  let name: string | null = null;
  let price: number | null = null;

  for (const prop of props) {
    const t = prop.type ?? "";
    if (t.includes("description") || t === "line_item/description") {
      name = entityText(prop);
    }
    if (t.includes("amount") || t === "line_item/amount") {
      price =
        moneyToNumber(prop.normalizedValue?.moneyValue) ??
        parseFloat(entityText(prop) ?? "") ||
        null;
    }
  }

  if (!name) {
    name = entityText(entity);
  }
  if (!name) return null;
  return { name, price: Number.isFinite(price!) ? price : null };
}

export function parseExpenseDocument(
  document: DocumentAiDocument
): ExtractReceiptResponse {
  const entities = document.entities ?? [];
  const rawExtractedText = document.text?.trim() ?? "";

  const receiptEntities = entities.filter((e) =>
    RECEIPT_ENTITY_TYPES.has(e.type ?? "")
  );
  const isReceipt =
    receiptEntities.length > 0 ||
    (rawExtractedText.length > 40 &&
      entities.some((e) => e.type === "line_item"));

  if (!isReceipt) {
    return emptyReceiptResponse(rawExtractedText);
  }

  const confidences = receiptEntities
    .map((e) => e.confidence ?? 0)
    .filter((c) => c > 0);
  const confidence =
    confidences.length > 0
      ? confidences.reduce((a, b) => a + b, 0) / confidences.length
      : 0.5;

  const storeEntity = firstEntity(entities, "supplier_name");
  const dateEntity =
    firstEntity(entities, "receipt_date") ??
    firstEntity(entities, "purchase_date");
  const timeEntity =
    firstEntity(entities, "receipt_time") ??
    firstEntity(entities, "purchase_time");
  const totalEntity = firstEntity(entities, "total_amount");
  const currencyEntity = firstEntity(entities, "currency");
  const receiptNumEntity = firstEntity(entities, "invoice_id");
  const orderEntity = firstEntity(entities, "purchase_order");

  const items = entities
    .filter((e) => e.type === "line_item")
    .map(parseLineItem)
    .filter((i): i is ReceiptItem => i != null);

  let currency =
    totalEntity?.normalizedValue?.moneyValue?.currencyCode ??
    entityText(currencyEntity);
  if (currency && currency.length > 3) currency = null;

  const totalAmount =
    moneyToNumber(totalEntity?.normalizedValue?.moneyValue) ??
    parseFloat(entityText(totalEntity) ?? "") ||
    null;

  return {
    success: true,
    isReceipt: true,
    storeName: entityText(storeEntity ?? ({} as DocumentEntity)),
    purchaseDate: dateEntity ? dateFromEntity(dateEntity) : null,
    purchaseTime: timeEntity ? timeFromEntity(timeEntity) : null,
    totalAmount: Number.isFinite(totalAmount!) ? totalAmount : null,
    currency: currency ?? null,
    items,
    receiptNumber: entityText(receiptNumEntity ?? ({} as DocumentEntity)),
    orderNumber: entityText(orderEntity ?? ({} as DocumentEntity)),
    returnPolicyText: null,
    warrantyText: null,
    confidence,
    rawExtractedText,
    error: null,
  };
}
