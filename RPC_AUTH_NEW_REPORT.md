Great. I’ll research whether `@solana/react` or other `@solana/kit`-compatible wallet libraries support configuring a custom `Rpc` client—particularly one that uses JWT-based transport. I’ll also outline a clear migration checklist for transitioning to `@solana/react`, and provide a comparison between `@solana/react` and `@jup-ag/wallet-adapter` in terms of integration flexibility and ease of use.

I’ll get back to you shortly with the findings.


# Solana Wallet Integration: Custom RPC, Migration Strategy, and Library Comparison

## 1. Custom RPC Client Configuration in `@solana/react` / `@solana/kit`

* **Custom RPC Support:** The Solana Kit SDK allows developers to **inject custom RPC transports**. By default, `createSolanaRpc` uses an HTTP transport, but you can provide your own. For example, you can create a custom transport (with retry logic, multiple endpoints, or special headers) and pass it to `createSolanaRpcFromTransport`. This means you are not limited to the default RPC endpoint – you can fully customize how RPC requests are sent.

* **Dynamic JWT-based Transport:** You can configure an RPC transport with **dynamic JWT headers** using the Kit’s HTTP transport utility. The `@solana/rpc-transport-http` package provides a `createHttpTransport` function that accepts custom headers. For instance, you can include an `Authorization: Bearer <token>` header for JWT authentication. In practice, you would recreate or update the transport when the JWT changes (or use a closure to inject the latest token). This custom transport can then be used to instantiate your RPC client (via `createSolanaRpcFromTransport`).

* **Wallet Library Integration:** The `@solana/react` hooks themselves don't require a specific RPC client to be set globally – you can call RPC methods on demand. If needed, you can **store a custom RPC** instance (with your JWT transport) in context or state and use it throughout your app. Currently, the configuration of a custom RPC endpoint or transport is done in code (as above) rather than through a high-level prop on a provider. There isn’t a one-line config in `@solana/react` like `rpcUrl` prop; instead, you leverage Solana Kit’s APIs to make RPC calls with custom transport whenever needed. This gives maximum flexibility for advanced scenarios (e.g. coordinating multiple RPC backends or authenticated RPC access).

* **Alternative Wallet Libraries:** Other Solana wallet libraries that are **compatible with Solana’s Wallet Standard** generally rely on the underlying connection (RPC) provided by Solana’s SDK. For example, Jupiter’s Unified Wallet Kit primarily takes a cluster name (`env: 'mainnet-beta'`) and internally uses a standard connection to that cluster. It doesn’t natively expose custom RPC transports with headers. In contrast, Solana Kit’s design explicitly allows you to plug in a custom RPC transport for specialized needs (e.g. JWT auth, request batching, load balancing). This makes `@solana/kit` + `@solana/react` a good choice when you need to integrate with secured or custom RPC endpoints.

## 2. Migration Plan: From `@jup-ag/wallet-adapter` to `@solana/react` and `@solana/kit`

Migrating from the Jupiter Unified Wallet Adapter (built on Solana Wallet Adapter) to the new Solana React/Kit involves updating providers, hooks, UI components, and token handling. Below is a **step-by-step migration checklist**:

1. **Update Dependencies:** Remove the old wallet adapter packages and add the new ones. For example, uninstall `@jup-ag/wallet-adapter`, `@solana/wallet-adapter-react`, and related UI packages, then install `@solana/react` (for React hooks) and `@solana/kit` (Solana SDK). Ensure your project is using a version of Solana Kit that matches your needs (e.g., Kit 2.x). You may also want to include the Solana Wallet Standard types if needed (many wallets now adhere to the standard).

2. **Replace Providers in `App.tsx`:** Remove Jupiter’s `<UnifiedWalletProvider>` (and any `<ConnectionProvider>`/`<WalletProvider>` from the old adapter) from your app’s component tree. Jupiter’s provider took a config with `env`, autoConnect, etc. – this will no longer be used. In the new setup, if you want a global provider, you can create a context for your selected wallet and connection:

   * **Wallet Context:** Since `@solana/react` hooks rely on a `UiWallet` or `UiWalletAccount`, you need to obtain the user’s wallet and account. You can utilize the Solana **Wallet Standard** interface. Many wallets will auto-inject themselves as Wallet Standard compatible. For example, you might query `window.navigator.wallets` to get available wallets, and call `wallet.connect()` on the one the user selects.
   * **Connection (RPC) Context:** You might not need a “ConnectionProvider” as in the old adapter. With Solana Kit, you can create an RPC client on the fly (or once and reuse). For convenience, you can instantiate a `rpc = createSolanaRpc(<clusterUrl>)` and perhaps provide it via React Context if many components use it. Otherwise, call `createSolanaRpc` or use your custom RPC as needed (for example, in an action handler as shown in Kit’s docs).
   * **Chain/Network Configuration:** In `@solana/react` hooks like `useWalletAccountTransactionSigner(account, chain)`, you specify the chain (e.g., `'solana:devnet'` or `'solana:mainnet-beta'`). Ensure you have a way to define the current network/chain (maybe a constant or part of context state).

