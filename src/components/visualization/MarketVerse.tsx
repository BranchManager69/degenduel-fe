import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ddApi } from "../../services/dd-api";

interface TokenNode {
  id: string;
  symbol: string;
  position: THREE.Vector3;
  mesh: THREE.Mesh;
  particles: THREE.Points;
  energy: number;
  marketCap: number;
  volume: number;
  buyRatio: number;
  lastUpdate: number;
  imageUrl?: string;
}

interface MarketData {
  id: number;
  symbol: string;
  name: string;
  price: {
    usd: number;
    formatted: string;
  };
  marketCap: number;
  volume: {
    h24: number;
    usd: number;
  };
  transactions: {
    h1: { buys: number; sells: number };
    h24: { buys: number; sells: number };
  };
  imageUrl?: string;
}

const loadTexture = (url: string, itemsLoaded: number, itemsTotal: number): Promise<THREE.Texture> => {
  return new Promise((resolve) => {
    const loader = new THREE.TextureLoader();
    loader.load(url, (texture) => {
      resolve(texture);
    });
  });
};

export const MarketVerse: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const nodesRef = useRef<Map<string, TokenNode>>(new Map());
  const frameRef = useRef<number>(0);
  const textureLoaderRef = useRef<THREE.TextureLoader | null>(null);
  const loadingManagerRef = useRef<THREE.LoadingManager | null>(null);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current) return;

    // Initialize loading manager
    const loadingManager = new THREE.LoadingManager(
      // onLoad
      () => {
        setIsLoading(false);
      },
      // onProgress
      (_url, itemsLoaded, itemsTotal) => {
        console.log(`Loading texture: ${itemsLoaded}/${itemsTotal}`);
      },
      // onError
      (url) => {
        console.error("Error loading texture:", url);
      }
    );
    loadingManagerRef.current = loadingManager;

    // Initialize texture loader
    const textureLoader = new THREE.TextureLoader(loadingManager);
    textureLoaderRef.current = textureLoader;

    // Initialize Three.js scene
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add point lights
    const lights = [
      new THREE.PointLight(0x7f00ff, 1, 1000), // Purple
      new THREE.PointLight(0x00e1ff, 1, 1000), // Cyan
      new THREE.PointLight(0xff00ff, 1, 1000), // Magenta
    ];

    lights.forEach((light, i) => {
      light.position.set(Math.cos(i * 2.4) * 200, 100, Math.sin(i * 2.4) * 200);
      scene.add(light);
    });

    // Initialize camera
    const camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      10000
    );
    camera.position.z = 1000;
    cameraRef.current = camera;

    // Initialize renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Initialize controls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.maxDistance = 3000;
    controls.minDistance = 100;
    controlsRef.current = controls;

    // Initialize post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(window.innerWidth, window.innerHeight),
      1.5,
      0.4,
      0.85
    );
    composer.addPass(bloomPass);
    composerRef.current = composer;

    // Handle resize
    const handleResize = () => {
      if (!containerRef.current) return;
      const width = window.innerWidth;
      const height = window.innerHeight;

      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
      composer.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);

    // Cleanup
    return () => {
      window.removeEventListener("resize", handleResize);
      if (frameRef.current) cancelAnimationFrame(frameRef.current);
      if (containerRef.current && renderer.domElement) {
        containerRef.current.removeChild(renderer.domElement);
      }
      renderer.dispose();
    };
  }, []);

  // Animation loop
  useEffect(() => {
    const animate = () => {
      frameRef.current = requestAnimationFrame(animate);

      if (
        !sceneRef.current ||
        !cameraRef.current ||
        !composerRef.current ||
        !controlsRef.current
      )
        return;

      // Update controls
      controlsRef.current.update();

      // Update node animations
      nodesRef.current.forEach((node) => {
        if (!node.mesh) return;

        // Pulse effect based on energy
        const scale = 1 + Math.sin(Date.now() * 0.003) * 0.1 * node.energy;
        node.mesh.scale.setScalar(scale);

        // Update particle systems
        if (node.particles) {
          const positions = node.particles.geometry.attributes.position
            .array as Float32Array;
          for (let i = 0; i < positions.length; i += 3) {
            positions[i] += (Math.random() - 0.5) * node.energy;
            positions[i + 1] += (Math.random() - 0.5) * node.energy;
            positions[i + 2] += (Math.random() - 0.5) * node.energy;
          }
          node.particles.geometry.attributes.position.needsUpdate = true;
        }
      });

      // Render scene with post-processing
      composerRef.current.render();
    };

    animate();
  }, []);

  // Fetch and update market data
  useEffect(() => {
    const fetchMarketData = async () => {
      try {
        const response = await ddApi.fetch("/api/marketData/latest");
        const data = await response.json();

        if (!data.success || !data.data) {
          throw new Error("Failed to fetch market data");
        }

        updateVisualization(data.data);
        setIsLoading(false);
      } catch (err) {
        console.error("Error fetching market data:", err);
        setError(
          err instanceof Error ? err.message : "Failed to fetch market data"
        );
        setIsLoading(false);
      }
    };

    // Initial fetch
    fetchMarketData();

    // Set up polling interval
    const interval = setInterval(fetchMarketData, 30000);
    return () => clearInterval(interval);
  }, []);

  const updateVisualization = (marketData: MarketData[]) => {
    if (!sceneRef.current) return;

    marketData.forEach((token) => {
      const existingNode = nodesRef.current.get(token.symbol);

      if (existingNode) {
        // Update existing node
        updateNode(existingNode, token);
      } else {
        // Create new node
        createNode(token);
      }
    });
  };

  const createNode = (token: MarketData) => {
    if (!sceneRef.current || !textureLoaderRef.current) return;

    // Calculate node properties based on market data
    const size = Math.max(30, Math.min(100, Math.log10(token.marketCap) * 10));
    const energy = Math.max(0.2, Math.min(1, token.volume.h24 / 1000000));
    const buyRatio =
      token.transactions.h24.buys /
      (token.transactions.h24.buys + token.transactions.h24.sells);

    // Create sphere geometry with more segments for better quality
    const geometry = new THREE.SphereGeometry(size, 32, 32);

    // Create advanced material with physical properties
    const material = new THREE.MeshPhysicalMaterial({
      metalness: 0.8,
      roughness: 0.2,
      envMapIntensity: 0.9,
      clearcoat: 0.8,
      clearcoatRoughness: 0.2,
      color: new THREE.Color().setHSL(buyRatio, 0.8, 0.5),
      emissive: new THREE.Color().setHSL(buyRatio, 1, 0.3),
    });

    // Create mesh
    const mesh = new THREE.Mesh(geometry, material);

    // Random position within a sphere
    const phi = Math.random() * Math.PI * 2;
    const theta = Math.acos(Math.random() * 2 - 1);
    const radius = Math.random() * 800 + 200;
    mesh.position.setFromSphericalCoords(radius, theta, phi);

    // Create particle system
    const particleCount = Math.floor(token.volume.h24 / 10000);
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    const particleColors = new Float32Array(particleCount * 3);

    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      const radius = Math.random() * 50 + size * 1.2;
      const phi = Math.random() * Math.PI * 2;
      const theta = Math.acos(Math.random() * 2 - 1);

      particlePositions[i3] = radius * Math.sin(theta) * Math.cos(phi);
      particlePositions[i3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      particlePositions[i3 + 2] = radius * Math.cos(theta);

      particleSizes[i] = Math.random() * 2 + 1;

      const color = new THREE.Color().setHSL(buyRatio, 0.8, 0.5);
      particleColors[i3] = color.r;
      particleColors[i3 + 1] = color.g;
      particleColors[i3 + 2] = color.b;
    }

    particleGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(particlePositions, 3)
    );
    particleGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(particleSizes, 1)
    );
    particleGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(particleColors, 3)
    );

    const particleMaterial = new THREE.PointsMaterial({
      size: 2,
      vertexColors: true,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.6,
      sizeAttenuation: true,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    particles.position.copy(mesh.position);

    // Add to scene
    sceneRef.current.add(mesh);
    sceneRef.current.add(particles);

    // Load and apply texture if available
    if (token.imageUrl) {
      textureLoaderRef.current.load(
        token.imageUrl,
        (texture) => {
          material.map = texture;
          material.needsUpdate = true;
        },
        undefined,
        (error) => console.error("Error loading texture:", error)
      );
    }

    // Store node data
    nodesRef.current.set(token.symbol, {
      id: token.symbol,
      symbol: token.symbol,
      position: mesh.position,
      mesh,
      particles,
      energy,
      marketCap: token.marketCap,
      volume: token.volume.h24,
      buyRatio,
      lastUpdate: Date.now(),
      imageUrl: token.imageUrl,
    });
  };

  const updateNode = (node: TokenNode, token: MarketData) => {
    if (!node.mesh) return;

    const energy = Math.max(0.2, Math.min(1, token.volume.h24 / 1000000));
    const buyRatio =
      token.transactions.h24.buys /
      (token.transactions.h24.buys + token.transactions.h24.sells);

    // Update material colors based on buy/sell ratio
    const material = node.mesh.material as THREE.MeshPhysicalMaterial;
    material.color.setHSL(buyRatio, 0.8, 0.5);
    material.emissive.setHSL(buyRatio, 1, 0.3);
    material.needsUpdate = true;

    // Update particle colors
    if (node.particles) {
      const colors = node.particles.geometry.attributes.color
        .array as Float32Array;
      const color = new THREE.Color().setHSL(buyRatio, 0.8, 0.5);
      for (let i = 0; i < colors.length; i += 3) {
        colors[i] = color.r;
        colors[i + 1] = color.g;
        colors[i + 2] = color.b;
      }
      node.particles.geometry.attributes.color.needsUpdate = true;
    }

    // Update node properties
    node.energy = energy;
    node.marketCap = token.marketCap;
    node.volume = token.volume.h24;
    node.buyRatio = buyRatio;
    node.lastUpdate = Date.now();
  };

  if (error) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-red-500 bg-red-500/10 px-4 py-2 rounded-lg">
          {error}
        </div>
      </div>
    );
  }

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-auto"
      style={{ zIndex: 0 }}
    >
      {isLoading && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
          <div className="text-brand-400 animate-pulse">
            Loading Market Visualization...
          </div>
        </div>
      )}
    </div>
  );
};
