Got it. I’ll investigate the `market-data` and `token-price-address` WebSocket systems across your `degenduel` and `degenduel-fe` repos, with a focus on ensuring reliable and scalable real-time token price updates—especially in the context of contests and portfolios.

I’ll prioritize:

* Identifying and resolving WebSocket structural mismatches and message duplication issues.
* Evaluating how tokens, contests, and portfolios are transmitted.
* Suggesting a cleanup and optimization plan focused on practical, working solutions.

I’ll dig into the `websocket_v69_unified` folder in the backend and locate the relevant frontend logic (e.g., WebSocket initialization and message handling) to get a complete picture. I’ll update you once I have a clear assessment and actionable recommendations.


## Overview of Current WebSocket Token Data Streams

The DegenDuel backend uses a **unified WebSocket** endpoint (`/api/v69/ws`) to push live token market data. All token price updates are published on the **`market-data`** topic (one of several topics on the unified socket). In the current implementation, the backend broadcasts a **full list of \~2090 tokens** to all subscribers of `market-data` every few seconds. Specifically, the **MarketDataService** triggers a “price update” event every **5 seconds**, containing the latest price info for all active tokens. It also emits a broader “market broadcast” (full update) roughly every 60 seconds. The front-end WebSocket client is expected to subscribe to `market-data` and update the UI on each incoming message.

**Key backend files:** The WebSocket server code resides under `backend/websocket/v69/unified/`. Notably:

* **`websocket-initializer.js`** – sets up the unified WebSocket server and defines topics (including `market-data`).
* **`handlers.js`** – contains logic for handling subscriptions and incoming messages on the unified socket.
* **`services.js`** – registers event listeners that broadcast data to topics. For example, it listens for `market:price_update` events and **broadcasts to `market-data`** with a payload of type `DATA` and subtype `price_update`.
* **`marketDataService.js`** – emits those `market:price_update` events every 5 seconds with the latest token prices, and `market:broadcast` events (full token snapshots) every 60 seconds.

**Key front-end code:** In the React app (e.g. `frontend/src/hooks/websocket/`), the unified WebSocket is managed via a context (`UnifiedWebSocketContext.tsx`) and custom hooks. The primary hook for token data is **`useTokenData`** (replacing an older `useHotTokensData`). This hook connects to the unified socket and handles incoming messages:

* On mount, it **subscribes to the `market-data` topic** if the socket is connected.
* It registers a listener for incoming messages of type `DATA` (the server’s category for data broadcasts). The handler `handleMarketData` merges incoming updates into the React state of tokens.
* Initially, the hook may fetch token list via REST for fast load, then rely on WebSocket updates.

## Identified Issues with Token Data WebSockets

**1. Topic Naming Mismatches:** Originally there was a discrepancy between front-end and backend topic identifiers. The backend defines the topic as `"market-data"` (hyphenated), but older front-end code used `"market_data"` (underscore). This mismatch meant subscription messages were ignored by the server as “no valid topic.” Indeed, the server initially filtered allowed topics strictly against its config values. This is being addressed by a **normalization utility** that accepts either format and converts to the canonical form. On the front end, the new unified hook now uses the correct hyphenated names (e.g. `subscribe(['market-data'])`). **Ensuring both ends use consistent names** (or applying the server’s `normalizeTopic` for safety) is essential so that subscriptions register properly.

**2. Message Structure & Case Inconsistencies:** There were inconsistencies in how message fields are named and structured between backend and frontend:

