Perfect — I’ll build you a production-ready React hook that:

* Fetches SOL → token and token → SOL quotes from GMGN
* Falls back to your existing trending endpoint if GMGN fails
* Returns full quote data (output amount, price impact, route plan)
* Is generic enough to drop into any part of your frontend

I’ll get it ready now — hang tight.


# `useTokenQuotesWithFallback` Hook Implementation

## Overview

The `useTokenQuotesWithFallback` hook provides a reliable way to fetch token swap quotes in the DegenDuel frontend. It first tries to get a quote from the **GMGN** public Solana swap API, and if that fails or returns no route, it falls back to DegenDuel’s **Trending** API. This hook returns a consistent result object with the shape specified, including output amount, price impact, route info, source (GMGN or fallback), loading state, and any error message. By using this hook, any page (Token Picker, Trending view, Whale Room, etc.) can safely retrieve token quote data without worrying about stale requests or inconsistent responses.

**Key Features:**

* Accepts a token mint address, a swap direction (`'buy'` for SOL→Token or `'sell'` for Token→SOL), and an input amount (in lamports).
* Uses GMGN’s quote API with a default slippage of **1%** (passed as `0.01`) to get output amount, price impact, and route plan.
* Falls back to DegenDuel’s `/api/tokens/trending` endpoint for recent price data if GMGN fails or returns an invalid quote.
* Returns an object `{ outAmount, priceImpactPct, routePlan, source, loading, error? }` for easy consumption in components.
* Manages loading and error states, and uses `AbortController` to cancel outdated fetch requests (preventing memory leaks and race conditions).

## Integrating GMGN Quote API

The hook uses GMGN’s public router API to get swap quote details. According to GMGN’s documentation, the query endpoint is:

```
https://gmgn.ai/defi/router/v1/sol/tx/get_swap_route?token_in_address=${inputToken}&token_out_address=${outputToken}&in_amount=${amount}&from_address=${user}&slippage=${slippage}
```

This GET request returns a JSON with a `data.quote` object containing the quote information. Key parameters for our use case:

* **Token address mapping:** We must map SOL to GMGN’s special wSOL address. For the input/output token address, we use:

  * SOL ⇒ `"So11111111111111111111111111111111111111112"` (the known dummy address for wrapped SOL).
  * Any other token ⇒ use the provided `tokenAddress` as-is.
* **Input amount in lamports:** The API expects `in_amount` as a string in lamports (1 lamport = 10^-9 SOL). For example, `100000000` represents 0.1 SOL. We will pass the `amountIn` (already in lamports) as a string.
* **Slippage:** We use a default slippage of `0.01` (which corresponds to 1% slippage tolerance). According to GMGN, the slippage is a float percentage (e.g. “10” for 10%). So `0.01` here means 1%. This helps ensure the quote remains valid during execution.
* **Parsing response:** On a successful response (`code: 0` and a filled quote), the JSON will include fields such as `outAmount` (string output amount in base units), `priceImpactPct` (string percentage), and a `routePlan` array describing the swap route. We will convert `priceImpactPct` to a number and use the route plan as-is (or an empty array if no route).

The hook constructs the GMGN API URL with these parameters and calls `fetch()`. If the response is OK and contains a valid quote (non-zero `outAmount` and a non-empty route), we update the state with:

* `outAmount` (as returned by GMGN, a string in lamports or token base units),
* `priceImpactPct` (as a number, parsed from the returned string),
* `routePlan` (array of route steps),
* `source: 'gmgn'`,
* `loading: false`.

If GMGN responds with an error (non-0 code or HTTP failure) or if it returns no viable route (e.g. routePlan empty or outAmount `"0"`), we treat that as a failure and proceed to the fallback.

## Fallback to Trending Data

When GMGN is unavailable or returns no route, the hook falls back to the DegenDuel backend’s trending token data. The `/api/tokens/trending` endpoint is expected to return an array of token info objects containing **recent price** (and possibly other metrics like a trending score). For example, trending data (possibly sourced from BirdEye) typically provides each token’s price and contract address, which we can use to approximate a quote.

