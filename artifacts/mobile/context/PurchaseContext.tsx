import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  ReactNode,
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

import { ProofFile, PurchaseItem, PurchaseStatus } from "@/types";

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

export const daysFromNow = (dateStr: string | undefined): number | null => {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  now.setHours(0, 0, 0, 0);
  target.setHours(0, 0, 0, 0);
  return Math.ceil((target.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
};

export const formatDate = (dateStr: string | undefined): string => {
  if (!dateStr) return "";
  return new Date(dateStr).toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
};

export const formatCurrency = (amount: number, currency = "USD"): string => {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
};

const makeId = () =>
  Date.now().toString() + Math.random().toString(36).substring(2, 9);

const MOCK_ITEMS: PurchaseItem[] = [
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

interface PurchaseContextValue {
  items: PurchaseItem[];
  isLoading: boolean;
  addItem: (
    item: Omit<PurchaseItem, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  updateItem: (id: string, updates: Partial<PurchaseItem>) => Promise<void>;
  deleteItem: (id: string) => Promise<void>;
  archiveItem: (id: string) => Promise<void>;
  addProofFile: (
    itemId: string,
    proofFile: Omit<ProofFile, "id" | "createdAt">
  ) => Promise<void>;
  getItem: (id: string) => PurchaseItem | undefined;
  returnableItems: PurchaseItem[];
  endingSoonItems: PurchaseItem[];
  needsProofItems: PurchaseItem[];
  totalProtectedValue: number;
}

const PurchaseContext = createContext<PurchaseContextValue | null>(null);
const STORAGE_KEY = "pv_purchases";

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem(STORAGE_KEY);
        if (stored) {
          setItems(JSON.parse(stored));
        } else {
          setItems(MOCK_ITEMS);
          await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(MOCK_ITEMS));
        }
      } catch {
        setItems(MOCK_ITEMS);
      } finally {
        setIsLoading(false);
      }
    })();
  }, []);

  const saveItems = useCallback(async (newItems: PurchaseItem[]) => {
    setItems(newItems);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
  }, []);

  const addItem = useCallback(
    async (
      item: Omit<PurchaseItem, "id" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const id = makeId();
      const newItem: PurchaseItem = {
        ...item,
        id,
        userId: "user1",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveItems([newItem, ...items]);
      return id;
    },
    [items, saveItems]
  );

  const updateItem = useCallback(
    async (id: string, updates: Partial<PurchaseItem>) => {
      const newItems = items.map((item) =>
        item.id === id
          ? { ...item, ...updates, updatedAt: new Date().toISOString() }
          : item
      );
      await saveItems(newItems);
    },
    [items, saveItems]
  );

  const deleteItem = useCallback(
    async (id: string) => {
      await saveItems(items.filter((item) => item.id !== id));
    },
    [items, saveItems]
  );

  const archiveItem = useCallback(
    async (id: string) => {
      await updateItem(id, { status: "archived" });
    },
    [updateItem]
  );

  const addProofFile = useCallback(
    async (itemId: string, proofFile: Omit<ProofFile, "id" | "createdAt">) => {
      const newProof: ProofFile = {
        ...proofFile,
        id: makeId(),
        createdAt: new Date().toISOString(),
      };
      const item = items.find((i) => i.id === itemId);
      if (!item) return;
      const updatedPack = [...item.proofPack, newProof];
      const hasReceipt = updatedPack.some(
        (p) => p.type === "receipt" || p.type === "online_order"
      );
      const newStatus = computeStatus(item, updatedPack, hasReceipt);
      await updateItem(itemId, {
        proofPack: updatedPack,
        proofComplete: hasReceipt,
        status: newStatus,
      });
    },
    [items, updateItem]
  );

  const getItem = useCallback(
    (id: string) => items.find((item) => item.id === id),
    [items]
  );

  const returnableItems = useMemo(
    () =>
      items.filter(
        (i) => i.status === "returnable" || i.status === "ending_soon"
      ),
    [items]
  );
  const endingSoonItems = useMemo(
    () => items.filter((i) => i.status === "ending_soon"),
    [items]
  );
  const needsProofItems = useMemo(
    () => items.filter((i) => i.status === "needs_proof"),
    [items]
  );
  const totalProtectedValue = useMemo(
    () =>
      items
        .filter((i) => i.status !== "archived" && i.status !== "expired")
        .reduce((sum, i) => sum + (i.totalAmount ?? 0), 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      isLoading,
      addItem,
      updateItem,
      deleteItem,
      archiveItem,
      addProofFile,
      getItem,
      returnableItems,
      endingSoonItems,
      needsProofItems,
      totalProtectedValue,
    }),
    [
      items,
      isLoading,
      addItem,
      updateItem,
      deleteItem,
      archiveItem,
      addProofFile,
      getItem,
      returnableItems,
      endingSoonItems,
      needsProofItems,
      totalProtectedValue,
    ]
  );

  return (
    <PurchaseContext.Provider value={value}>
      {children}
    </PurchaseContext.Provider>
  );
}

function computeStatus(
  item: PurchaseItem,
  proofPack: ProofFile[],
  proofComplete: boolean
): PurchaseStatus {
  if (item.status === "archived") return "archived";
  const hasReceipt = proofPack.some(
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
  return proofComplete ? "fully_protected" : "expired";
}

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (!context)
    throw new Error("usePurchases must be used within PurchaseProvider");
  return context;
}
