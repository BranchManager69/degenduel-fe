import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { ddApi } from "../../services/dd-api";

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

export const MarketVerse: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  // Fetch market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        console.log("Fetching market data...");
        const response = await ddApi.fetch("/dd-serv/tokens");

        if (!response.ok) {
          const errorText = await response.text();
          console.error("Market data fetch failed:", errorText);
          throw new Error(
            `Failed to fetch market data: ${response.status} ${response.statusText}`
          );
        }

        const data: ApiResponse = await response.json();
        console.log("Market data received:", data);

        if (!data || !data.data || !Array.isArray(data.data)) {
          throw new Error("Invalid market data format received");
        }

        // Initialize visualization with data
        initializeVisualization(data.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error in market data fetch:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch market data"
        );
        setIsLoading(false);
      }
    };

    fetchMarketData();
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const initializeVisualization = (marketData: TokenData[]) => {
    if (!containerRef.current || !sceneRef.current) return;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Create spheres based on market data
    marketData.forEach((token, index) => {
      const marketCap = parseFloat(token.marketCap) || 0;

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
    });

    // Add lights
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    const light = new THREE.PointLight(0xffffff, 1, 1000);
    light.position.set(100, 100, 100);
    scene.add(light);

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 400;
    camera.position.y = 100;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controlsRef.current = controls;

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);
      controls.update();
      renderer.render(scene, camera);
    };
    animate();

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  };

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 0, background: "#000" }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-brand-400 animate-pulse">
            Loading Market Visualization...
          </div>
        </div>
      )}
      {error && (
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">
            {error}
          </div>
        </div>
      )}
    </div>
  );
};
