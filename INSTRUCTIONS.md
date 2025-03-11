# Composing Transactions for Payments & Frontend Transaction Update Instructions

This document contains the entire set of instructions—including both the payment transaction composition (for users paying for your service) and the frontend updates required by Phantom Wallet—to bring your client‑side code up to date with the latest Solana Web3.js v2 practices. Follow the instructions below to ensure that both your payment flows and overall transaction building use the modern, secure, and efficient patterns recommended by Phantom.

---

## Part 1. Composing Payment Transactions

You are offering a service for which users must pay. The following examples show how to compose a transaction on the client side (in the browser) so that users pay from their wallets (e.g. using Phantom). There is also an optional server‑side example if you want your server to pre‑build unsigned transactions for the client to sign.

### A. Client‑Side Payment Transaction Using Phantom

This example uses the new single‑step `signAndSendTransaction` method provided by Phantom, which combines signing and sending. It assumes you’re using Solana Web3.js v2.

```js
import { Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

// Replace with your service's wallet public key (the recipient)
const SERVICE_PUBLIC_KEY = new PublicKey('YourServiceWalletPublicKeyHere');

// Function to compose and send a payment transaction
async function payForService(amountLamports) {
  // Create a connection to the mainnet-beta cluster
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

  // Create a new transaction
  const tx = new Transaction();

  // Add a transfer instruction: move SOL from the user's wallet to your service's wallet
  tx.add(
    SystemProgram.transfer({
      fromPubkey: window.solana.publicKey, // User's wallet public key provided by Phantom
      toPubkey: SERVICE_PUBLIC_KEY,
      lamports: amountLamports,            // Amount in lamports (1 SOL = 1,000,000,000 lamports)
    })
  );

  // Set the fee payer and update transaction with a fresh blockhash
  tx.feePayer = window.solana.publicKey;
  const { blockhash, lastValidBlockHeight } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  // Use Phantom’s new unified method to sign and send the transaction
  const { signature } = await window.solana.signAndSendTransaction({
    transaction: tx,
  });

  // Optionally, confirm the transaction using blockhash details
  await connection.confirmTransaction({
    signature,
    blockhash,
    lastValidBlockHeight,
  });
  console.log('Payment confirmed. Transaction signature:', signature);
}

// Example usage: charge 0.01 SOL (10,000,000 lamports)
payForService(10_000_000).catch(console.error);
```


### B. Server‑Side (Optional): Creating an Unsigned Payment Transaction

If you prefer your server to pre‑compose the transaction (e.g. to include extra instructions or metadata) and send it to the client for signing, you can use the following pattern:


```js
import { Connection, Transaction, SystemProgram, PublicKey } from '@solana/web3.js';

// Function to create an unsigned payment transaction
export async function createPaymentTransaction(userPubKey, amountLamports, servicePubKey) {
  // Connect to mainnet-beta
  const connection = new Connection('https://api.mainnet-beta.solana.com', 'confirmed');

  // Create a new transaction
  const tx = new Transaction();

  // Add the transfer instruction
  tx.add(
    SystemProgram.transfer({
      fromPubkey: userPubKey,
      toPubkey: servicePubKey,
      lamports: amountLamports,
    })
  );

  // Set fee payer to the user's public key
  tx.feePayer = userPubKey;

  // Get a recent blockhash and assign it to the transaction
  const { blockhash } = await connection.getLatestBlockhash();
  tx.recentBlockhash = blockhash;

  // Return the unsigned transaction for the client to sign
  return tx;
}
```

On the client side, you would fetch this unsigned transaction (e.g. via an API call), convert it to a Transaction object if needed, and then sign and send it using:

```js
const unsignedTx = await fetch('/api/create-payment').then(res => res.json());
// Ensure you convert unsignedTx appropriately if it's in JSON form
const { signature } = await window.solana.signAndSendTransaction({
  transaction: unsignedTx,
});
```

# Part 2. Frontend Transaction Update Instructions
Your website is being flagged because your client‑side code uses an outdated transaction method that Phantom Wallet is deprecating. Follow the instructions below to update your code.

## 1. Basic Update

Issue: Your current code uses the old pattern:

```js
// Old method (currently being flagged)
const signedTx = await wallet.signTransaction(tx);
const txId = await connection.sendRawTransaction(signedTx.serialize());
await connection.confirmTransaction(txId);
```

### Required Changes

Update Solana Web3.js to version 2.x:

```js
npm install @solana/kit@^2.1.0 // or npm install @solana/web3.js@^2.0.0 as a fallback
```

Replace with the New Method by Using the unified signAndSendTransaction call:

```js
// Fetch a fresh blockhash for transaction freshness
const latestBlockhash = await connection.getLatestBlockhash();

// Update the transaction with the latest blockhash and set the fee payer
tx.recentBlockhash = latestBlockhash.blockhash;
tx.feePayer = wallet.publicKey;

// Use Phantom’s new combined method
const { signature } = await wallet.signAndSendTransaction({
  transaction: tx,
});

// Optionally confirm using the blockhash details
await connection.confirmTransaction({
  signature,
  blockhash: latestBlockhash.blockhash,
  lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
});
```

Search & Replace:

Go through your frontend code and replace any instance of:

```js
signTransaction -> sendRawTransaction -> confirmTransaction
```

with the single‑step signAndSendTransaction as shown above.


Note: These changes affect only your client‑side code. If your server builds the transactions, no server‑side changes are needed.