Using the trending data:

* We find the entry matching our `tokenAddress`.
* Assume `tokenInfo.price` represents the price of **one whole token in SOL** (e.g., 0.5 SOL per token). We also get the token’s decimal precision if available (for accurate base unit calculations).
* **If direction = 'buy'** (SOL → Token): We have a SOL input amount. We compute how many tokens you can buy:

  * Convert input lamports to SOL: `inputSol = amountIn / 1e9`.
  * Tokens out (in whole units) = `inputSol / price`.
  * Convert to token base units: `outAmount = tokensOut * 10^decimals` (and round down to integer). This is returned as a string.
* **If direction = 'sell'** (Token → SOL): We have a token amount (in base units) to sell:

  * Convert input to whole tokens: `tokenAmount = amountIn / 10^decimals`.
  * SOL out = `tokenAmount * price` (in SOL).
  * Convert SOL to lamports: `outLamports = SOL_out * 1e9`, then format as string.
* In fallback, we set `priceImpactPct` to 0 (since we don’t have an exact figure for price impact) and `routePlan` to an empty array. The `source` will be `'fallback'` to indicate we used the trending data rather than an exact DEX route.

This fallback provides an **approximate quote** based on the latest known price, which is useful when the aggregator cannot find a route. It ensures the UI still shows some information (e.g., estimated output or value) instead of nothing. If the token is not found in trending data or the trending fetch fails, we will surface an error.

## Hook Implementation in React

We implement `useTokenQuotesWithFallback` as a standard React Hook using `useState` and `useEffect`. The effect will run whenever the `tokenAddress`, `direction`, or `amountIn` changes, and it will perform the asynchronous fetch logic described above. Key implementation points:

1. **State Initialization:** We use a `useState` to hold the result object (`TokenQuoteResult`). Initially, `outAmount` can be an empty string, `priceImpactPct` 0, `routePlan` an empty array, `source: 'gmgn'` (default assumption), `loading: false`, and `error: undefined`.
2. **AbortController Setup:** Inside the effect, we create an `AbortController` for the fetches. The controller’s signal is passed to both the GMGN and fallback fetch requests. We also handle cleanup in the effect’s return by calling `controller.abort()`. This ensures that if the component unmounts or the inputs change, any ongoing request is aborted. Using an AbortController prevents race conditions where an outdated response might override a newer one.
3. **Input Validation:** If no `tokenAddress` is provided or `amountIn` is not positive, we skip fetching and simply reset the output to default (this avoids unnecessary calls when inputs are incomplete).
4. **Fetch GMGN Quote:** We construct the GMGN URL with the appropriate `token_in_address` and `token_out_address` based on the `direction` (using the SOL mapping address for any SOL side) and with `in_amount` as the lamport string and `slippage=0.01`. We then call `fetch()` with the abort signal.
5. **Parse GMGN Response:** On response, we check for HTTP success and then parse JSON safely in a try/catch. If `json.code !== 0` or required fields are missing, we treat it as a failure. On success, we extract `outAmount`, `priceImpactPct` (parse to number), and `routePlan`. We also double-check that `routePlan` is not empty and `outAmount` is not "0" (which would indicate no meaningful output route). If all is good, we update state with the GMGN result (`source: 'gmgn'`) and set `loading:false`.
6. **Fallback Fetch:** If the GMGN fetch throws an error or yields no route, we catch it and proceed to call the trending API. We use the same `AbortController` signal for this fetch. We parse the trending JSON, find the token’s price info, and compute the output amount as described in the **Fallback** section above. We then update state with `source: 'fallback'`, the computed `outAmount`, `priceImpactPct: 0`, `routePlan: []`, and `loading:false`.
7. **Error Handling:** If both GMGN and fallback fail (e.g., network issues or token not in trending list), we update state with an `error` message describing the issue and `loading:false`. The `outAmount` can remain empty in this case. Components can check `error` to display a message to the user if needed. We make sure to handle the special `AbortError` (which occurs when a fetch is aborted) by simply returning early and not treating it as a user-facing error.

