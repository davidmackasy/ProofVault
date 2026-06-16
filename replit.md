# ProofVault

A premium iOS purchase protection app that helps users track return windows, warranty expiry, and store proof of purchases.

## Run & Operate

- Expo workflow: `artifacts/mobile: expo` — runs the Expo dev server
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000, not needed for Phase 1)
- `pnpm run typecheck` — full typecheck across all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Mobile: Expo SDK 54, Expo Router 6, React Native 0.81.5
- Styling: React Native StyleSheet (NativeWind skipped for custom dark branding)
- State: React Context + AsyncStorage (Phase 1)
- Fonts: Inter (400/500/600/700) via @expo-google-fonts/inter
- Icons: @expo/vector-icons (Feather)

## Where things live

```
artifacts/mobile/
├── app/
│   ├── _layout.tsx              # Root stack + auth redirect logic
│   ├── onboarding.tsx           # 3-slide onboarding
│   ├── (auth)/                  # sign-in, sign-up
│   ├── (tabs)/                  # index (Home), vault, add, returns, profile
│   ├── item/[id].tsx            # Item detail screen
│   ├── proof-pack/[id].tsx      # Proof Pack screen
│   └── add-purchase/            # Multi-step add flow (index, scan, scanning, review, manual)
├── components/                  # StatusBadge, PurchaseCard, EmptyState, MetricCard, ProofPackItem
├── context/
│   ├── AuthContext.tsx          # Local auth state (mock for Phase 1)
│   └── PurchaseContext.tsx      # Purchases CRUD + AsyncStorage + mock data
├── constants/colors.ts          # ProofVault dark theme (both light/dark keys = same dark palette)
├── types/index.ts               # PurchaseItem, ProofFile, PurchaseStatus, etc.
└── hooks/useColors.ts           # (scaffold) returns colors based on color scheme
```

## Architecture decisions

- **Dark-mode only**: Both `colors.light` and `colors.dark` use the same ProofVault dark palette. NativeTabs skipped — liquid glass incompatible with custom dark branding.
- **No uuid**: IDs use `Date.now().toString() + Math.random().toString(36).substring(2, 9)`.
- **ClassicTabLayout for all platforms**: The center Add tab uses a custom `tabBarButton` that pushes `/add-purchase` as a modal.
- **Phase 1 = AsyncStorage only**: No Firebase. Mock data seeds on first launch.
- **Auth is mock (Phase 1)**: `signIn/signUp` just set a local AsyncStorage flag. Real auth (Firebase) is Phase 4.

## ProofVault Color Palette

| Token | Hex |
|-------|-----|
| Background | `#070A0F` |
| Surface / Muted | `#111827` |
| Card | `#1F2937` |
| Border | `#273244` |
| Text | `#FFFFFF` |
| Muted text | `#9CA3AF` |
| Primary (Lime) | `#B6FF00` |
| Primary foreground | `#070A0F` |
| Accent (Teal) | `#1FE0C2` |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#FF5A5F` |

## Product (Phase 1 — complete)

- Onboarding (3-slide)
- Local auth (sign-in / sign-up)
- Home dashboard: protected value hero, "Can I return this?" CTA, attention row, recent items
- Vault: search + filter chips (All, Returnable, Ending Soon, Warranty, Needs Proof, Expired)
- Returns tab: grouped by urgency (This Week / This Month / Later), return + warranty filters
- Profile: user stats, settings list
- Item detail: deadlines, proof pack progress, purchase details
- Proof Pack: per-item proof checklist with image picker
- Add Purchase flow: 4 options → scan → AI scanning animation → extraction review → manual fallback
- Manual Add: full form with category chips, date fields

## Planned phases

- Phase 4: Firebase Auth (replace mock auth)
- Phase 5: Firestore (replace AsyncStorage)
- Phase 6: Push notifications (expo-notifications)
- Phase 7: Firebase Storage (real proof file upload)
- Phase 8: AI extraction (OpenAI Vision on receipts)

## User preferences

_Populate as you build._

## Gotchas

- Do NOT restart the mobile workflow unless dependencies change or Metro crashes — HMR handles code changes.
- Web insets: +67px top, +34px bottom on all screens using `Platform.OS === "web"` guards.
- `shadow*` and `pointerEvents` deprecation warnings in web console are React Native Web noise — not bugs.
- Do NOT use NativeTabs — liquid glass is incompatible with ProofVault's custom dark tab bar.