3. **Implement a Custom Wallet Hook:** Replace your custom `useWallet` hook (that wrapped `@solana/wallet-adapter-react`) with one that works with Wallet Standard and Kit. This hook should:

   * Track the currently connected wallet account (e.g., a state for `selectedWalletAccount` of type `UiWalletAccount` or similar).
   * Provide methods to connect/disconnect. For Wallet Standard, connecting usually involves calling `wallet.connect()` and then retrieving `wallet.accounts`. You may need to handle the scenario of multiple accounts; typically you’ll use the first or allow the user to pick one.
   * Expose wallet data similar to before (public key, wallet name, etc.). For example, `selectedWalletAccount.address` gives the public key (address) of the connected account, which you can expose as a `PublicKey` object if needed.
   * Wrap Solana Kit hooks as needed: e.g., you can use the `useWalletAccountTransactionSigner(selectedWalletAccount, chain)` inside your hook to get a transaction signer object, or use `useSignTransaction` for a simpler signing function. These hooks will facilitate signing transactions/messages with the connected wallet. Your custom hook can call these under the hood or return them for components to use.

4. **Replace UI Components (Connect Button & Modal):** The old `WalletMultiButton` (and modal from `wallet-adapter-react-ui`) should be replaced with a new UI for wallet selection and display.

   * **Connect Button:** Currently, `@solana/react` does **not provide a built-in WalletModal or MultiButton**. You will likely need to implement a connect button yourself. This could be a simple button that, when clicked, lists available wallets (e.g., Phantom, Solflare, etc.) detected via Wallet Standard, and then calls the connect method on the chosen wallet. (Jupiter’s kit provided `<UnifiedWalletButton />` with a ready-made modal, but in the new setup you control the UI.)
   * **Account Display/Disconnect:** After connection, you should show the connected wallet’s address (and possibly an icon/name). You can create a component similar to `WalletMultiButton` that toggles between showing the address and a menu to disconnect or switch wallets. This will involve managing some local state for the dropdown. Essentially, the logic is: if connected, show abbreviated address and an option to disconnect; if not connected, prompt to connect. (You can style this as needed; refer to the old `WalletMultiButton` behavior as a guide.)
   * **Future UI Packages:** It’s worth noting that down the line, Solana or the community may release a Wallet Standard UI kit. For now, building a minimal custom UI ensures you’re not blocked.

5. **SPL Token Handling:** Audit any usage of SPL token utilities (e.g., finding token accounts, sending token transfers) and update them to use Solana Kit or associated libraries:

   * If your code used `connection.getTokenAccountsByOwner` to fetch token accounts, you can achieve the same with Kit’s RPC. For example, `rpc.getTokenAccountsByOwner(ownerPublicKey, { programId: TOKEN_PROGRAM_ID }).send()` will return token accounts, similar to the old method, since the Kit RPC API mirrors Solana’s JSON RPC methods. (The JSON-RPC method **getTokenAccountsByOwner** is supported by Kit, and you’ll call `.send()` on it to get results.)
   * Solana Kit encourages using the token program utilities for some tasks. For instance, to get an associated token account (ATA) for a given wallet and mint, you can use the helper `findAssociatedTokenPda()` provided by the `@solana/kit` or related package. The example below shows deriving the source and destination ATA for a USDC transfer using Kit’s utilities:

     ```typescript
     const sourceATA = await findAssociatedTokenPda({
         owner: address(selectedWalletAccount.address),
         tokenProgram: address(TOKEN_PROGRAM_ID),
         mint: address(USDC_MINT),
     });
     const destinationATA = await findAssociatedTokenPda({
         owner: address(recipientAddress),
         tokenProgram: address(TOKEN_PROGRAM_ID),
         mint: address(USDC_MINT),
     });
     ```

     This replaces having to fetch token accounts via RPC in many cases, and you can then create a transfer instruction with these addresses.
   * For sending SPL tokens, construct transactions using Solana Kit’s transaction building blocks. You might use `createTransferInstruction` from `@solana/spl-token` (similar to before) or wait for Kit’s higher-level token transfer utilities. Sign and send the transaction using the Kit signer hooks (e.g., `useSignAndSendTransaction` or by obtaining a `TransactionSendingSigner`). The flow is slightly different but conceptually the same as the old adapter’s `sendTransaction`.
   * **Summary:** Ensure anywhere you used the old `Connection` or wallet adapter to interact with SPL tokens (balance queries, transfers, ATA creation) is refactored to either use the new RPC (`createSolanaRpc`) or Kit’s helper functions. The Solana Cookbook and official docs can help with updated examples for token actions under Solana Kit.

