Understood. I’ll investigate the precise usage patterns and type expectations for `useConnect` and `useDisconnect` in `@wallet-standard/react-core@1.0.1`, verify if `wallet.accounts` updates reactively post-connection, and retrieve the full type definition of `CompilableTransactionMessageWithSigners` from `@solana/signers@2.1.0`—especially regarding `lifetimeConstraint`.

I’ll get back to you shortly with specific and actionable answers.


# Solana Wallet Integration and Type Safety

## 1. Using `useConnect` and `useDisconnect` Hooks

In **`@wallet-standard/react-core@1.0.1`**, the hooks `useConnect` and `useDisconnect` are used to initiate wallet authorization (connect) or deauthorization (disconnect) for a specific wallet. These hooks **must be called with a specific** `UiWallet` object – they are not generic hooks that return a function taking a wallet as an argument. In other words, you call them like `useConnect(myWallet)` (where `myWallet` is a `UiWallet`) rather than `useConnect()` with a later parameter.

* **Return Signature:** Both hooks return a **tuple** of `[status, actionFunction]`. The first element is a boolean indicating the pending status (`isConnecting` or `isDisconnecting`), and the second element is the function (or promise) to perform the action. For example:

  ```jsx
  const [isConnecting, connect] = useConnect(wallet);
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  ```

  Here `connect` and `disconnect` are the action functions (described below).

* **Action Function Usage:** The returned `connect` function, when invoked, will prompt the wallet to authorize the current domain and returns a **Promise** resolving to an array of accounts authorized by the wallet. Similarly, `disconnect` will prompt deauthorization and returns a Promise that resolves when disconnection is complete. In practice, you can call these functions and handle the promise result. For example, from the documentation:

  ```jsx
  // Inside a component:
  const [isConnecting, connect] = useConnect(wallet);
  ...
  <button disabled={isConnecting} onClick={() => {
      connect.then(onAccountsConnected);
  }}>
      Connect Wallet
  </button>
  ```

  *(The above snippet treats `connect` as a then-able Promise; equivalently you could call `connect()` and await/then its result.)*

  Likewise, for disconnect:

  ```jsx
  const [isDisconnecting, disconnect] = useDisconnect(wallet);
  ...
  <button disabled={isDisconnecting} onClick={() => {
      disconnect.then(onDisconnected);
  }}>
      Disconnect
  </button>
  ```



* **Global Promise Behavior:** Notably, the `connect` hook uses a single globally-shared promise for connecting. If `connect` is called multiple times (even from different components), all calls receive the **same Promise** instance. This means only one authorization flow can happen at a time for a given app. (The same logic likely applies to `disconnect`.)

**Conclusion:** Use these hooks by passing the specific `UiWallet`. They return `[isPending, action]`, and you then call the `action` (or handle the returned promise) to perform the connect/disconnect for that wallet. You **cannot** call `useConnect()` without a wallet – it won’t give you a generic function. The wallet context is required up front.

## 2. Reactive Updates to `wallet.accounts` After Connect

After calling `connect()` on a `UiWallet`, the wallet’s `accounts` property will **update reactively** to include the newly authorized accounts. The `useWallets()` hook provides an array of `UiWallet` objects, and this hook is designed to trigger re-renders when wallets change. In fact, the Wallet Standard defines a `'change'` event that wallets emit whenever their state updates (e.g. accounts added/removed). The React integration listens for these events:

* **Wallet Change Events:** Wallets implementing `standard:events` will emit a `'change'` event on actions like connecting or switching accounts. The dApp (or the wallet adapter library) can subscribe to these events via `wallet.features['standard:events'].on('change', callback)`. The `useWallets()` hook in `@wallet-standard/react-core` leverages this to stay in sync. According to the package updates, as of v1.0.0 the `useWallets` hook will re-render any time a wallet’s change event fires (ensuring the `accounts` array is up-to-date in the UI).

* **Reactive `accounts` Property:** The `UiWallet.accounts` field reflects the accounts the app is authorized to use. Once `connect()` resolves successfully, the wallet will populate its accounts and emit the change event. The associated `UiWallet` object from `useWallets()` will then have its `.accounts` updated automatically (causing any React components using it to re-render). Thus, you can rely on `wallet.accounts` to reactively show the connected account(s) after connecting.

* **Detecting Connected Accounts:** In practice, you have two ways to get the accounts:

  1. **From the connect Promise result** – `connect()` returns a promise of an array of accounts, which you can use immediately in an event handler or callback.
  2. **From the `UiWallet.accounts` state** – the hook’s state will update. For example, after calling `await connect()`, you could simply use the updated `wallet.accounts` in your component state (or call `useWallets()` again to get fresh data).

Most use-cases rely on the reactive update (e.g., your UI might automatically show the wallet’s first account as “connected” once the state updates). The design of Wallet Standard is such that **you don’t need to manually query for accounts after connect** – the state change event handles that.

**Bottom line:** Yes, `wallet.accounts` is kept in sync. After connecting, the new accounts authorized by the user will appear in the `accounts` array of the corresponding `UiWallet` object (triggering any React components to update). Ensure your component is using the state from `useWallets()` or similar so that it re-renders on changes.

## 3. Type Definition of `CompilableTransactionMessageWithSigners` (`@solana/signers@2.1.0`)

The type **`CompilableTransactionMessageWithSigners`** represents a transaction message that is ready to be signed *and* includes embedded signer metadata. In the context of `signAndSendTransactionMessageWithSigners()`, the message must fulfill several interface constraints:

