import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ddApi } from "../../services/dd-api";
import { useStore } from "../../store/useStore";

interface TokenNode {
  id: number;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  mesh?: THREE.Mesh;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  connections: TokenNode[];
}

export const TokenVerse: React.FC = () => {
  const { uiDebug } = useStore();
  const {
    enabled,
    intensity,
    starIntensity,
    bloomStrength,
    particleCount,
    updateFrequency,
  } = uiDebug.backgrounds.tokenVerse;

  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesRef = useRef<TokenNode[]>([]);
  const animationFrameRef = useRef<number>();
  const [isInitialized, setIsInitialized] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("[TokenVerse] Cleaning up resources");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    if (rendererRef.current && containerRef.current) {
      containerRef.current.removeChild(rendererRef.current.domElement);
      rendererRef.current.dispose();
    }

    if (sceneRef.current) {
      sceneRef.current.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          object.geometry.dispose();
          if (object.material instanceof THREE.Material) {
            object.material.dispose();
          }
        }
      });
    }

    if (composerRef.current) {
      composerRef.current.passes.forEach((pass) => {
        if (pass instanceof UnrealBloomPass) {
          pass.dispose();
        }
      });
    }

    // Reset refs
    rendererRef.current = null;
    composerRef.current = null;
    sceneRef.current = null;
    cameraRef.current = null;
    controlsRef.current = null;
    nodesRef.current = [];
    setIsInitialized(false);
  }, []);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized || !enabled) return;

    console.log("[TokenVerse] Initializing scene...");
    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    try {
      // Scene setup with fog for depth
      const scene = new THREE.Scene();
      scene.fog = new THREE.FogExp2(0x000000, 0.001);
      sceneRef.current = scene;

      // Camera setup with wider view
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
      camera.position.z = 50;
      camera.position.y = 20;
      camera.lookAt(0, 0, 0);
      cameraRef.current = camera;

      // Renderer setup with transparency
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        premultipliedAlpha: false,
        logarithmicDepthBuffer: true,
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.setClearColor(0x000000, 0);
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1;
      container.appendChild(renderer.domElement);
      rendererRef.current = renderer;

      // Post-processing with adjusted bloom
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(width, height),
        bloomStrength,
        0.75,
        0.9
      );
      composer.addPass(bloomPass);
      composerRef.current = composer;

      // Controls
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.05;
      controls.rotateSpeed = 0.5;
      controls.zoomSpeed = 0.5;
      controlsRef.current = controls;

      // Add more ambient light
      const ambientLight = new THREE.AmbientLight(0x404040, 3);
      scene.add(ambientLight);

      // Add stronger point lights
      const lights = [
        { color: 0x0088ff, position: [50, 50, 50] as [number, number, number] },
        {
          color: 0xff8800,
          position: [-50, -50, -50] as [number, number, number],
        },
        {
          color: 0x00ff88,
          position: [-50, 50, -50] as [number, number, number],
        },
      ];

      lights.forEach(({ color, position }) => {
        const light = new THREE.PointLight(color, intensity / 25, 300);
        light.position.set(position[0], position[1], position[2]);
        scene.add(light);
      });

      // Background particles
      const particleGeometry = new THREE.BufferGeometry();
      const positions = new Float32Array(particleCount * 3);

      for (let i = 0; i < particleCount * 3; i += 3) {
        positions[i] = (Math.random() - 0.5) * 100;
        positions[i + 1] = (Math.random() - 0.5) * 100;
        positions[i + 2] = (Math.random() - 0.5) * 100;
      }

      particleGeometry.setAttribute(
        "position",
        new THREE.BufferAttribute(positions, 3)
      );

      const particleMaterial = new THREE.PointsMaterial({
        size: 0.1,
        color: 0x88ccff,
        transparent: true,
        opacity: starIntensity / 100,
        blending: THREE.AdditiveBlending,
      });

      const particles = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particles);

      // Animation loop
      const animate = () => {
        if (
          !sceneRef.current ||
          !cameraRef.current ||
          !rendererRef.current ||
          !composerRef.current
        )
          return;

        animationFrameRef.current = requestAnimationFrame(animate);

        if (controlsRef.current) {
          controlsRef.current.update();
        }

        // Update particle positions with updateFrequency
        const positions = particles.geometry.attributes.position
          .array as Float32Array;
        for (let i = 0; i < positions.length; i += 3) {
          positions[i + 1] += 0.01 * (updateFrequency / 100);
          if (positions[i + 1] > 50) positions[i + 1] = -50;
        }
        particles.geometry.attributes.position.needsUpdate = true;

        // Update token nodes
        nodesRef.current.forEach((node) => {
          if (!node.mesh) return;

          // Apply forces
          node.connections.forEach((connectedNode) => {
            if (!connectedNode.mesh) return;
            const distance = node.position.distanceTo(connectedNode.position);
            const force = new THREE.Vector3()
              .subVectors(connectedNode.position, node.position)
              .normalize()
              .multiplyScalar(0.001 * distance);
            node.velocity.add(force);
          });

          // Apply center gravity
          const centerForce = new THREE.Vector3()
            .sub(node.position)
            .normalize()
            .multiplyScalar(0.01);
          node.velocity.add(centerForce);

          // Update position
          node.velocity.multiplyScalar(0.95); // Damping
          node.position.add(node.velocity);
          node.mesh.position.copy(node.position);

          // Rotate based on price change
          node.mesh.rotation.x += 0.01 * Math.sign(node.change24h);
          node.mesh.rotation.y += 0.01 * Math.sign(node.change24h);
        });

        composerRef.current.render();
      };

      animate();
      console.log("[TokenVerse] Scene initialized successfully");
      setIsInitialized(true);
    } catch (error) {
      console.error("[TokenVerse] Initialization error:", error);
      cleanup();
    }

    return cleanup;
  }, [
    enabled,
    cleanup,
    intensity,
    bloomStrength,
    updateFrequency,
    starIntensity,
  ]);

  // Handle resize
  useEffect(() => {
    if (!enabled || !isInitialized) return;

    const handleResize = () => {
      if (
        !containerRef.current ||
        !rendererRef.current ||
        !cameraRef.current ||
        !composerRef.current
      )
        return;

      const width = containerRef.current.clientWidth;
      const height = containerRef.current.clientHeight;

      cameraRef.current.aspect = width / height;
      cameraRef.current.updateProjectionMatrix();

      rendererRef.current.setSize(width, height);
      composerRef.current.setSize(width, height);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [enabled, isInitialized]);

  // Fetch and update token data
  useEffect(() => {
    const fetchTokenData = async () => {
      try {
        const response = await ddApi.fetch("/api/tokens");
        if (!response.ok) throw new Error("Failed to fetch token data");

        const data = await response.json();
        const tokens = Array.isArray(data) ? data : data.data;

        // Process token data
        const nodes: TokenNode[] = tokens.map((token: any) => ({
          id: token.id,
          symbol: token.symbol,
          name: token.name,
          price: parseFloat(token.token_prices?.price || "0"),
          marketCap: parseFloat(token.market_cap || "0"),
          volume24h: parseFloat(token.volume_24h || "0"),
          change24h: parseFloat(token.change_24h || "0"),
          position: new THREE.Vector3(
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50,
            (Math.random() - 0.5) * 50
          ),
          velocity: new THREE.Vector3(),
          connections: [],
        }));

        // Create connections based on correlations
        nodes.forEach((node) => {
          const connectionCount = Math.floor(Math.random() * 3) + 1;
          const otherNodes = nodes.filter((n) => n.id !== node.id);
          node.connections = otherNodes
            .sort(() => Math.random() - 0.5)
            .slice(0, connectionCount);
        });

        // Create or update meshes
        if (sceneRef.current) {
          // Remove old meshes
          nodesRef.current.forEach((node) => {
            if (node.mesh) sceneRef.current?.remove(node.mesh);
          });

          // Create new meshes
          nodes.forEach((node) => {
            const size = Math.max(
              0.2,
              Math.min(2, Math.log10(node.marketCap) * 0.2)
            );
            const geometry = new THREE.IcosahedronGeometry(size, 1);
            const material = new THREE.MeshPhongMaterial({
              color: node.change24h >= 0 ? 0x00ff88 : 0xff4444,
              emissive: node.change24h >= 0 ? 0x00aa44 : 0xaa2222,
              shininess: 100,
              transparent: true,
              opacity: 0.9,
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(node.position);
            sceneRef.current?.add(mesh);
            node.mesh = mesh;
          });

          nodesRef.current = nodes;
        }
      } catch (error) {
        console.error("Failed to update token data:", error);
      }
    };

    fetchTokenData();
    const interval = setInterval(fetchTokenData, 30000);
    return () => clearInterval(interval);
  }, []);

  if (!enabled) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      className="absolute inset-0"
      style={{
        background: "transparent",
        pointerEvents: "none",
      }}
    />
  );
};
