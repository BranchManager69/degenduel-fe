import React, { useCallback, useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/examples/jsm/controls/OrbitControls.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { BokehPass } from "three/examples/jsm/postprocessing/BokehPass.js";
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
  highlightBeam?: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  connections: TokenNode[];
  isHovered?: boolean;
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
  const raycasterRef = useRef<THREE.Raycaster>(new THREE.Raycaster());
  const mouseRef = useRef<THREE.Vector2>(new THREE.Vector2(-1000, -1000));
  const targetCameraPositionRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 50));
  const [isInitialized, setIsInitialized] = useState(false);

  // Cleanup function
  const cleanup = useCallback(() => {
    console.log("[TokenVerse] Cleaning up resources");
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
    }

    // Remove event listeners
    if (rendererRef.current?.domElement) {
      const canvas = rendererRef.current.domElement;
      canvas.removeEventListener("mousemove", () => {});
      canvas.removeEventListener("webglcontextlost", () => {});
      canvas.removeEventListener("webglcontextrestored", () => {});
    }
    
    // Remove scroll listener
    window.removeEventListener("scroll", () => {});

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
        if (pass instanceof UnrealBloomPass || pass instanceof BokehPass) {
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

    console.log("[TokenVerse] Initializing");
    setIsInitialized(true);

    try {
      // Scene setup with fog for depth
      const scene = new THREE.Scene();
      sceneRef.current = scene;
      scene.fog = new THREE.FogExp2(0x000000, 0.01);

      // Camera setup
      const camera = new THREE.PerspectiveCamera(
        75,
        window.innerWidth / window.innerHeight,
        0.1,
        1000
      );
      cameraRef.current = camera;
      camera.position.z = 50;
      
      // Store initial camera position
      targetCameraPositionRef.current.copy(camera.position);

      // Renderer setup with context loss handling
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        powerPreference: "high-performance",
      });
      rendererRef.current = renderer;
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      containerRef.current.appendChild(renderer.domElement);

      // Add context loss handling
      const canvas = renderer.domElement;
      canvas.addEventListener(
        "webglcontextlost",
        (event) => {
          event.preventDefault();
          console.warn("[TokenVerse] WebGL context lost");
          cleanup();
        },
        false
      );

      canvas.addEventListener(
        "webglcontextrestored",
        () => {
          console.log("[TokenVerse] WebGL context restored");
          cleanup();
          setIsInitialized(false); // This will trigger a re-initialization
        },
        false
      );

      // Mouse move handler for raycasting and camera focus
      canvas.addEventListener("mousemove", (event) => {
        // Calculate mouse position in normalized device coordinates (-1 to +1)
        const rect = canvas.getBoundingClientRect();
        mouseRef.current.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouseRef.current.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      });
      
      // Scroll handler for camera motion
      window.addEventListener("scroll", () => {
        if (cameraRef.current) {
          // Calculate how far down the page we've scrolled (0 to 1)
          const scrollY = window.scrollY;
          const maxScroll = document.body.scrollHeight - window.innerHeight;
          const scrollFraction = Math.min(1, Math.max(0, scrollY / maxScroll));
          
          // Adjust camera position based on scroll
          const scrollPosition = new THREE.Vector3(
            0,
            -20 * scrollFraction, // Move camera down as we scroll
            50 + (20 * scrollFraction) // Move camera away as we scroll
          );
          
          // Blend with current target (for hover effects)
          targetCameraPositionRef.current.lerp(scrollPosition, 0.5);
        }
      });

      // Post-processing with adjusted bloom and depth of field
      const composer = new EffectComposer(renderer);
      const renderPass = new RenderPass(scene, camera);
      composer.addPass(renderPass);

      const bloomPass = new UnrealBloomPass(
        new THREE.Vector2(window.innerWidth, window.innerHeight),
        bloomStrength,
        0.75,
        0.9
      );
      composer.addPass(bloomPass);
      
      // Add depth-of-field effect using BokehPass
      const bokehPass = new BokehPass(scene, camera, {
        focus: 50,
        aperture: 0.0025,
        maxblur: 0.01
      });
      composer.addPass(bokehPass);
      
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

        // Perform raycasting to detect hover
        if (nodesRef.current.length > 0) {
          raycasterRef.current.setFromCamera(mouseRef.current, cameraRef.current);
          const meshes = nodesRef.current
            .filter(node => node.mesh)
            .map(node => node.mesh!);
          
          const intersects = raycasterRef.current.intersectObjects(meshes);
          
          // Reset all hover states
          nodesRef.current.forEach(node => {
            if (node.isHovered && node.mesh) {
              node.isHovered = false;
              // Remove highlight beam if it exists
              if (node.highlightBeam && sceneRef.current) {
                sceneRef.current.remove(node.highlightBeam);
                node.highlightBeam = undefined;
              }
              
              // Restore original scale
              node.mesh.scale.set(1, 1, 1);
            }
          });
          
          // Handle new intersections
          if (intersects.length > 0) {
            const hoveredNode = nodesRef.current.find(
              node => node.mesh === intersects[0].object
            );
            
            if (hoveredNode) {
              hoveredNode.isHovered = true;
              
              // Make hovered token slightly larger
              if (hoveredNode.mesh) {
                hoveredNode.mesh.scale.set(1.3, 1.3, 1.3);
              }
              
              // Create neon light beam for highlighted token
              if (!hoveredNode.highlightBeam && sceneRef.current) {
                // Create cylinder that points upward from the token
                const beamGeometry = new THREE.CylinderGeometry(0.2, 2, 40, 16, 1, true);
                const beamMaterial = new THREE.MeshBasicMaterial({
                  color: hoveredNode.change24h >= 0 ? 0x00ff88 : 0xff4444,
                  transparent: true,
                  opacity: 0.3,
                  side: THREE.DoubleSide
                });
                
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                beam.position.copy(hoveredNode.position);
                beam.position.y += 20; // Position the beam above the token
                beam.rotation.x = Math.PI / 2; // Rotate to point upward
                
                sceneRef.current.add(beam);
                hoveredNode.highlightBeam = beam;
                
                // Update camera target to focus on hovered node
                const targetPosition = new THREE.Vector3().copy(hoveredNode.position);
                targetPosition.z += 30; // Keep some distance
                targetCameraPositionRef.current.copy(targetPosition);
              }
            }
          } else {
            // If no hover, gradually return to original position
            targetCameraPositionRef.current.lerp(new THREE.Vector3(0, 0, 50), 0.05);
          }
          
          // Smoothly move camera toward target position
          if (cameraRef.current) {
            cameraRef.current.position.lerp(targetCameraPositionRef.current, 0.02);
          }
        }

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
          
          // Update highlight beam position if it exists
          if (node.highlightBeam) {
            node.highlightBeam.position.copy(node.position);
            node.highlightBeam.position.y += 20;
            
            // Add subtle animation to the beam
            node.highlightBeam.rotation.z += 0.01;
          }

          // Rotate based on price change
          node.mesh.rotation.x += 0.01 * Math.sign(node.change24h);
          node.mesh.rotation.y += 0.01 * Math.sign(node.change24h);
        });

        composerRef.current.render();
      };

      animate();
      console.log("[TokenVerse] Scene initialized successfully");
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

          // Create new meshes with varied geometry for better depth-of-field visualization
          nodes.forEach((node) => {
            const size = Math.max(
              0.2,
              Math.min(2, Math.log10(node.marketCap) * 0.2)
            );
            
            // Use different geometries based on market cap for visual variety
            let geometry;
            if (node.marketCap > 1000000000) {
              // Large market cap - complex geometry
              geometry = new THREE.IcosahedronGeometry(size, 2);
            } else if (node.marketCap > 100000000) {
              // Medium market cap - dodecahedron
              geometry = new THREE.DodecahedronGeometry(size, 1);
            } else if (node.marketCap > 10000000) {
              // Small market cap - octahedron
              geometry = new THREE.OctahedronGeometry(size, 1);
            } else {
              // Tiny market cap - tetrahedron
              geometry = new THREE.TetrahedronGeometry(size, 0);
            }
            
            // Create more interesting materials with emissive glow
            const positiveChange = node.change24h >= 0;
            const changeIntensity = Math.min(1, Math.abs(node.change24h) / 10);
            
            const material = new THREE.MeshPhongMaterial({
              color: positiveChange ? 0x00ff88 : 0xff4444,
              emissive: positiveChange ? 0x00aa44 : 0xaa2222,
              emissiveIntensity: 0.5 + changeIntensity,
              shininess: 100,
              transparent: true,
              opacity: 0.9,
              specular: 0xffffff
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.copy(node.position);
            
            // Add slight random rotation for more visual interest
            mesh.rotation.x = Math.random() * Math.PI;
            mesh.rotation.y = Math.random() * Math.PI;
            mesh.rotation.z = Math.random() * Math.PI;
            
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
