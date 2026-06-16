---
name: ProofVault Auth Pattern
description: Phase 1 uses local mock auth (AsyncStorage flag). Firebase Auth replaces it in Phase 4. Auth redirect logic lives in app/_layout.tsx.
---

**Phase 1 auth** is mock-only. `signIn` / `signUp` in `AuthContext.tsx` just save an `pv_authenticated = "true"` flag to AsyncStorage. No real credential validation happens.

**Auth redirect logic** is in `RootLayoutNav` inside `app/_layout.tsx`, using `useSegments` + `useRouter`:
1. If `!hasSeenOnboarding` → push `/onboarding`
2. If `hasSeenOnboarding && !isAuthenticated` → push `/(auth)/sign-in`
3. If `isAuthenticated && in auth/onboarding` → push `/(tabs)`

**Why:** First build prioritizes static UI and navigation flow. Firebase Auth is a Phase 4 concern.

**How to apply:** When upgrading to Firebase Auth in Phase 4, replace `signIn`/`signUp` implementations in `AuthContext.tsx` only — the redirect logic in `_layout.tsx` stays unchanged.
