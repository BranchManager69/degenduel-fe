import { useStore } from "../store/useStore";
import { useBaseWebSocket } from "./useBaseWebSocket";

interface WalletUpdate {
  type: "WALLET_UPDATED";
  data: {
    type: "created" | "statusChanged" | "balanceChanged";
    publicKey: string;
    balance?: number;
    status?: "active" | "inactive" | "locked";
    timestamp: string;
  };
}

interface TransferStarted {
  type: "TRANSFER_STARTED";
  data: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    token?: string;
    estimated_completion?: string;
    timestamp: string;
  };
}

interface TransferComplete {
  type: "TRANSFER_COMPLETE";
  data: {
    transfer_id: string;
    from: string;
    to: string;
    amount: number;
    status: "success" | "failed";
    final_amount?: number;
    fee?: number;
    error?: string;
    timestamp: string;
  };
}

interface WalletActivity {
  type: "WALLET_ACTIVITY";
  data: {
    wallet: string;
    activity_type: "login" | "logout" | "connect" | "disconnect";
    device_info?: string;
    ip_address?: string;
    location?: string;
    timestamp: string;
  };
}

type WalletMessage =
  | WalletUpdate
  | TransferStarted
  | TransferComplete
  | WalletActivity;

export const useWalletWebSocket = () => {
  const { updateWalletStatus, trackTransfer, updateWalletActivity } =
    useStore();

  const handleMessage = (message: WalletMessage) => {
    switch (message.type) {
      case "WALLET_UPDATED":
        updateWalletStatus(message.data);
        break;
      case "TRANSFER_STARTED":
        trackTransfer({
          transfer_id: message.data.transfer_id,
          from: message.data.from,
          to: message.data.to,
          amount: message.data.amount,
          token: message.data.token,
          timestamp: message.data.timestamp,
        });
        break;
      case "TRANSFER_COMPLETE":
        trackTransfer({
          transfer_id: message.data.transfer_id,
          from: message.data.from,
          to: message.data.to,
          amount: message.data.amount,
          status: message.data.status,
          error: message.data.error,
          timestamp: message.data.timestamp,
        });
        break;
      case "WALLET_ACTIVITY":
        updateWalletActivity(message.data);
        break;
    }
  };

  return useBaseWebSocket({
    url: import.meta.env.VITE_WS_URL,
    endpoint: "/v2/ws/wallet",
    socketType: "wallet",
    onMessage: handleMessage,
    heartbeatInterval: 30000, // 30 second heartbeat
    maxReconnectAttempts: 5,
  });
};
