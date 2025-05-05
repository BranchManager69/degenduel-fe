# Wallet Adapter Import Scan & Recommendations

_Date:_ **May&nbsp;2025**  
_Prepared by:_ 🔎 Automated Codex scan

---

## 1&nbsp;·&nbsp;Context & Goal

The purpose of this audit was to locate **all runtime-relevant references** to the following wallet-related symbols in the frontend codebase:

* `@solana/wallet-adapter-react`
* `useWallet`
* `WalletProvider`
* `useJupiterWallet`

We then determined **which product features depend on each import** and whether those imports are indispensable or can be replaced/removed to reduce bundle size and maintenance overhead.

---

## 2&nbsp;·&nbsp;Detailed Findings

| # | File & Line | Import / Use | Feature that depends on it | Essential at runtime? |
|---|-------------|-------------|----------------------------|-----------------------|
| 1 | `src/hooks/useJupiterWallet.ts` L6 | `useWallet as useJupiterWalletAdapter` from `@jup-ag/wallet-adapter` | Thin wrapper exposing the Jupiter wallet adapter to the rest of the app | **Yes** – single bridge to on-chain wallet logic |
| 2 | `src/hooks/useAuth.ts` L14 / L38 | `useJupiterWallet` | Signs auth challenge during login | **Yes** – required for authentication |
| 3 | `src/components/auth/ConnectWalletButton.tsx` L6 / L31 | `useJupiterWallet` | Renders **Connect Wallet** button & opens wallet modal | **Yes** – user cannot connect without it |
| 4 | `src/hooks/websocket/index.ts` L92 | Internal `useWallet` (WebSocket) | Streams live balance & transaction data | **Yes** – powers real-time UX, but **does not depend** on external libraries |
| 5 | `src/pages/public/general/LandingPage.tsx` L30 / L58 | Internal `useWallet` | Shows or hides *“Whale Room”* CTA based on balance | Nice-to-have – can be deferred/lazy-loaded |
| 6 | `src/components/layout/WalletBalanceTicker.tsx` L12 / L33 | Internal `useWallet` | Top-bar SOL balance ticker | Optional – good UX, removable or lazy-loadable |


### 2.1 · Dev-only / Dead-code references

| File | Why it exists | Action |
|------|---------------|--------|
| `src/App.tsx.bak` | Legacy backup before Jupiter migration – imports `@solana/wallet-adapter-react` | **Delete** |
| `test-wallet-provider.js` | Stand-alone test harness for wallet adapters | Move to `tools/` or **delete** |
| `context-comparison-test.js` <br> `check-context.js` | Diagnostics ensuring only one copy of `@solana/wallet-adapter-react` was bundled | Move to `tools/` or **delete** |

> **Key takeaway:** No production file imports `@solana/wallet-adapter-react`. The only remaining occurrences are in backups/tests and `package.json`.

---

## 3&nbsp;·&nbsp;Patterns Observed

1. **Single-source wallet logic** – All runtime wallet interactions have converged on the **Jupiter Unified Wallet Adapter**. The legacy Solana adapter is vestigial.
2. **Internal real-time hook** – `hooks/websocket/topic-hooks/useWallet.ts` supplies live balance data without any third-party adapter dependency; it simply consumes our WebSocket stream.
3. **Feature flags** – Landing-page whale logic and the balance ticker are non-critical extras that can be *lazy-loaded* to defer WebSocket code until after login.

---

## 4&nbsp;·&nbsp;Recommended Next Actions

1. **Delete unused files**  
   ```bash
   git rm src/App.tsx.bak test-wallet-provider.js context-comparison-test.js check-context.js
   ```

2. **Drop legacy dependency**  
   Remove `@solana/wallet-adapter-react` (and its UI/Base sub-packages) from `package.json`:
   ```bash
   npm uninstall @solana/wallet-adapter-react @solana/wallet-adapter-react-ui @solana/wallet-adapter-base-ui
   ```

3. **Re-install & verify**  
   ```bash
   npm install
   npm ls @solana/wallet-adapter-react   # should show empty tree
   ```

4. **Bundle-size sanity check**  
   ```bash
   npm run build && npx source-map-explorer 'dist/assets/*.js'
   ```
   Expect ≈ **-550 kB** minified savings.

5. **Optional UX tweaks**  
   • Lazy-import the Landing-page whale check and `WalletBalanceTicker` after wallet connection.  
   • Evaluate a Phantom-only micro-adapter (~20 kB) if you ever migrate away from Jupiter.

---

## 5&nbsp;·&nbsp;Post-Cleanup Validation Checklist

* `ConnectWalletButton` opens the Jupiter modal and connects successfully.
* Login flow (`useAuth`) still signs & verifies messages.
* WebSocket balance streaming (`useWallet`) works on dashboard pages.
* Production build size shrank and contains **no copies** of `@solana/wallet-adapter-react`.

---

## 6&nbsp;·&nbsp;One-Line TL;DR

> **The Solana React wallet adapter is dead weight; delete four files, remove the package, and enjoy a lighter, cleaner bundle.**