6. **Testing and Iteration:** After refactoring, test all authentication flows:

   * Connect each type of wallet and ensure the new hook captures the account and can sign transactions.
   * Try a transaction (SOL transfer, token transfer) on devnet to verify that your use of Kit’s RPC and signing hooks works properly (e.g., the transaction gets confirmed).
   * If you implemented a custom connect modal, test it on different browsers/wallets. (Wallet Standard should detect browser extensions; ensure that works and fallback to manual selection if needed.)
   * Also test auto-reconnect if you need it – you might store the last used wallet name in localStorage and on page load, attempt to reconnect by calling that wallet’s `connect()`.

By following the above steps, you replace the Jupiter wallet adapter setup with the new, official Solana SDK approach. The result is an app using `@solana/react` for wallet interactions (sign-in, signing, sending) and `@solana/kit` for all RPC and transaction building, which should be more future-proof going forward.

## 3. Comparison: `@solana/react` (Solana Kit) vs. `@jup-ag/wallet-adapter`

When deciding between the new Solana React/Kit libraries and Jupiter’s Unified Wallet Adapter, consider the following aspects:

* **Customization & RPC Configurability:**

  * **`@solana/react` + Kit:** Highly customizable. The Solana Kit SDK exposes low-level APIs to configure RPC calls. You can plug in custom transports (HTTP, WebSockets, or custom logic) and even compose multiple transports (for load balancing or fallback). If you need to add headers (for auth) or custom retry logic, you have the hooks to do so. This makes it possible to use private RPC endpoints with authentication tokens or implement advanced features like caching and batching at the RPC layer.
  * **`@jup-ag/wallet-adapter`:** More limited in RPC customization. Jupiter’s kit is built on the traditional `Connection` from Solana web3.js, configured by a cluster name. For example, you typically just specify `env: 'mainnet-beta'` or a URL, and it uses the default Connection internally. There isn’t a built-in way to add custom headers or modify transport – you’d have to override the Connection outside of Jupiter’s API. In practice, Jupiter’s adapter is focused on wallet UI/UX and defers to the default RPC connection for network calls. So if your use case requires a special RPC setup, Solana Kit provides a more flexible foundation.

* **Provider Setup & Flexibility:**

  * **`@solana/react`/Kit:** Lean provider requirements. There is no mandated provider component in `@solana/react` for connections; you integrate with the Wallet Standard or manually manage the wallet state. This gives you flexibility to structure context as you like. The trade-off is that you might write a bit more boilerplate to manage wallet connections and RPC client initialization. However, this also means you can more easily integrate Solana into an existing app’s context architecture. The Kit functions can be called anywhere (they are not React-specific), which is convenient for using Solana in non-React parts of your app as well.
  * **`@jup-ag/wallet-adapter`:** Comes with a convenient provider (`<UnifiedWalletProvider>`) that bundles connection, wallets, and UI state. It’s easy to set up – just wrap your app and pass a config. Internally, this provider sets up the necessary context (using Solana Wallet Adapter’s context under the hood). This is great for quick integration, but it’s somewhat less flexible if you need to deviate from the provided structure. For example, if you wanted to use multiple connections or dynamically switch RPC endpoints, you’d need to work around the unified provider. In summary, Jupiter’s provider is **simpler to use out-of-the-box**, while Solana Kit’s approach is **more flexible** but requires a bit more manual wiring.

* **UI Component Support:**

  * **`@solana/react`:** Minimal built-in UI as of now. The focus is on hooks (e.g., for signing, sending, etc.) rather than UI components. There is **no equivalent of** `WalletMultiButton` or a modal in this package. Developers currently need to create their own wallet selection UI or use a community wallet modal. This gives freedom in design but does mean extra work. On the positive side, the hooks like `useSignIn` and `useSignTransaction` integrate neatly with whatever UI you build, and they handle the wallet interactions once a wallet account is selected. We may see more UI support (perhaps a separate package) in the future as the ecosystem matures.
  * **`@jup-ag/wallet-adapter`:** Rich UI out-of-the-box. Jupiter’s kit provides ready-made components such as `<UnifiedWalletButton />` (which encapsulates a connect button and dropdown modal) and a notification system for wallet events. It includes theming (light/dark/Jupiter themes) and internationalization support by default. This means with almost no effort you get a professional-looking wallet selector that’s mobile-responsive and multi-lingual. For developers who want a plug-and-play UI, Jupiter’s adapter has a clear advantage. However, the styling and behavior are opinionated – if you need a very custom UI, you might end up overriding its styles or not using some features.