* **Action/Type naming:** The backend sends WebSocket messages with a `type` field (e.g. `"DATA"`, `"ERROR"`, etc.) and sometimes a `subtype` or `action`. For example, price updates are broadcast with `type: "DATA"` and `subtype: "price_update"`. The front-end code has enumerations expecting camelCase action names (e.g. `priceUpdate`) and needed to map these correctly. This has been improved by standardizing the action enums in the shared `DDWebSocketActions` (the frontend now uses `getToken`, `priceUpdate`, etc., matching backend expectations). The **solution** is to use the same constants or at least consistently document that, for instance, a backend subtype `"price_update"` corresponds to the front-end action `DDWebSocketActions.PRICE_UPDATE` (camelCase `"priceUpdate"`). In practice, the `useTokenData` handler now checks `message.subtype` for known values like `'price_update'` and `'full_update'`.
* **Nested data objects:** The structure of the payload differs for full vs. partial updates. When the server broadcasts a full token list (e.g. initial data or the 60s broadcast), it sends an array of token objects directly in the `data` field. But for the 5-second incremental price updates, the event listener currently passes an **object** containing a data array. For example, a `market:price_update` event yields a WebSocket message:

  ```json
  {
    "type": "DATA", "topic": "market-data", "subtype": "price_update",
    "data": { "type": "price_update", "timestamp": "...", "data": [ {token1}, {token2}, ... ] }
  }
  ```

  Here the actual token list is nested under `message.data.data`. The front-end handler accounts for this by using `const tokenArray = message.data?.data || message.data` to extract the array safely in either case. This is a bit clunky. We might **simplify the structure** so that the server always puts the token array at `message.data` (and perhaps moves the inner `type` to `message.subtype`). Alternatively, the client logic is acceptable as long as it consistently handles both forms. The key is that both sides agree on how to interpret the payload. (The current code does handle it, but this dual layering was a source of confusion initially.)

**3. Duplicate or Redundant Updates:** As noted, **multiple streams of similar data** are being sent:

* The **5-second** `price_update` messages contain price and volume info for (presumably) all active tokens.
* The **60-second** full `market-data` broadcasts contain the entire token objects (with all fields). In the logs you can see both a “5-SEC EMIT” for price updates and a “BCAST” for the full snapshot.

This can lead to **unnecessary duplication**. The front-end `useTokenData` currently merges both: it treats any `price_update` subtype by updating prices in the existing list, and treats other `DATA` messages as possibly full refreshes. However, since the 5s updates already keep prices current, the 60s full list might be largely repetitive. It also triggers the client to loop through \~2k tokens to update them, which is heavy.

**Potential improvement:** mark the 60s broadcast with a distinct subtype (e.g. `'full_update'`) and let the client replace the list only if needed. In fact, the front-end code anticipates a `message.subtype === 'full_update'` case to replace the entire token array in state, but currently the server labels the full broadcast as `"token_update"` (internally) with no subtype on the outer message. Aligning this (for example, send `subtype: 'full_update'` for the 60s snapshot) would let the client know it can refresh the whole list if needed. Otherwise, we might even **disable the 60s full broadcast** once incremental updates and on-demand subscriptions are reliable, to reduce traffic.

**4. Performance with All Tokens vs. Selected Tokens:** Pushing updates for all \~2090 tokens to every client is not scalable. The user’s suggestion to “subscribe to every token in every portfolio in that contest” indicates a desire to **limit updates to relevant tokens** instead of the entire universe. The codebase is already moving toward this: the unified handlers allow dynamic **“token price” topics** of the form `token:price:<address>`. The front-end `useTokenData` hook even contains logic to subscribe to each token’s channel after initial load. However, these individual subscriptions were initially not recognized by the server (because `<address>` topics weren’t in the config’s allowed list). In the latest code, the server’s subscription handler explicitly permits any topic matching `token:price:[A-Za-z0-9]{32,44}` (which covers Solana token addresses) as a **valid topic**. When the server sees such a topic, it logs the token address and even attempts to subscribe a “Redis bridge” for that token. This means the infrastructure is in place to handle per-token updates for subscribed tokens.

The remaining issue is **ensuring data is published on those per-token channels**. Right now, the MarketDataService doesn’t emit individual token events – it emits a batched list. The unified WebSocket layer can bridge at a finer granularity if connected to a feed. The code suggests a plan to use Redis or an external price feed for individual tokens (see `subscribeToTokenPrice` in the handler, which would hook into a realtime source). If that bridge isn’t fully implemented yet, we can still leverage the existing updates: for each 5-second batch, the server could iterate through the token list and **broadcast to each `token:price:<address>` topic for which there are subscribers**. In other words, instead of sending the entire list to everyone, the server can check `server.topicSubscribers` or `server.subscriptions` for any token-specific topics and send just those entries. This would drastically cut down data sent to each client (each client only gets what they subscribed to). It does mean more total messages (one per token with subscribers), but given that a contest will involve far fewer than 2000 tokens, it’s a worthwhile trade-off.

