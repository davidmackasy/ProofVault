import { ProofFile, PurchaseItem, PurchaseStatus } from "@/types";

export const daysFromNow = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export function computeStatusFromItem(item: PurchaseItem): PurchaseStatus {
  if (item.status === "archived") return "archived";
  const hasReceipt = item.proofPack.some(
    (p) => p.type === "receipt" || p.type === "online_order"
  );
  if (!hasReceipt) return "needs_proof";
  const returnDays = daysFromNow(item.returnDeadline);
  if (returnDays !== null && returnDays > 0) {
    return returnDays <= 7 ? "ending_soon" : "returnable";
  }
  const warrantyDays = daysFromNow(item.warrantyExpiry);
  if (warrantyDays !== null && warrantyDays > 0) {
    return warrantyDays <= 30 ? "ending_soon" : "under_warranty";
  }
  return item.proofComplete ? "fully_protected" : "expired";
}

export function computeStatus(
  item: PurchaseItem,
  proofPack: ProofFile[],
  proofComplete: boolean
): PurchaseStatus {
  return computeStatusFromItem({ ...item, proofPack, proofComplete });
}