* **Ease of Use & Developer Experience:**

  * **`@solana/react`/Kit:** Aimed at developers who want fine-grained control and **modern API design**. It embraces functional programming concepts (no more `Connection` class; instead, chainable functions with `.send()`). This can be a shift in mental model coming from web3.js 1.x. Once learned, it can be quite powerful – for example, composing transaction instructions with Kit’s helpers feels more predictable and type-safe. The trade-off is a learning curve: fewer examples and community tutorials (since it’s newer) and more pieces to assemble yourself (especially around UI and context). The developer experience for complex customizations is excellent (because the library exposes internals that were previously hidden), but for basic use cases you might write more code compared to Jupiter’s kit. Documentation for Solana Kit is still evolving, so you’ll likely consult the Kit’s README and TypeScript definitions frequently. On the plus side, being the official SDK, it’s designed with Solana’s future features in mind (like native **Sign-In With Solana** flows, which are supported via `useSignIn` hook).
  * **`@jup-ag/wallet-adapter`:** Very **developer-friendly for quick setup**. It was built to reduce repetitive tasks in Solana dApp development (notifications on connect, auto-reconnect, etc.). Many of those features work with zero configuration. The API is familiar if you’ve used the Solana Wallet Adapter: you still have the concept of a `WalletProvider` (unified in this case) and can use the standard `useWallet()` hook from the adapter to get `publicKey`, `sendTransaction`, etc. In fact, Jupiter’s kit still uses the underlying `@solana/wallet-adapter-react` context, so the developer experience is an extension of the well-known patterns. The learning curve is low, and the provided defaults cover most needs (especially for apps that just need a straightforward wallet connection and transaction sending). However, this convenience can sometimes obscure what’s happening under the hood, and if something doesn’t work as expected, debugging through the abstractions might be a bit challenging.

* **Maintenance & Community Support:**

  * **`@solana/react` (Solana Kit):** This is part of the **official Solana JavaScript SDK (a.k.a. web3.js v2)**. It is maintained by Solana Labs (and contributors like the Anza team) and is likely to be the focus of ongoing development. Being official, it should track protocol updates closely and get community contributions. That said, it’s relatively new (v2.1.0 as of a couple months ago). Community adoption is growing, with early adopters asking questions on forums (and getting answers from core devs) – for example, Solana Stack Exchange has Q\&A activity around using Solana Kit in real-world scenarios. We can expect more examples, documentation, and possibly utility libraries as more projects migrate to it. Choosing Solana Kit means you’re aligning with Solana’s long-term SDK strategy, which is a plus for longevity.
  * **`@jup-ag/wallet-adapter`:** This is a community-driven project by the Jupiter team. It leverages the stable Solana Wallet Adapter under the hood (which is battle-tested). Jupiter’s additions (UI, notifications, etc.) are maintained by them, and they have an incentive to keep it up-to-date (since Jupiter Terminal and others use it). It has decent documentation (Jupiter Station docs and examples) and even multi-language support contributed by the community. However, as an extra layer on top of the official adapter, it might not evolve as rapidly once the ecosystem standardizes on wallet standard approaches. The core Solana Wallet Adapter (that Jupiter uses) is still widely supported by the community, but with the advent of Solana Kit, eventually the community might shift focus. Jupiter’s kit is relatively niche in usage outside of Jupiter’s own widgets, so community support is smaller than the general Solana community support for the official tools. In summary, Jupiter’s adapter is solid and maintained now, but there’s a possibility that in the future the official Solana Kit (and wallet standard tooling) will eclipse it in terms of updates and community mindshare.

**References:** The Solana Kit README and docs were used to highlight its capabilities (custom RPC transports, functional RPC calls). Jupiter’s Unified Wallet Kit documentation provided insight into its config and features. For migration steps and best practices, examples from Solana Kit usage and community Q\&A (e.g., handling SPL tokens) were referenced. Each approach has its strengths – the best choice depends on whether you prioritize out-of-the-box convenience (Jupiter’s kit) or fine-grained control and future-proof architecture (Solana React/Kit).