## Plan to Improve Live Token Data Updates

**A. Align Topic Naming on Frontend & Backend:** Double-check that the front-end uses the exact topic strings the backend expects. With unified v69, the correct topic is `"market-data"` (hyphenated) as defined in `config.websocket.topics`. The front-end should subscribe with that name – which it now does in `useUnifiedWebSocket` (the updated hook passes `['market-data']` instead of `['market_data']`). The backend’s subscription handler already normalizes topic names (converting underscores to hyphens and vice versa to match a known topic), but it’s best not to rely on guesswork. **Action:** Remove any remaining `"market_data"` references in the front-end code (for example, the deprecated `useHotTokensData` used underscore naming) to avoid confusion. Use the shared constants or at least a single source of truth for topic strings in both projects. This will prevent the “no valid topics” error and ensure the subscription ACK for `market-data` is received (as seen in the logs: *Successfully subscribed to market-data*).

**B. Standardize Message Formats and Types:** We should make the message payload structure uniform for easier client handling. In practice, that means:

* **Use `subtype` or `action` consistently:** The unified WS schema defines message categories by `type` (e.g. `DATA`, `ERROR`) and uses `topic` and possibly an `action` for request/response flows. For server-broadcast data, using `subtype` to denote the kind of update (price update, full update, etc.) is fine, but we should match it with the front-end’s expected nomenclature. For example, consider emitting `subtype: 'full_update'` for the full snapshots. The front-end’s `handleMarketData` already checks `message.subtype` and differentiates full updates (treating them as a replace) vs. incremental updates (merge into state). Implementing this is straightforward: when broadcasting the 60-second full token list, add `subtype: 'full_update'` to the message. This way, the client can call `setTokens()` to replace the list rather than merging, which avoids stale tokens lingering.

* **Flatten the data field for updates:** It may be cleaner if the server sends just `{ topic: 'market-data', type: 'DATA', subtype: 'price_update', data: [ …tokens…] }` instead of nesting the array inside another object. The current code wraps it once more (putting tokens in `data.data`) because it directly forwarded the object emitted by the service. We can modify the broadcast handler to extract the array. For instance, in `registerServiceEvents` for `'market:price_update'`, do:

  ```js
  server.broadcastToTopic('market-data', {
     type: 'DATA', topic: 'market-data', subtype: 'price_update',
     data: data.data || data,  timestamp: new Date().toISOString()
  });
  ```

  Given `data` is the payload from MarketDataService (which itself has a `data` field inside), this will forward just the array of token updates. On the front-end, our handler then simply gets `message.data` as an array. This change isn’t strictly required (the client’s `tokenArray = message.data?.data || message.data` logic already accounts for both formats), but simplifying it reduces potential for error.

* **Ensure consistent field naming in token objects:** The front-end’s `transformBackendTokenData` function converts backend fields like `market_cap`, `volume_24h`, `change_24h` into both numeric and string forms, and aligns them with the `Token` interface. This is working well now. Just make sure that any new data added to token objects follows the same convention (for example, if adding a field, include it in the transform). This way, whenever a token update comes in, it can be merged into the React state without type issues.

**C. Optimize via Selective Token Subscriptions:** The most significant improvement is to **avoid sending all 2090 tokens to every client**. Instead, send each client only the token updates they need (e.g. tokens in their current contest’s portfolios, tokens they are watching, etc.). We will leverage the `token:price:<address>` subscription mechanism:

