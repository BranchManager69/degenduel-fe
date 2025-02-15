// src/components/visualization/MarketVerse.tsx

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

interface TokenData {
  id: number;
  symbol: string;
  name: string;
  price: string;
  marketCap: string;
  volume24h: string;
  changesJson: {
    h24?: number;
    h1?: number;
    m5?: number;
  };
  transactionsJson: {
    h24: {
      buys: number;
      sells: number;
    };
  };
  imageUrl?: string;
}

interface ApiResponse {
  timestamp: string;
  data: TokenData[];
}

// Type guard to check if response is ApiResponse format
function isApiResponse(response: unknown): response is ApiResponse {
  const isValid =
    typeof response === "object" &&
    response !== null &&
    "timestamp" in response &&
    "data" in response &&
    Array.isArray((response as ApiResponse).data);

  console.log("[MarketVerse] Response format check (wrapped):", {
    isValid,
    hasTimestamp:
      response && typeof response === "object" && "timestamp" in response,
    hasData: response && typeof response === "object" && "data" in response,
    isDataArray:
      response &&
      typeof response === "object" &&
      "data" in response &&
      Array.isArray((response as ApiResponse).data),
  });

  return isValid;
}

// Type guard to check if response is direct array format
function isTokenDataArray(response: unknown): response is TokenData[] {
  const isArray = Array.isArray(response);
  const hasValidItems =
    isArray &&
    response.every(
      (item) =>
        typeof item === "object" &&
        item !== null &&
        "id" in item &&
        "symbol" in item &&
        "name" in item &&
        "token_prices" in item &&
        "change_24h" in item &&
        "volume_24h" in item &&
        "market_cap" in item
    );

  console.log("[MarketVerse] Response format check (array):", {
    isArray,
    length: isArray ? response.length : 0,
    hasValidItems,
    sampleItem: isArray && response.length > 0 ? response[0] : null,
  });

  return isArray && hasValidItems;
}

// Transform API response to TokenData format
function transformApiResponse(data: any[]): TokenData[] {
  return data.map((item) => ({
    id: item.id,
    symbol: item.symbol,
    name: item.name,
    price: item.token_prices?.price || "0",
    marketCap: item.market_cap || "0",
    volume24h: item.volume_24h || "0",
    changesJson: {
      h24: parseFloat(item.change_24h || "0"),
      h1: 0, // Not available in current API
      m5: 0, // Not available in current API
    },
    transactionsJson: {
      h24: {
        buys: 0, // Not available in current API
        sells: 0, // Not available in current API
      },
    },
    imageUrl: item.image_url || null,
  }));
}

