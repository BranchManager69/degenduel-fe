import { createRpc, createSolanaRpcApi, type Rpc } from '@solana/rpc';
import { type SolanaRpcMethods } from '@solana/rpc-spec';
import { createHttpTransport } from '@solana/rpc-transport-http';

// SolanaRpcMethods from @solana/rpc should cover standard methods.
// If you had custom RPC methods on your proxy not part of standard Solana JSON-RPC,
// you would extend the RpcMethods generic type.
type DegenDuelRpcMethods = SolanaRpcMethods;

const solanaApi = createSolanaRpcApi();

/**
 * Creates a Solana RPC client instance configured to communicate with a specific endpoint,
 * optionally including a JWT for authorization.
 *
 * @param endpoint The RPC endpoint URL.
 * @param jwtToken The DegenDuel JWT, or null if not authenticated.
 * @returns An Rpc client instance.
 */
export function createDegenDuelRpcClient(
  endpoint: string,
  jwtToken: string | null
): Rpc<DegenDuelRpcMethods> {
  const baseHeaders: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (jwtToken) {
    baseHeaders['Authorization'] = `Bearer ${jwtToken}`;
    console.log(`[rpcClient] Creating RPC client for endpoint: ${endpoint} WITH DegenDuel JWT.`);
  } else {
    console.log(`[rpcClient] Creating RPC client for endpoint: ${endpoint} WITHOUT DegenDuel JWT.`);
  }

  const transport = createHttpTransport({
    url: endpoint,
    headers: baseHeaders, // createHttpTransport should accept Record<string, string>
                          // but its internal type is complex. If this still errors,
                          // we might need a more specific cast or to inspect its exact Headers type.
  });

  return createRpc({ api: solanaApi, transport });
}

// Example of how you might manage a global or context-based client that reacts to auth changes:
// This is conceptual and would typically live within a React context or state management.

// let currentRpcClient: Rpc<DegenDuelRpcMethods> | null = null;
// let currentAuthToken: string | null = null;
// let currentEndpointUrl: string = 'YOUR_DEFAULT_PUBLIC_RPC_ENDPOINT'; // Fallback

// function getRpcClient(newEndpoint?: string, newJwtToken?: string | null): Rpc<DegenDuelRpcMethods> {
//   const endpointToUse = newEndpoint || currentEndpointUrl;
//   const tokenToUse = newJwtToken !== undefined ? newJwtToken : currentAuthToken;

//   if (!currentRpcClient || currentAuthToken !== tokenToUse || currentEndpointUrl !== endpointToUse) {
//     console.log('[rpcClientManager] Conditions met to create new RPC client instance.');
//     currentRpcClient = createDegenDuelRpcClient(endpointToUse, tokenToUse);
//     currentAuthToken = tokenToUse;
//     currentEndpointUrl = endpointToUse;
//   } else {
//     console.log('[rpcClientManager] Reusing existing RPC client instance.');
//   }
//   return currentRpcClient;
// }

// // Call this when auth state changes:
// export function updateRpcAuth(newEndpoint: string, newJwtToken: string | null) {
//   console.log('[rpcClientManager] Updating RPC auth details.');
//   // Force re-creation on next getRpcClient call if details changed
//   if (currentEndpointUrl !== newEndpoint || currentAuthToken !== newJwtToken) {
//     currentRpcClient = null; 
//     currentEndpointUrl = newEndpoint; // Update stored endpoint
//     currentAuthToken = newJwtToken; // Update stored token
//   }
// }

// export { getRpcClient }; // Export the getter 