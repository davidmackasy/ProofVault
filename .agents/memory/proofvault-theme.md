---
name: ProofVault Theme
description: ProofVault is dark-mode only; both colors.light and colors.dark use the same dark palette. NativeTabs (liquid glass) is intentionally not used.
---

ProofVault uses a fully custom dark theme for all platforms.

**Rule:** Set both `colors.light` and `colors.dark` to the ProofVault dark palette in `constants/colors.ts`. The `useColors()` hook will always return the dark theme regardless of system setting.

**Why:** ProofVault is dark-mode-only by design (fintech/premium aesthetic). NativeTabs (iOS 26 liquid glass) does not support custom brand colors, so `ClassicTabLayout` is used for all platforms.

**Key tokens:**
- Background: `#070A0F`
- Surface/Muted: `#111827`
- Card: `#1F2937`
- Border: `#273244`
- Primary (Lime): `#B6FF00` / foreground `#070A0F`
- Accent (Teal): `#1FE0C2`
- Success: `#22C55E` / Warning: `#F59E0B` / Danger: `#FF5A5F`

**How to apply:** Import `useColors()` from `@/hooks/useColors` in every component. Never hardcode hex values directly in StyleSheet.
