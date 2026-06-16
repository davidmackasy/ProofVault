import { PurchaseItem } from "@/types";

const TODAY = new Date();
const addDays = (days: number): string => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() + days);
  return d.toISOString().split("T")[0]!;
};
const subtractDays = (days: number): string => {
  const d = new Date(TODAY);
  d.setDate(d.getDate() - days);
  return d.toISOString().split("T")[0]!;
};

/** Fixed IDs used by the original seed data — stripped from real user storage on migration. */
export const MOCK_SEED_IDS = new Set(["1", "2", "3", "4"]);

/**
 * Dev-only sample purchases. Not loaded in production or normal app flow.
 * Enable with EXPO_PUBLIC_USE_MOCK_PURCHASES=true in development.
 */
export const MOCK_PURCHASE_ITEMS: PurchaseItem[] = [
  {
    id: "1",
    userId: "user1",
    itemName: "Sony WH-1000XM5",
    itemDescription: "Noise Cancelling Headphones",
    storeName: "Best Buy",
    category: "Electronics",
    purchaseDate: subtractDays(18),
    totalAmount: 399.99,
    currency: "USD",
    receiptNumber: "BB-7821345",
    returnDeadline: addDays(12),
    warrantyExpiry: addDays(365),
    status: "returnable",
    proofComplete: true,
    proofPack: [
      {
        id: "p1",
        itemId: "1",
        userId: "user1",
        type: "receipt",
        createdAt: new Date().toISOString(),
      },
    ],
    sourceType: "physical_receipt",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "2",
    userId: "user1",
    itemName: "MacBook Air M2",
    itemDescription: "13-inch, 8GB RAM, 256GB SSD",
    storeName: "Apple Store",
    category: "Electronics",
    purchaseDate: subtractDays(90),
    totalAmount: 1299.0,
    currency: "USD",
    orderNumber: "W123456789",
    warrantyExpiry: addDays(275),
    status: "under_warranty",
    proofComplete: true,
    proofPack: [
      {
        id: "p2",
        itemId: "2",
        userId: "user1",
        type: "online_order",
        createdAt: new Date().toISOString(),
      },
      {
        id: "p3",
        itemId: "2",
        userId: "user1",
        type: "item_photo",
        createdAt: new Date().toISOString(),
      },
    ],
    sourceType: "online_order",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "3",
    userId: "user1",
    itemName: "Dyson V15 Detect",
    itemDescription: "Cordless Vacuum",
    storeName: "Best Buy",
    category: "Home",
    purchaseDate: subtractDays(26),
    totalAmount: 749.99,
    currency: "USD",
    receiptNumber: "BB-9914572",
    returnDeadline: addDays(4),
    warrantyExpiry: addDays(730),
    status: "ending_soon",
    proofComplete: true,
    proofPack: [
      {
        id: "p4",
        itemId: "3",
        userId: "user1",
        type: "receipt",
        createdAt: new Date().toISOString(),
      },
    ],
    sourceType: "physical_receipt",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: "4",
    userId: "user1",
    itemName: "Ninja Foodi Grill",
    itemDescription: "5-in-1 Indoor Grill & Air Fryer",
    storeName: "Amazon",
    category: "Kitchen",
    purchaseDate: subtractDays(5),
    totalAmount: 229.99,
    currency: "USD",
    returnDeadline: addDays(25),
    warrantyExpiry: addDays(365),
    status: "needs_proof",
    proofComplete: false,
    proofPack: [],
    sourceType: "online_order",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

export function stripMockSeedItems(items: PurchaseItem[]): PurchaseItem[] {
  return items.filter((item) => !MOCK_SEED_IDS.has(item.id));
}

export function useMockPurchasesEnabled(): boolean {
  return (
    __DEV__ && process.env.EXPO_PUBLIC_USE_MOCK_PURCHASES === "true"
  );
}
