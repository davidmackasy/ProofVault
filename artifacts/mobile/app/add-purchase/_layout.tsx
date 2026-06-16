import { Stack } from "expo-router";

import { AddPurchaseFlowProvider } from "@/context/AddPurchaseFlowContext";
import { useColors } from "@/hooks/useColors";

export default function AddPurchaseLayout() {
  const colors = useColors();
  return (
    <AddPurchaseFlowProvider>
      <Stack
        screenOptions={{
          headerShown: false,
          contentStyle: { backgroundColor: colors.background },
        }}
      />
    </AddPurchaseFlowProvider>
  );
}
