### TL;DR

Nice first pass — the component already covers the **happy path** on desktop, shows only installed wallets, signs a challenge, and even tries a mobile deep-link fallback.
But the *mobile part that matters most to you* (opening Phantom / Solflare from Chrome on iOS/Android) is using the wrong URL schemes, ignores required parameters, and will mis-detect several real-world wallets. Fixing those details plus a few smaller edge-cases will make the flow feel “one-tap” instead of “why didn’t anything happen?”.

---

## 1. Deep-link URLs

| Wallet       | Recommended form                                                              | What the code sends       | Problems                                                                                                                                                                                                                                       |
| ------------ | ----------------------------------------------------------------------------- | ------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Phantom**  | `https://phantom.app/ul/browse/<url>?ref=<ref>` ([Phantom Developer Docs][1]) | `phantom://browse/<url>`  | • Missing `ul/` and version • Missing mandatory `ref` query-param • Phantom team now *prefers* the universal-link (`https://…`) form; the custom-scheme still works but Safari/Chrome often block the redirect unless triggered by a user tap. |
| **Solflare** | `https://solflare.com/ul/v1/browse/<url>?ref=<ref>` ([docs.solflare.com][2])  | `solflare://browse/<url>` | Same issues as above, plus wrong version segment (`v1` required).                                                                                                                                                                              |

**Why this matters**

* Chrome & Safari on iOS will silently ignore `phantom://…` if Phantom is not installed, giving the user no visual feedback.
* Phantom 24.x shows a warning banner if the `ref` param is missing (phishing protection).
* Universal links survive the “opened in a new tab” edge case and work on both iOS and Android.

**Suggested patch**

```ts
const buildBrowseLink = (base: 'phantom'|'solflare', dappUrl: string) => {
  const encoded = encodeURIComponent(dappUrl);
  const encodedRef = encodeURIComponent(window.location.origin);
  return base === 'phantom'
    ? `https://phantom.app/ul/browse/${encoded}?ref=${encodedRef}`
    : `https://solflare.com/ul/v1/browse/${encoded}?ref=${encodedRef}`;
};
```

Then:

```ts
const phantomDeepLink = buildBrowseLink('phantom', currentUrl);
const solflareDeepLink = buildBrowseLink('solflare', currentUrl);
```

---

## 2. Wallet-adapter state filtering

```ts
wallet.readyState === 'Installed'
```

*Misses* the **Loadable** state (used by Phantom Mobile 1.10+, Trust, Nightly, Ledger Live). Replace with:

```ts
const isDetected = wallet.readyState !== WalletReadyState.Unsupported &&
                   wallet.readyState !== WalletReadyState.NotDetected;
```

This instantly bumps the “found wallets” count for most mobile users.

---

## 3. UX / flow gotchas

| Issue                                                                                                                                                                 | Effect                                                                                                                      | Fix                                                                                                                                                 |
| --------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| `window.location.href = …` inside `testAppInstalled` unloads your page before the 2 s timer can resolve, so your blur heuristic never fires on many Android browsers. | Your button appears frozen after tapping.                                                                                   | Put the deep-link behind an **`<a href>` the user actually clicks**, or inject it via an invisible `<iframe>` (the pattern Phantom docs recommend). |
| `getChallengeNonce` result unused                                                                                                                                     | You fetch a nonce but never sign it, so your backend can’t verify the signature (unless `auth.loginWithWallet` re-fetches). | Pass the nonce into `signMessageWrapper` and/or have `auth.loginWithWallet` accept `{nonce, signature}`.                                            |
| Select ➜ `await connect()` double-call                                                                                                                                | Some adapters already auto-connect when `select` is called, leading to “Already connected” errors in the console.           | Call **either** `select(…)` **or** `await connect()` depending on `wallet.connecting`.                                                              |
| Error state not reset on retry                                                                                                                                        | After one failure the red message stays forever.                                                                            | Clear `error` inside every branch that leads to success.                                                                                            |
| `onSuccess?.()` is triggered **before** `setIsLoading(false)`                                                                                                         | Loader may flash again after success.                                                                                       | Put `onSuccess()` in `finally` or right after `setIsLoading(false)`.                                                                                |
| Hard-coded 2 s timeout                                                                                                                                                | Modern iOS often needs 300-400 ms, Android Chrome may need up to 2.5 s.                                                     | Use `visibilitychange` + a 3 s fallback for better accuracy.                                                                                        |

---

## 4. Security & resilience

1. **Domain binding** – include the site’s origin in the message you ask the user to sign (`Sign-in with Solana` draft standard) so a pasted signature can’t be replayed on another dapp.
2. **CSRF** – protect the `/auth/challenge` and `/auth/login` endpoints with same-site cookies or CSRF tokens so another page can’t force-login the phantom session.
3. **Strict MIME type** – if you serve the deep-link page over a sub-domain, add CSP `frame-ancestors 'none'` to prevent click-jacking.

---

## 5. Quick win code diff (conceptual)

```diff
- const phantomDeepLink = `phantom://browse/${encodeURIComponent(currentUrl)}`;
+ const phantomDeepLink = `https://phantom.app/ul/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;

- const solflareDeepLink = `solflare://browse/${encodeURIComponent(currentUrl)}`;
+ const solflareDeepLink = `https://solflare.com/ul/v1/browse/${encodeURIComponent(currentUrl)}?ref=${encodeURIComponent(window.location.origin)}`;

- const installedWallets = wallets.filter(w => w.readyState === 'Installed');
+ const installedWallets = wallets.filter(w => w.readyState !== WalletReadyState.NotDetected &&
+                                               w.readyState !== WalletReadyState.Unsupported);
```

*(Full patch would also move the deep-link behind an anchor, expand the timeout, and wire the nonce into the signature.)*

---

### Bottom line

* ✅ **Good foundation**: UI/UX parity with desktop, integrates wallet-adapter, clean React hooks.
* ⚠️ **Main blocker**: deep-link strings and detection logic are off-spec, causing silent failures in real mobile browsers.
* 🛠 **After the above tweaks** you’ll get the friction-free, “tap once → wallet opens → user lands back signed-in” flow you’re aiming for.

Happy shipping — and shout if you hit another integration quirk!

[1]: https://docs.phantom.com/phantom-deeplinks/other-methods/browse "Browse | Phantom Developer Docs"
[2]: https://docs.solflare.com/solflare/technical/deeplinks/other-methods/browse "Browse | Solflare Wallet"