* **Backend support:** As of v69, the subscription handler treats `token:price:…` topics as valid and prepares for a Redis-based feed subscription. We should implement the `server.subscribeToTokenPrice(address)` function to hook into a price feed for that token. One approach is to use our existing MarketDataService: it could publish individual token updates to a Redis pub/sub channel whenever a token’s price updates. For example, when the Token Refresh Scheduler updates a token’s price in the DB, it can also `serviceEvents.emit('token:price_update', { address, price, ... })`. Then `registerServiceEvents` can listen and broadcast specifically to that token’s channel:

  ```js
  serviceEvents.on('token:price_update', (data) => {
    const topic = `token:price:${data.address}`;
    server.broadcastToTopic(topic, {
      type: 'DATA', topic, data, timestamp: new Date().toISOString()
    });
  });
  ```

  This way, as soon as a price for token X is fetched, we push an update to any clients subscribed to `token:price:X`. If implementing via Redis (for distributed architecture), the `subscribeToTokenPrice` could subscribe the unified WS server to a Redis channel for that token that the pricing service publishes to. The end result is the same: targeted, real-time updates.

* **Frontend usage:** On pages where the user only needs specific tokens (e.g. a live contest view showing only tokens in players’ portfolios), we should **avoid calling the generic `useTokenData`** (which subscribes to all data). Instead, use a more tailored approach:

  * Determine the relevant token addresses (from the contest API, we can retrieve the list of assets being used).
  * Call the unified webSocket `subscribe` method with those topics, e.g. `ws.subscribe(['token:price:Addr1', 'token:price:Addr2', …])`. You can see an example in the `useTokenData` effect where it constructs `newSubscriptions` for each token address.
  * Listen for updates on those topics. This could be done by registering a listener filter for `topics: [address1Topic, address2Topic,…]`, or simply by filtering inside a callback. Since each message will come tagged with `topic: 'token:price:<addr>'`, it’s easy to route them. For instance, maintain a map of address→price in local state and update accordingly when an update comes in.
  * The front-end already logs the attempt to subscribe to individual token channels. After fixing the backend as above, those calls will succeed (you should see subscribe ACKs for each token or at least no errors). Monitor the console/logs to ensure `Subscribed to token:price:…` messages appear without error.

* **Unsubscribing:** Don’t forget to unsubscribe from those token topics when appropriate. The `useTokenData` effect demonstrates cleanup by unsubscribing all token channels on unmount. You’ll want similar logic in a contest page hook – perhaps use the `componentId` feature of the WebSocket context to group those subs, then call `ws.unsubscribe(topics, componentId)` on teardown. The backend will remove the client from those subscription sets.

By implementing selective subscriptions, the system will send **far less data** overall. For example, if a contest involves 50 distinct tokens, the clients in that contest only get updates for those 50, instead of 2090. This reduces bandwidth and parsing overhead for both server and client.

**D. Remove Redundancy and Race Conditions:** Once selective updates are working, we can reevaluate whether the global `market-data` feed is needed for all users. Possibly:

* **For general pages (explore tokens, leaderboard of tokens, etc.)** – continue using `market-data` to get broad coverage.
* **For contest live pages or any scoped view** – rely on the token-specific subscriptions and do *not* subscribe to `market-data` at all. This prevents duplicate updates. In fact, you might refactor the front-end such that `useTokenData` (all tokens) and a new `useContestTokensData` (subset) are separate hooks to avoid overlapping subscriptions. The unified WebSocket server can handle a mix of clients, some subscribing to all data, others only to specific tokens.
* To avoid “double updating” the same token via two channels, ensure the front-end isn’t subscribed to both for the same data. For example, if a user has `market-data` and also `token:price:XYZ` subscribed, they might receive two updates for token XYZ (one in the batch and one individual). In the current `useTokenData` implementation, this can happen – which is why `handleMarketData` has no topic filter (it listens to all `DATA` messages, including token-specific ones). It then merges any `price_update` messages separately from full updates. This is functional, but if we move to a model where *either* you subscribe to all or you subscribe to some, we can eliminate such overlap. In the interim, the client code does guard against it: it updates token prices in-place from `price_update` messages and uses `initialData` flag to know when to stop loading via REST. As a precaution, you could add a condition to not double-merge the same token if an individual update arrives closely after a batch update, but a better architectural fix is to not subscribe to both feeds simultaneously for the same context.

