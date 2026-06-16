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

import {
  MOCK_PURCHASE_ITEMS,
  stripMockSeedItems,
  useMockPurchasesEnabled,
} from "@/constants/mockPurchaseItems";
import { useAuth } from "@/context/AuthContext";
import { computeStatus } from "@/context/purchaseUtils";
import {
  fetchPurchasesFromSupabase,
  savePurchaseToSupabase,
  SavePurchaseInput,
} from "@/lib/purchaseApi";
import { isSupabaseConfigured } from "@/lib/supabase";
import { ProofFile, PurchaseItem, PurchaseStatus } from "@/types";

export { daysFromNow } from "@/context/purchaseUtils";

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

interface PurchaseContextValue {
  items: PurchaseItem[];
  isLoading: boolean;
  addItem: (
    item: Omit<PurchaseItem, "id" | "userId" | "createdAt" | "updatedAt">
  ) => Promise<string>;
  savePurchase: (input: SavePurchaseInput) => Promise<string>;
  refreshItems: () => Promise<void>;
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
const MIGRATION_KEY = "pv_purchases_mock_stripped_v1";

async function loadPurchasesFromStorage(): Promise<PurchaseItem[]> {
  if (useMockPurchasesEnabled()) {
    return MOCK_PURCHASE_ITEMS;
  }

  const migrated = await AsyncStorage.getItem(MIGRATION_KEY);
  const stored = await AsyncStorage.getItem(STORAGE_KEY);

  if (!migrated) {
    const parsed: PurchaseItem[] = stored ? JSON.parse(stored) : [];
    const cleaned = stripMockSeedItems(parsed);
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned));
    await AsyncStorage.setItem(MIGRATION_KEY, "true");
    return cleaned;
  }

  if (stored) {
    return JSON.parse(stored) as PurchaseItem[];
  }

  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify([]));
  return [];
}

export function PurchaseProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { userId, isAuthenticated } = useAuth();

  const refreshItems = useCallback(async () => {
    try {
      if (isSupabaseConfigured && isAuthenticated && userId) {
        const remote = await fetchPurchasesFromSupabase();
        setItems(remote);
        return;
      }
      const loaded = await loadPurchasesFromStorage();
      setItems(loaded);
    } catch {
      const loaded = await loadPurchasesFromStorage();
      setItems(loaded);
    }
  }, [isAuthenticated, userId]);

  useEffect(() => {
    (async () => {
      setIsLoading(true);
      try {
        await refreshItems();
      } catch {
        setItems([]);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [refreshItems]);

  const saveItems = useCallback(async (newItems: PurchaseItem[]) => {
    setItems(newItems);
    if (!useMockPurchasesEnabled()) {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(newItems));
    }
  }, []);

  const addItem = useCallback(
    async (
      item: Omit<PurchaseItem, "id" | "userId" | "createdAt" | "updatedAt">
    ) => {
      const id = makeId();
      const newItem: PurchaseItem = {
        ...item,
        id,
        userId: userId ?? "local-user",
        proofPack: item.proofPack.map((proof) => ({
          ...proof,
          id: proof.id || makeId(),
          itemId: id,
        })),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await saveItems([newItem, ...items]);
      return id;
    },
    [items, saveItems, userId]
  );

  const savePurchase = useCallback(
    async (input: SavePurchaseInput) => {
      if (isSupabaseConfigured && userId && userId !== "local-user") {
        const id = await savePurchaseToSupabase(input, userId);
        await refreshItems();
        return id;
      }

      const hasReceipt = !!(
        input.receiptFileUrl ||
        input.receiptStoragePath ||
        input.localReceiptUri
      );
      const fileUrl =
        input.receiptFileUrl ?? input.localReceiptUri ?? undefined;

      return addItem({
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
        status: hasReceipt ? "returnable" : "needs_proof",
        proofComplete: hasReceipt,
        proofPack: hasReceipt
          ? [
              {
                id: "",
                itemId: "",
                userId: userId ?? "local-user",
                type: "receipt",
                fileUrl,
                createdAt: new Date().toISOString(),
              },
            ]
          : [],
        sourceType: input.sourceType,
        extractionResult: input.extractionResult,
      });
    },
    [addItem, refreshItems, userId]
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
      savePurchase,
      refreshItems,
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
      savePurchase,
      refreshItems,
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

export function usePurchases() {
  const context = useContext(PurchaseContext);
  if (!context)
    throw new Error("usePurchases must be used within PurchaseProvider");
  return context;
}