export const MarketVerse: React.FC = () => {
  const { maintenanceMode } = useStore();
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const spheresRef = useRef<THREE.Mesh[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [lastUpdateTime, setLastUpdateTime] = useState<string | null>(null);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        // Skip fetching if in maintenance mode
        if (maintenanceMode) {
          setIsLoading(false);
          return;
        }

        console.log("[MarketVerse] Initiating market data fetch...");
        const response = await ddApi.fetch("/api/tokens");

        if (!response.ok) {
          const errorText = await response.text();
          console.error("[MarketVerse] Market data fetch failed:", {
            status: response.status,
            statusText: response.statusText,
            error: errorText,
          });
          throw new Error(
            `Failed to fetch market data: ${response.status} ${response.statusText}`
          );
        }

        const rawData = await response.json();
        console.log("[MarketVerse] Raw market data received:", rawData);

        let tokenData: TokenData[];
        if (isApiResponse(rawData)) {
          console.log("[MarketVerse] Processing wrapped response format");
          tokenData = transformApiResponse(rawData.data);
          setLastUpdateTime(rawData.timestamp);
        } else if (isTokenDataArray(rawData)) {
          console.log("[MarketVerse] Processing direct array format");
          tokenData = transformApiResponse(rawData);
          setLastUpdateTime(new Date().toISOString());
        } else {
          console.error("[MarketVerse] Invalid data format:", rawData);
          throw new Error("Invalid market data format received");
        }

        console.log("[MarketVerse] Processed token data:", {
          count: tokenData.length,
          symbols: tokenData.map((t) => t.symbol).join(", "),
        });

        // Initialize visualization with data
        initializeVisualization(tokenData);
        setIsLoading(false);
      } catch (err) {
        console.error("[MarketVerse] Error in market data fetch:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch market data"
        );
        setIsLoading(false);
      }
    };

    fetchMarketData();
    // Only set up interval if not in maintenance mode
    if (!maintenanceMode) {
      const interval = setInterval(fetchMarketData, 30000);
      return () => clearInterval(interval);
    }
  }, [maintenanceMode]);

  const initializeVisualization = (marketData: TokenData[]) => {
    console.log(
      "[MarketVerse] Initializing visualization with",
      marketData.length,
      "tokens"
    );

    if (!containerRef.current) {
      console.error("[MarketVerse] Container ref not available");
      return;
    }

    try {
      // Initialize Three.js scene
      const scene = new THREE.Scene();
      sceneRef.current = scene;

      // Clear existing spheres
      spheresRef.current.forEach((sphere) => scene.remove(sphere));
      spheresRef.current = [];

      // Create renderer with transparency
      if (!rendererRef.current) {
        const renderer = new THREE.WebGLRenderer({
          antialias: true,
          alpha: true,
          premultipliedAlpha: false,
        });
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.setPixelRatio(window.devicePixelRatio);
        renderer.setClearColor(0x000000, 0); // Fully transparent
        containerRef.current.appendChild(renderer.domElement);
        rendererRef.current = renderer;
      }

      // Create spheres based on market data
      marketData.forEach((token, index) => {
        try {
          const marketCap = parseFloat(token.marketCap) || 0;
          console.log(
            `[MarketVerse] Processing token: ${token.symbol}, Market Cap: ${marketCap}`
          );

          // Calculate size based on market cap
          const size = Math.max(20, Math.min(50, Math.log10(marketCap) * 5));

          // Create sphere
          const geometry = new THREE.SphereGeometry(size, 32, 32);

          // Color based on 24h change
          const change24h = token.changesJson?.h24 || 0;
          const hue = change24h > 0 ? 0.3 : 0.0; // Green for positive, red for negative
          const saturation = Math.min(Math.abs(change24h), 1);

          const material = new THREE.MeshPhongMaterial({
            color: new THREE.Color().setHSL(hue, saturation, 0.5),
            shininess: 60,
          });

          const sphere = new THREE.Mesh(geometry, material);

          // Position in a circular pattern
          const angle = (index / marketData.length) * Math.PI * 2;
          const radius = 200;
          sphere.position.x = Math.cos(angle) * radius;
          sphere.position.z = Math.sin(angle) * radius;

          scene.add(sphere);
          spheresRef.current.push(sphere);
        } catch (err) {
          console.error(
            `[MarketVerse] Error processing token ${token.symbol}:`,
            err
          );
        }
      });

      // Add lights
      const ambientLight = new THREE.AmbientLight(0x404040);
      scene.add(ambientLight);

      const light = new THREE.PointLight(0xffffff, 1, 1000);
      light.position.set(100, 100, 100);
      scene.add(light);

      // Initialize camera if not exists
      if (!cameraRef.current) {
        const camera = new THREE.PerspectiveCamera(
          75,
          window.innerWidth / window.innerHeight,
          0.1,
          1000
        );
        camera.position.z = 400;
        camera.position.y = 100;
        cameraRef.current = camera;
      }

      // Initialize controls
      const controls = new OrbitControls(
        cameraRef.current,
        rendererRef.current!.domElement
      );
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;

      // Animation loop
      const animate = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current)
          return;

        requestAnimationFrame(animate);
        if (controlsRef.current) {
          controlsRef.current.update();
        }

        // Rotate spheres
        spheresRef.current.forEach((sphere, index) => {
          sphere.rotation.y += 0.01 * (index % 2 ? 1 : -1);
        });

        rendererRef.current.render(sceneRef.current, cameraRef.current);
      };
      animate();

      console.log("[MarketVerse] Visualization initialized successfully");
    } catch (err) {
      console.error(
        "[MarketVerse] Error in visualization initialization:",
        err
      );
      setError("Failed to initialize visualization");
    }
  };

  // Handle window resize
  useEffect(() => {
    const handleResize = () => {
      if (!containerRef.current || !rendererRef.current || !cameraRef.current)
        return;

      const width = window.innerWidth;
      const height = window.innerHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();
      rendererRef.current.setSize(width, height);

      console.log("[MarketVerse] Resized to:", { width, height });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log("[MarketVerse] Cleaning up resources");
      if (containerRef.current && rendererRef.current?.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      rendererRef.current?.dispose();
      spheresRef.current.forEach((sphere) => {
        sphere.geometry.dispose();
        (sphere.material as THREE.Material).dispose();
      });
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 0 }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm">
          <div className="text-brand-400 animate-pulse">
            Loading Market Visualization...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute left-0 top-1/2 -translate-y-1/2 z-50">
          <div className="bg-red-500/10 border-r border-y border-red-500/20 backdrop-blur-sm py-3 px-4 min-w-[200px] max-w-[90vw] clip-edges">
            <div className="flex items-start gap-2">
              <div className="text-red-400 mt-0.5">⚠</div>
              <div className="flex-1">
                <div className="text-red-400 font-medium mb-1">
                  Visualization Error
                </div>
                <div className="text-red-400/90 text-sm break-words">
                  {error}
                </div>
                <div className="text-red-400/75 text-xs mt-2">
                  Last attempt: {new Date().toLocaleTimeString()}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
      {lastUpdateTime && !error && (
        <div className="absolute bottom-4 right-4 text-xs text-gray-500">
          Last updated: {new Date(lastUpdateTime).toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};
