import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass";
import { ddApi } from "../../services/dd-api";

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
  const containerRef = useRef<HTMLDivElement>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const composerRef = useRef<EffectComposer | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const controlsRef = useRef<OrbitControls | null>(null);
  const nodesRef = useRef<TokenNode[]>([]);
  const [isInitialized, setIsInitialized] = useState(false);

  // Initialize Three.js scene
  useEffect(() => {
    if (!containerRef.current || isInitialized) return;

    const container = containerRef.current;
    const width = container.clientWidth;
    const height = container.clientHeight;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 1000);
    camera.position.z = 30;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setSize(width, height);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Post-processing
    const composer = new EffectComposer(renderer);
    const renderPass = new RenderPass(scene, camera);
    composer.addPass(renderPass);

    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(width, height),
      1.5, // Bloom strength
      0.4, // Radius
      0.85 // Threshold
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

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    scene.add(ambientLight);

    // Add point lights
    const lights = [
      { color: 0x0088ff, position: [50, 50, 50] as [number, number, number] },
      {
        color: 0xff8800,
        position: [-50, -50, -50] as [number, number, number],
      },
      { color: 0x00ff88, position: [-50, 50, -50] as [number, number, number] },
    ];

    lights.forEach(({ color, position }) => {
      const light = new THREE.PointLight(color, 1, 100);
      light.position.set(position[0], position[1], position[2]);
      scene.add(light);
    });

    // Background particles
    const particleGeometry = new THREE.BufferGeometry();
    const particleCount = 1000;
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
      opacity: 0.6,
      blending: THREE.AdditiveBlending,
    });

    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);

    // Animation loop
    const animate = () => {
      requestAnimationFrame(animate);

      // Update particle positions
      const positions = particles.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.01;
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

      controls.update();
      composer.render();
    };

    animate();
    setIsInitialized(true);

    // Cleanup
    return () => {
      if (renderer) {
        container.removeChild(renderer.domElement);
        renderer.dispose();
      }
    };
  }, [isInitialized]);

  // Handle resize
  useEffect(() => {
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
  }, []);

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

  return (
    <div ref={containerRef} className="absolute inset-0 bg-transparent">
      {/* Optional UI overlays can go here */}
    </div>
  );
};