By following this flow, the hook ensures that only the latest request’s result is applied, and any earlier results are discarded if the inputs change quickly (thanks to the abort logic). Below is the final implementation of `useTokenQuotesWithFallback`:

## Code Implementation

```tsx
import { useState, useEffect } from 'react';

interface TokenQuoteResult {
  outAmount: string;
  priceImpactPct: number;
  routePlan: any[];
  source: 'gmgn' | 'fallback';
  loading: boolean;
  error?: string;
}

export function useTokenQuotesWithFallback(
  tokenAddress: string,
  direction: 'buy' | 'sell',
  amountIn: number
): TokenQuoteResult {
  const [quote, setQuote] = useState<TokenQuoteResult>({
    outAmount: '',
    priceImpactPct: 0,
    routePlan: [],
    source: 'gmgn',    // will attempt GMGN first
    loading: false,
    error: undefined
  });

  useEffect(() => {
    // If inputs are invalid, reset and do nothing
    if (!tokenAddress || amountIn <= 0) {
      setQuote(prev => ({
        ...prev,
        outAmount: '',
        priceImpactPct: 0,
        routePlan: [],
        source: 'gmgn',
        loading: false,
        error: undefined
      }));
      return;
    }

    const controller = new AbortController();
    const signal = controller.signal;

    // Prepare GMGN API request
    const SOL_ADDRESS = 'So11111111111111111111111111111111111111112';
    const isBuy = direction === 'buy';
    const tokenIn = isBuy ? SOL_ADDRESS : tokenAddress;
    const tokenOut = isBuy ? tokenAddress : SOL_ADDRESS;
    const slippageParam = 0.01;  // 1% slippage by default
    const queryParams = new URLSearchParams({
      token_in_address: tokenIn,
      token_out_address: tokenOut,
      in_amount: amountIn.toString(),
      from_address: '',            // not required for quote; can be blank or wallet address
      slippage: slippageParam.toString()
    });
    const gmgnUrl = `https://gmgn.ai/defi/router/v1/sol/tx/get_swap_route?${queryParams}`;

    // Start fetching – set loading state
    setQuote(prev => ({
      ...prev,
      source: 'gmgn',
      loading: true,
      error: undefined
    }));

    // Helper to update state safely (only if not aborted)
    const safeSetQuote = (update: Partial<TokenQuoteResult>) => {
      if (!signal.aborted) {
        setQuote(prev => ({ ...prev, ...update }));
      }
    };

    // Fetch GMGN quote
    fetch(gmgnUrl, { signal })
      .then(res => {
        if (!res.ok) {
          throw new Error(`GMGN quote API HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(data => {
        // Validate GMGN response structure
        if (data.code !== 0 || !data.data?.quote) {
          throw new Error(data.msg || 'GMGN API returned an error');
        }
        const quoteData = data.data.quote;
        const outAmountStr: string = quoteData.outAmount;
        const priceImpactStr: string = quoteData.priceImpactPct;
        const routePlanArr: any[] = quoteData.routePlan || [];
        // If no route or zero output, treat as failure to trigger fallback
        if (!outAmountStr || outAmountStr === '0' || routePlanArr.length === 0) {
          throw new Error('No route found');
        }
        // Parse price impact to number (GMGN returns it as string percentage)
        const priceImpactNum = parseFloat(priceImpactStr) || 0;
        safeSetQuote({
          outAmount: outAmountStr,
          priceImpactPct: priceImpactNum,
          routePlan: routePlanArr,
          source: 'gmgn',
          loading: false,
          error: undefined
        });
      })
      .catch(err => {
        if (err.name === 'AbortError') {
          // Request was aborted, simply exit
          return;
        }
        // GMGN failed – try fallback
        fetch('/api/tokens/trending', { signal })
          .then(res => {
            if (!res.ok) {
              throw new Error(`Trending API HTTP ${res.status}`);
            }
            return res.json();
          })
          .then(trendingData => {
            // Determine the list of token info objects
            const tokens = Array.isArray(trendingData)
              ? trendingData
              : trendingData?.tokens;
            if (!Array.isArray(tokens)) {
              throw new Error('Invalid trending data format');
            }
            const tokenInfo = tokens.find(t => t.address === tokenAddress);
            if (!tokenInfo || tokenInfo.price == null) {
              throw new Error('Token not found in trending data');
            }
            const price = Number(tokenInfo.price);
            let outAmountStr = '0';
            // Use tokenInfo.decimals if available, otherwise assume 0 decimals
            const decimals = tokenInfo.decimals ?? 0;
            if (isBuy) {
              // Converting SOL (input) to token output
              const inputSOL = amountIn / 1e9;
              const tokensOut = price > 0 ? inputSOL / price : 0;
              const baseUnitsOut = Math.floor(tokensOut * 10 ** decimals);
              outAmountStr = baseUnitsOut.toString();
            } else {
              // Converting token (input) to SOL output
              const tokenAmount = amountIn / 10 ** decimals;
              const solOut = tokenAmount * price;
              const lamportsOut = Math.floor(solOut * 1e9);
              outAmountStr = lamportsOut.toString();
            }
            safeSetQuote({
              outAmount: outAmountStr,
              priceImpactPct: 0,
              routePlan: [],
              source: 'fallback',
              loading: false,
              error: undefined
            });
          })
          .catch(fallbackErr => {
            if (fallbackErr.name === 'AbortError') return;
            // If fallback also failed, set error state
            safeSetQuote({
              outAmount: '',
              priceImpactPct: 0,
              routePlan: [],
              source: 'fallback',
              loading: false,
              error: fallbackErr.message || 'Quote unavailable'
            });
          });
      });

    // Cleanup function to abort fetches if inputs change or component unmounts
    return () => {
      controller.abort();
    };
  }, [tokenAddress, direction, amountIn]);

  return quote;
}
```

## Example Usage

Using this hook is straightforward. For instance, in a component where a user selects a token and an amount, you can call the hook and get the quote data:

```tsx
const tokenAddress = selectedTokenAddress;
const direction: 'buy' | 'sell' = swapDirection;  // e.g., 'buy' for SOL->Token
const amountInLamports = inputSolAmount * 1e9;    // convert SOL input to lamports

const {
  outAmount,
  priceImpactPct,
  routePlan,
  source,
  loading,
  error
} = useTokenQuotesWithFallback(tokenAddress, direction, amountInLamports);

if (loading) {
  return <div>Loading quote...</div>;
}
if (error) {
  return <div className="error">Error: {error}</div>;
}

// Display the quote result
return (
  <div>
    <p>Output Amount: {outAmount}</p>
    <p>Price Impact: {priceImpactPct.toFixed(2)}%</p>
    <p>Source: {source === 'gmgn' ? 'Live Quote' : 'Fallback (Trending Price)'}</p>
    {/* ... */}
  </div>
);
```

In this example, the hook provides the output amount (as a string of base units), the price impact percentage, and the source of the data. The component checks `loading` to show a loading state and `error` to handle any issues. Because the hook internally uses an AbortController, if the user changes the token or amount quickly, previous requests are canceled to avoid overlapping results. This makes the hook safe and efficient to use across different pages of the app, ensuring that the displayed quote is always up-to-date with the latest user input.

**Sources:**

* GMGN Solana Trading API – Swap Route Query (parameters and response fields)
* GMGN API Slippage and Usage Guidelines
* React useEffect and AbortController for canceling fetch requests
* BirdEye Trending Tokens API (provides token price and other metrics for fallback)
