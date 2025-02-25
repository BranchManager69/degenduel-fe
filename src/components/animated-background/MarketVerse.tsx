// src/components/visualization/MarketVerse.tsx

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
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
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const spheresRef = useRef<THREE.Mesh[]>([]);
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-1000, -1000));
  const targetCameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 100, 400));
  const selectedSphereRef = useRef<THREE.Mesh | null>(null);
  const highlightedSphereRef = useRef<THREE.Mesh | null>(null);
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
        
        // Add mouse move event listener for raycasting
        renderer.domElement.addEventListener("mousemove", (event) => {
          const rect = renderer.domElement.getBoundingClientRect();
          mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
          mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
        });
        
        // Add scroll event listener
        window.addEventListener("scroll", () => {
          if (cameraRef.current) {
            // Calculate scroll position as a percentage
            const scrollY = window.scrollY;
            const maxScroll = document.body.scrollHeight - window.innerHeight;
            const scrollPercent = Math.min(1, Math.max(0, scrollY / maxScroll));
            
            // Adjust camera target based on scroll
            const scrollTarget = new THREE.Vector3(
              0,
              100 + (scrollPercent * 50), // Move up as we scroll
              400 - (scrollPercent * 100)  // Move closer as we scroll
            );
            
            // Smoothly transition to new position
            targetCameraPositionRef.current.lerp(scrollTarget, 0.5);
          }
        });
      }

      // Create spheres based on market data
      marketData.forEach((token, index) => {
        try {
          const marketCap = parseFloat(token.marketCap) || 0;
          console.log(
            `[MarketVerse] Processing token: ${token.symbol}, Market Cap: ${marketCap}`
          );

          // Calculate size based on market cap
          const size = Math.max(15, Math.min(45, Math.log10(marketCap) * 5));

          // Select geometry based on token characteristics
          let geometry;
          const vol24h = parseFloat(token.volume24h) || 0;
          const volToMarketCapRatio = vol24h / marketCap;
          
          // Use different geometries to distinguish tokens
          if (volToMarketCapRatio > 0.5) {
            // High volume relative to market cap - very active trading
            geometry = new THREE.TorusKnotGeometry(size * 0.8, size * 0.2, 64, 8, 2, 3);
          } else if (volToMarketCapRatio > 0.2) {
            // Medium-high volume to market cap - moderately active
            geometry = new THREE.OctahedronGeometry(size * 0.9, 2);
          } else if (marketCap > 10000000000) {
            // Large cap tokens (>$10B)
            geometry = new THREE.IcosahedronGeometry(size, 1);
          } else if (marketCap > 1000000000) {
            // Mid cap tokens ($1B-$10B)
            geometry = new THREE.DodecahedronGeometry(size * 0.95, 0);
          } else if (marketCap > 100000000) {
            // Small cap tokens ($100M-$1B)
            geometry = new THREE.TetrahedronGeometry(size, 0);
          } else {
            // Micro cap tokens (<$100M)
            geometry = new THREE.SphereGeometry(size, 32, 16);
          }

          // Color based on 24h change with more distinctive coloring
          const change24h = token.changesJson?.h24 || 0;
          const isPositive = change24h > 0;
          
          // More distinctive coloring system:
          // - Highly positive: Bright green
          // - Slightly positive: Cyan-green
          // - Neutral: Blue
          // - Slightly negative: Purple-red
          // - Highly negative: Bright red
          
          let color, emissiveColor;
          
          if (change24h > 20) {
            // Explosive growth (>20%)
            color = new THREE.Color(0x00ff00);
            emissiveColor = new THREE.Color(0x00ff66);
          } else if (change24h > 5) {
            // Strong positive (5-20%)
            color = new THREE.Color(0x33ff33);
            emissiveColor = new THREE.Color(0x22dd44); 
          } else if (change24h > 0) {
            // Slight positive (0-5%)
            color = new THREE.Color(0x66ffcc);
            emissiveColor = new THREE.Color(0x44ddaa);
          } else if (change24h > -5) {
            // Slight negative (0 to -5%)
            color = new THREE.Color(0xdd66ff);
            emissiveColor = new THREE.Color(0xbb44dd);
          } else if (change24h > -20) {
            // Strong negative (-5 to -20%)
            color = new THREE.Color(0xff3366);
            emissiveColor = new THREE.Color(0xdd2244);
          } else {
            // Severe drop (< -20%)
            color = new THREE.Color(0xff0000);
            emissiveColor = new THREE.Color(0xdd0000);
          }

          // Add texture or pattern based on token symbol's first letter
          const intensity = Math.max(0.5, Math.min(1, Math.abs(change24h) / 15));
          
          // Create material with more visual distinctiveness
          const material = new THREE.MeshPhysicalMaterial({
            color: color,
            emissive: emissiveColor,
            emissiveIntensity: intensity * 0.4,
            metalness: isPositive ? 0.7 : 0.3,
            roughness: isPositive ? 0.2 : 0.8,
            clearcoat: 0.5,
            clearcoatRoughness: 0.3,
            reflectivity: 0.7,
            transparent: true,
            opacity: 0.9,
          });

          const sphere = new THREE.Mesh(geometry, material);
          
          // Store first character of symbol for future label implementation
          // const symbolFirstChar = token.symbol.charAt(0).toUpperCase();
          
          // Store token data on the mesh for raycasting
          sphere.userData = {
            token: token.symbol,
            name: token.name,
            price: token.price,
            change24h: change24h,
            marketCap: marketCap,
          };

          // Position in a circular pattern with varied heights for depth
          const angle = (index / marketData.length) * Math.PI * 2;
          const radius = 200 + (Math.random() * 50 - 25); // Add some variation
          const height = (Math.random() * 100 - 50) * (marketCap / 10000000000); // Higher market cap = more variation
          
          sphere.position.x = Math.cos(angle) * radius;
          sphere.position.y = height;
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
        // Store initial camera position
        targetCameraPositionRef.current.copy(camera.position);
      }

      // Initialize controls
      const controls = new OrbitControls(
        cameraRef.current,
        rendererRef.current!.domElement
      );
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controlsRef.current = controls;
      
      // Set up post-processing with depth of field
      if (!composerRef.current) {
        const composer = new EffectComposer(rendererRef.current!);
        const renderPass = new RenderPass(scene, cameraRef.current);
        composer.addPass(renderPass);
        
        // Add Bokeh depth of field pass
        const bokehPass = new BokehPass(scene, cameraRef.current, {
          focus: 200,
          aperture: 0.0025,
          maxblur: 0.01
        });
        composer.addPass(bokehPass);
        
        composerRef.current = composer;
      }

      // Animation loop
      const animate = () => {
        if (!sceneRef.current || !cameraRef.current || !rendererRef.current)
          return;

        requestAnimationFrame(animate);
        
        if (controlsRef.current) {
          controlsRef.current.update();
        }
        
        // Perform raycasting for hover effects
        raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
        const intersects = raycasterRef.current.intersectObjects(spheresRef.current);
        
        // Reset previous highlight
        if (highlightedSphereRef.current && 
            (!intersects.length || highlightedSphereRef.current !== intersects[0].object)) {
          const material = highlightedSphereRef.current.material as THREE.MeshPhysicalMaterial;
          // Restore original intensity
          if (material.emissive) {
            // Get token change data
            const change24h = highlightedSphereRef.current.userData.change24h || 0;
            const intensity = Math.max(0.5, Math.min(1, Math.abs(change24h) / 15));
            
            // Restore original properties
            material.emissiveIntensity = intensity * 0.4;
            material.opacity = 0.9;
            material.metalness = change24h >= 0 ? 0.7 : 0.3;
            material.roughness = change24h >= 0 ? 0.2 : 0.8;
            material.clearcoat = 0.5;
          }
          highlightedSphereRef.current.scale.set(1, 1, 1);
          highlightedSphereRef.current = null;
        }
        
        // Create highlight effect and adjust camera focus
        if (intersects.length > 0) {
          const sphere = intersects[0].object as THREE.Mesh;
          
          // Create highlight effect
          if (highlightedSphereRef.current !== sphere) {
            highlightedSphereRef.current = sphere;
            
            // Get token data from sphere
            const tokenData = sphere.userData;
            
            // Create floating token info display
            if (tokenData) {
              // Log token data on hover for debugging
              console.log("[MarketVerse] Hovering token:", tokenData);
            }
            
            // Enhance visual appearance
            const material = sphere.material as THREE.MeshPhysicalMaterial;
            
            // Boost glow effect
            if (material.emissive) {
              material.emissiveIntensity = 0.9;
              material.opacity = 1.0;
              material.metalness = 1.0;
              material.clearcoat = 1.0;
              material.roughness = 0.1;
            }
            
            // Make token larger on hover
            sphere.scale.set(1.3, 1.3, 1.3);
            
            // Create a spotlight to highlight the token
            const spotLight = new THREE.SpotLight(0xffffff, 2, 300, Math.PI / 6, 0.5, 1);
            spotLight.position.set(sphere.position.x, sphere.position.y + 100, sphere.position.z);
            spotLight.target = sphere;
            spotLight.name = "highlightSpot";
            
            // Remove any existing spotlight
            const existingSpot = sceneRef.current?.getObjectByName("highlightSpot");
            if (existingSpot) {
              sceneRef.current?.remove(existingSpot);
            }
            
            sceneRef.current?.add(spotLight);
            
            // Create visual beam effect
            const length = 150;
            const beamColor = tokenData.change24h >= 0 ? 0x00ff88 : 0xff4466;
            
            // Create beam geometry
            const beamGeometry = new THREE.CylinderGeometry(0.5, 5, length, 8, 1, true);
            const beamMaterial = new THREE.MeshBasicMaterial({
              color: beamColor,
              transparent: true,
              opacity: 0.3,
              side: THREE.DoubleSide
            });
            
            // Remove existing beam
            const existingBeam = sceneRef.current?.getObjectByName("highlightBeam");
            if (existingBeam) {
              sceneRef.current?.remove(existingBeam);
            }
            
            // Position and orient beam
            const beam = new THREE.Mesh(beamGeometry, beamMaterial);
            beam.name = "highlightBeam";
            beam.position.copy(sphere.position);
            beam.position.y += length / 2;
            beam.updateMatrix();
            sceneRef.current?.add(beam);
            
            // Create a token info panel
            if (tokenData) {
              // Target camera to focus on this token
              const position = new THREE.Vector3().copy(sphere.position);
              position.z += 250; // Stay further back for better view
              position.y += 50;  // Raise the camera slightly
              targetCameraPositionRef.current.copy(position);
            }
          }
        } else {
          // If no hover, gradually return to original position
          targetCameraPositionRef.current.lerp(new THREE.Vector3(0, 100, 400), 0.02);
          
          // Remove highlight spotlight
          const existingSpot = sceneRef.current?.getObjectByName("highlightSpot");
          if (existingSpot) {
            sceneRef.current?.remove(existingSpot);
          }
          
          // Remove highlight beam
          const existingBeam = sceneRef.current?.getObjectByName("highlightBeam");
          if (existingBeam) {
            sceneRef.current?.remove(existingBeam);
          }
        }
        
        // Smoothly move camera toward target position
        if (cameraRef.current) {
          cameraRef.current.position.lerp(targetCameraPositionRef.current, 0.03);
        }

        // Rotate and animate spheres with different patterns based on token properties
        spheresRef.current.forEach((sphere, index) => {
          const tokenData = sphere.userData;
          const change24h = tokenData.change24h || 0;
          const marketCap = tokenData.marketCap || 0;
          
          // Determine rotation speed and pattern based on token characteristics
          const isPositive = change24h >= 0;
          
          // Base rotation - different patterns based on market performance
          if (Math.abs(change24h) > 10) {
            // Highly volatile tokens rotate faster and more chaotically
            sphere.rotation.y += 0.02 * (isPositive ? 1 : -1);
            sphere.rotation.x += 0.015 * (index % 2 ? 1 : -1);
            sphere.rotation.z += 0.005 * (index % 3 ? 1 : -1);
          } else if (Math.abs(change24h) > 3) {
            // Moderately active tokens
            sphere.rotation.y += 0.015 * (isPositive ? 1 : -1);
            sphere.rotation.x += 0.01 * (index % 2 ? 1 : -1);
          } else {
            // Stable tokens rotate more slowly and predictably
            sphere.rotation.y += 0.008 * (index % 2 ? 1 : -1);
            sphere.rotation.x += 0.004 * (index % 3 ? 1 : -1);
          }
          
          // Add subtle position oscillation for larger market cap tokens
          if (marketCap > 5000000000) {
            const time = Date.now() * 0.001;
            const oscillationFactor = 0.08;
            
            // Calculate oscillation based on time and token index for variety
            const yOscillation = Math.sin(time * 0.5 + index * 0.2) * oscillationFactor;
            const xOscillation = Math.cos(time * 0.3 + index * 0.1) * oscillationFactor;
            
            // Apply subtle position changes
            sphere.position.y += yOscillation;
            sphere.position.x += xOscillation;
          }
        });

        // Use composer instead of renderer directly for post-processing
        if (composerRef.current) {
          composerRef.current.render();
        } else {
          rendererRef.current.render(sceneRef.current, cameraRef.current);
        }
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
      
      // Also update composer if it exists
      if (composerRef.current) {
        composerRef.current.setSize(width, height);
        
        // Update bokeh pass parameters if needed
        composerRef.current.passes.forEach(pass => {
          if (pass instanceof BokehPass) {
            pass.renderTargetDepth.setSize(width, height);
          }
        });
      }

      console.log("[MarketVerse] Resized to:", { width, height });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Cleanup
  useEffect(() => {
    return () => {
      console.log("[MarketVerse] Cleaning up resources");
      
      // Remove event listeners
      if (rendererRef.current?.domElement) {
        rendererRef.current.domElement.removeEventListener("mousemove", () => {});
      }
      window.removeEventListener("scroll", () => {});
      
      // Remove DOM element
      if (containerRef.current && rendererRef.current?.domElement) {
        containerRef.current.removeChild(rendererRef.current.domElement);
      }
      
      // Dispose renderer
      rendererRef.current?.dispose();
      
      // Dispose all mesh resources
      spheresRef.current.forEach((sphere) => {
        sphere.geometry.dispose();
        (sphere.material as THREE.Material).dispose();
      });
      
      // Clean up post-processing resources
      if (composerRef.current) {
        composerRef.current.passes.forEach((pass) => {
          if (pass instanceof BokehPass) {
            pass.dispose();
          }
        });
      }
      
      // Clear references
      composerRef.current = null;
      highlightedSphereRef.current = null;
      selectedSphereRef.current = null;
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
