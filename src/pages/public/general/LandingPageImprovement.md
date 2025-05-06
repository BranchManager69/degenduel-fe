# Landing Page (`LandingPage.tsx`) Refactoring & Optimization Plan

This document summarizes the analysis of `src/pages/public/general/LandingPage.tsx` and outlines steps to improve its performance, maintainability, and user experience.

## Current State & Identified Issues

1.  **Animation Complexity:**
    *   The landing page uses a manual, multi-phase animation system controlled by `animationPhase` state and multiple `setTimeout` calls (`phaseOneTimer`, `phaseTwoTimer`).
    *   This approach is brittle, hard to follow, and scattered across various `motion.div` elements.

2.  **Back Button Navigation Experience:**
    *   When navigating away from the landing page and then returning via the browser's back button, the entire entry animation sequence re-runs.
    *   This is because the component re-mounts, resetting its state (`animationPhase`) and re-triggering the animation `useEffect`. This creates a jarring and slow user experience.

3.  **Inefficient Polling:**
    *   **Maintenance Status:** The component polls `ddApi.admin.checkMaintenanceMode()` every 5 minutes (previously 30 seconds) using `setInterval`. This is inefficient as maintenance status changes infrequently.
    *   **Contract Address Reveal:** A complex system involving `setTimeout` (`countdownCheckerRef`) and `setInterval` (`pollingIntervalRef`) is used to poll for the contract address after a specific release time. This is also inefficient and adds unnecessary load.

4.  **Incorrect Component Nesting:**
    *   Most major sections of the landing page (Terminal, Features, Contests, Market Stats, etc.) appear to be incorrectly nested *within* the initial "Title Section" `div`, rather than being siblings.

5.  **Zustand Store State (`useStore.ts`):**
    *   The store defines state slices for `contests` and `tokens`.
    *   However, these slices are **not currently included** in the `persist` middleware's `partialize` configuration. Therefore, fetched contest and token data is *not* saved to local storage and is lost upon page navigation.
    *   A `landingPageAnimationDone` flag *has been added* to the store state and persistence configuration to track if the initial animation has run.

## Recommended Actions

1.  **Refactor Animations:**
    *   **Goal:** Simplify animation logic and make it more declarative.
    *   **Action:** Remove the `animationPhase` state and the corresponding `setTimeout` logic (`phaseOneTimer`, `phaseTwoTimer`).
    *   **Implementation:** Use Framer Motion's orchestration features. Wrap related sections in a parent `motion.div` and use `variants` with `staggerChildren` to define the entry animation sequence declaratively. Trigger this sequence once on component mount or when it becomes visible.

2.  **Fix Back Button Animation Re-run:**
    *   **Goal:** Prevent the full entry animation from playing when navigating back to the page.
    *   **Action:** Utilize the `landingPageAnimationDone` flag in the Zustand store.
    *   **Implementation:**
        *   The logic added in the previous step (checking `landingPageAnimationDone` on mount and skipping timers/setting final animation state if true) correctly addresses this. Ensure this logic remains in place after refactoring animations (Step 1). If using Framer Motion variants, you might set the parent container's `initial` state conditionally based on this flag.

3.  **Implement Data Caching (Zustand):**
    *   **Goal:** Prevent re-fetching data (like contests) and showing loading states when navigating back to the page.
    *   **Action:** Persist relevant data slices and update fetching logic.
    *   **Implementation:**
        *   In `src/store/useStore.ts`, add `contests: state.contests` (and potentially `tokens: state.tokens` if caching tokens globally is desired) to the `partialize` function within `persistConfig`.
        *   In `LandingPage.tsx`, modify the `useEffect` hook responsible for fetching contests (`retryContestFetch`). Before fetching, check `useStore.getState().contests`. If the array is not empty, use the cached data immediately (`setActiveContests`, `setOpenContests`) and potentially skip setting `loading` to true. Fetch fresh data in the background if desired.

4.  **Eliminate Polling via WebSockets:**
    *   **Goal:** Replace inefficient HTTP polling with real-time updates pushed from the server.
    *   **Action (Maintenance Status):**
        *   **Backend:** Modify the backend to broadcast a WebSocket message (e.g., Topic: `SYSTEM`, Action: `maintenance_status_update`, Data: `{ enabled: boolean }`) when maintenance mode changes.
        *   **Frontend:** Update the central WebSocket message handler (`UnifiedWebSocketProvider` or similar) to listen for this specific message and call `useStore.getState().setMaintenanceMode()` with the received status.
        *   **Frontend:** Remove the `maintenanceCheckInterval` `setInterval` from `LandingPage.tsx`.
    *   **Action (Contract Address):**
        *   **Backend:** Modify the backend to broadcast a WebSocket message when the contract address becomes available/is set.
        *   **Frontend:** Listen for this message in the WebSocket handler and update the relevant state (e.g., `setContractAddress`).
        *   **Frontend:** Remove the complex `useEffect` logic involving `countdownCheckerRef`, `pollingIntervalRef`, and `startAddressPolling` from `LandingPage.tsx`. The `DecryptionTimer` component might need adjustment to react to the address becoming available via state/props rather than polling.

5.  **Fix Component Nesting:**
    *   **Goal:** Improve HTML structure and maintainability.
    *   **Action:** Review the JSX structure within the main `return` statement of `LandingPage.tsx`. Ensure that major sections (Hero, Terminal, Features, Contests, etc.) are structured as sibling elements rather than being deeply nested within the first `div` after the "Title Section" comment.