**E. Key Files to Modify (Summary):** To implement the above, these are the specific files and sections to focus on:

* **Backend `unified/handlers.js`:** The subscription logic is already updated to accept `token:price:*`. Verify the `tokenPricePattern` regex and handling around it. You may implement `server.subscribeToTokenPrice` (perhaps in `UnifiedWebSocketServer` class or as an imported function) to initiate real-time price updates for that token (via Redis or calling an external API). Also, in `handleSubscription`, consider marking full-topic subscriptions vs. selective in logs for clarity.
* **Backend `unified/services.js`:** Add event handlers for individual token updates if using the internal event bus approach. For instance, if MarketDataService can emit `'token:update:<address>'` events when a specific token updates, catch those and broadcast to the corresponding topic. Since such granular events aren’t emitted yet, an easy win is inside the `'market:price_update'` handler: iterate over the `data` array and broadcast each token to its channel. Pseudocode:

  ```js
  serviceEvents.on('market:price_update', (payload) => {
    const updates = payload.data || payload; 
    updates.forEach(token => {
      const topic = `token:price:${token.address}`;
      if (server.topicSubscribers.has(topic)) {
        server.broadcastToTopic(topic, {
          type: 'DATA', topic, data: token, timestamp: new Date().toISOString()
        });
      }
    });
    // Also broadcast to 'market-data' as before, if needed:
    server.broadcastToTopic('market-data', { ... });
  });
  ```

  This ensures any client listening on a token’s channel gets an immediate update. (We include the check so we don’t waste time broadcasting tokens no one subscribed to.)
* **Backend `services/marketDataService.js`:** Ensure it **continues to emit** the events as expected. It already emits `serviceEvents.emit('market:price_update', priceOnlyData)` every 5 seconds. Confirm that `priceOnlyData` contains the minimal fields needed (you might include the token address and price, etc., which it does). If we decide to stop sending the huge 60s broadcast to everyone, you could conditionally emit `'market:broadcast'` only if there are any full-data subscribers. But since the unified WebSocket is the only consumer of those events now, it might be fine to leave as is and let the WS server decide whom to send to.
* **Frontend `useTokenData.ts`:** This hook is now fairly robust after the v69 refactor. We should use it as a reference for patterns (subscribe, unsubscribe, handling messages). For contest-specific needs, consider writing a similar hook that:

  * Fetches initial data for those contest tokens (maybe via REST or from the contest state).
  * Calls `ws.subscribe(tokenChannels)` for them (similar to lines ).
  * Registers a `ws.registerListener` filtered to those topics (or uses the global listener and filters inside). A simple approach: reuse the global listener but in the handler, ignore messages that aren’t in your contest token set.
  * Merges price updates into state. (This is essentially a subset of what `handleMarketData` does without the full list handling.)
  * Cleans up on unmount by unsubscribing those topics.

  By isolating contest token updates this way, you avoid pulling in all 2k tokens data at all. This will greatly improve performance and reduce “mismatched structure” issues simply by reducing volume.

In summary, **after these changes**, you will have a much cleaner live token data pipeline:

* The **backend** will consistently use unified socket v69 for everything (no legacy WS), and it will broadcast token updates in a structured way: full snapshots on a longer interval (possibly marked as full\_update) and rapid incremental updates either batched (to `market-data`) or single (`token:price:…`) depending on subscriptions.
* The **frontend** will connect once to `/api/v69/ws` and can subscribe either broadly or narrowly. We’ll avoid the scenario of “multiple duplicates of similar messages” because each page will choose one strategy. And we’ll have resolved the naming mismatches (thanks to normalization and using shared constants). The end result is a reliable live update system where, for example, a contest page can trust that its few dozen tokens are updating live (and not bogging down in thousands of irrelevant updates), while an overview page can still get the whole market view as needed.