* **Composition of Interfaces:** At a high level, `CompilableTransactionMessageWithSigners` is the intersection of a **base transaction message** with additional requirements:

  * **`BaseTransactionMessage`** – the base shape (having a transaction `version` and an array of `instructions`). This is essentially the core transaction message type before adding fee payer or lifetime info.
  * **`ITransactionMessageWithFeePayer`** – indicates a **fee payer** is set on the message. A transaction must have a fee payer to be valid.
  * **A Lifetime Constraint Interface:** Either

    * `TransactionMessageWithBlockhashLifetime` – indicating the message has a recent **blockhash** (and corresponding last valid block height) as its lifetime constraint, **or**
    * `TransactionMessageWithDurableNonceLifetime` – indicating the message uses a **durable nonce** for its lifetime.

    In practice, this means the message includes either a recent blockhash or a nonce; one of these is required before it can be compiled/sent. (Using a recent blockhash is perfectly acceptable and is the common case for normal transactions.)
  * **`ITransactionMessageWithSigners`** – signifies that the message’s instructions can include **signer metadata**. This interface allows an instruction’s account metas to carry actual `signer` objects (implementing the `TransactionSigner` interface) for any accounts that need signing. In other words, the transaction message “with signers” has been augmented so that each account that requires a signature is paired with a signer object (e.g. a hardware wallet, keypair, or wallet adapter) that will provide that signature.

* **Full Type Definition:** Putting it together, the type can be viewed as:

  ```ts
  type CompilableTransactionMessageWithSigners = 
      BaseTransactionMessage 
    & ITransactionMessageWithFeePayer 
    & (TransactionMessageWithBlockhashLifetime | TransactionMessageWithDurableNonceLifetime) 
    & ITransactionMessageWithSigners;
  ```

  This ensures the transaction message has all the pieces needed:

  * a fee payer field,
  * a recent blockhash or nonce *("lifetimeConstraint")*,
  * and embedded signers for all signer-required accounts.

  In practical terms, you often construct such a message by starting with `createTransactionMessage(...)`, then using helper functions to **add a fee payer** and **add a blockhash or nonce**. For example, calling `setTransactionMessageFeePayer(...)` will return a message that now satisfies `ITransactionMessageWithFeePayer`, and calling `setTransactionMessageLifetimeUsingBlockhash(...)` adds a recent blockhash and makes the message satisfy `TransactionMessageWithBlockhashLifetime`. If you also attach signer objects to the accounts (using `addSignersToTransactionMessage` or by constructing instructions with signers), the message will satisfy `ITransactionMessageWithSigners`. At that point, the message variable’s type is effectively `CompilableTransactionMessageWithSigners`, which is exactly what `signAndSendTransactionMessageWithSigners(...)` expects.

* **`lifetimeConstraint` Requirements:** As noted, **you must provide a lifetime constraint** before signing/sending. This can be a blockhash or a durable nonce – either is fine. Using a recent blockhash (plus lastValidBlockHeight) is the typical approach for most transactions and will satisfy the `TransactionMessageWithBlockhashLifetime` interface. Alternatively, you can use a nonce via `setTransactionMessageLifetimeUsingDurableNonce(...)` if you need the transaction to remain valid longer than the blockhash timeout. In both cases, the resulting message is considered “compilable” (i.e. it has fee payer + lifetime) and thus can be fully signed and sent.

* **Example for Blockhash Constraint:** If you **build with only a blockhash** constraint (no durable nonce), that is perfectly acceptable. For instance:

  ```ts
  let txMsg = createTransactionMessage({ version: 0 });
  txMsg = setTransactionMessageFeePayer(feePayerPubkey, txMsg);
  const { value: { blockhash, lastValidBlockHeight } } = await rpc.getLatestBlockhash();
  txMsg = setTransactionMessageLifetimeUsingBlockhash({ blockhash, lastValidBlockHeight }, txMsg);
  // txMsg now satisfies BaseTransactionMessage, WithFeePayer, and WithBlockhashLifetime.
  // (Add instructions and signers as needed as well...)
  ```

  The `txMsg` here would meet the **CompilableTransactionMessageWithSigners** criteria (assuming you’ve also added the necessary signers to any signing accounts), and you can pass it to `signAndSendTransactionMessageWithSigners(txMsg)`. The library will ensure that all embedded signers are invoked to sign, and then immediately send the transaction to the network.

In summary, **`CompilableTransactionMessageWithSigners`** is a TypeScript construct ensuring your transaction message has: a fee payer, a valid recent blockhash or nonce (defining its lifetime), and all required signing accounts paired with signer implementations. This is the expected input for `signAndSendTransactionMessageWithSigners()`. Using just a recent blockhash for the lifetime is completely fine – the key is that *some* lifetime constraint is present. If these conditions aren’t met, TypeScript will complain that your message does not satisfy the required type, guiding you to add the missing pieces before attempting to sign and send.

**Sources:**

* Official `@wallet-standard/react-core` README (v1.0.1) – usage of `useConnect` and `useDisconnect`, plus notes on their behavior.
* Wallet Standard events documentation – wallets emit `'change'` events on account changes. The React hook re-renders on those events (per v1.0.0 release notes).
* Solana Signers/Kit documentation – requirements for a compilable transaction message (fee payer + lifetime) and the definition of lifetime constraint types. Also, the ability to include signers in transaction messages.
