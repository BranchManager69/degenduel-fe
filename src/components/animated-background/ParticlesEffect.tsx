// src/components/animated-background/ParticlesEffect.tsx

/**
 * This component is a modified version of the ParticlesEffect component from the
 * react-three/drei library. It is used to create an animated background for the
 * app. The component creates a 3D scene with particles that represent the crypto
 * market playing dodgeball. The particles are animated to move and change color
 * based on the market data. The component also includes a market pulse effect that
 * simulates the pulse of the market. Enjoy!
 * 
 * Optimized version with performance improvements for mobile and lower-end devices.
 */

import React, { useEffect, useRef, useState } from "react";
import * as THREE from "three";
import { useStore } from "../../store/useStore";

// Graphics quality and performance settings
const GRAPHICS_QUALITY = "min"; // options: 'max', 'mid', 'min'
const OPACITY_MAGNITUDE = 0.7; // opacity reduction factor (0.4-0.7 recommended)
const MOBILE_OPTIMIZED = true; // special handling for mobile browsers

// Define the type for graphics quality
type GraphicsQualityType = "high-performance" | "default" | "low-power";
type QualitySettingType = "max" | "mid" | "min";

// Epic visualization showcasing crypto market as a dodgeball battle
export const ParticlesEffect: React.FC = () => {
  const { maintenanceMode, user } = useStore();
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const mountedRef = useRef<boolean>(true);
  const [isMounted, setIsMounted] = useState(false);
  const [hasWebGLError, setHasWebGLError] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const requestRef = useRef<number>();
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);

  // No animation if maintenance mode is on and user is not an administrator
  if (maintenanceMode && !(user?.is_admin || user?.is_superadmin)) {
    return null;
  }

  // Map our quality setting to WebGL powerPreference values
  const qualityMap: Record<QualitySettingType, GraphicsQualityType> = {
    max: "high-performance",
    mid: "default",
    min: "low-power",
  };

  const graphicsQuality: GraphicsQualityType =
    qualityMap[GRAPHICS_QUALITY as QualitySettingType] || "default";

  // Create an epic dodgeball battle scene
  useEffect(() => {
    // Check if WebGL is supported
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      if (!gl) {
        console.error("WebGL not supported - disabling particle effects");
        setHasWebGLError(true);
        return;
      }
    } catch (error) {
      console.error("Error checking WebGL support:", error);
      setHasWebGLError(true);
      return;
    }

    // Set mounted ref to true
    mountedRef.current = true;

    // Helper functions for distance calculations - optimization to avoid expensive sqrt operations
    // Use squared distance when possible for faster comparisons
    function distanceSquared(
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number
    ): number {
      return (x2 - x1) * (x2 - x1) + (y2 - y1) * (y2 - y1) + (z2 - z1) * (z2 - z1);
    }
    
    // Only use actual distance when necessary (for documentation purposes)
    // This function is kept for future use but currently all distance checks use the squared version
    /* function distanceBetween(
      x1: number,
      y1: number,
      z1: number,
      x2: number,
      y2: number,
      z2: number
    ): number {
      return Math.sqrt(distanceSquared(x1, y1, z1, x2, y2, z2));
    } */

    // Utility function to create particle textures
    function createParticleTexture(color: string): THREE.Texture {
      const canvas = document.createElement("canvas");
      canvas.width = 128; // Larger canvas for smoother gradient
      canvas.height = 128;
      const context = canvas.getContext("2d");

      if (context) {
        // Create a more diffuse, blurred radial gradient
        const gradient = context.createRadialGradient(64, 64, 0, 64, 64, 64);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.2, color);
        gradient.addColorStop(
          0.5,
          color.replace(")", ", 0.25)").replace("rgb", "rgba")
        ); // More fade
        gradient.addColorStop(
          0.8,
          color.replace(")", ", 0.05)").replace("rgb", "rgba")
        ); // Extended glow
        gradient.addColorStop(1, "rgba(0, 0, 0, 0)");

        // Add blur by drawing multiple overlapping gradients
        context.fillStyle = gradient;
        context.fillRect(0, 0, 128, 128);

        // Apply a slight blur effect
        try {
          context.filter = "blur(4px)";
          context.fillStyle = gradient;
          context.fillRect(0, 0, 128, 128);
          context.filter = "none";
        } catch (e) {
          // Fallback for browsers without filter support
        }
      }

      const texture = new THREE.CanvasTexture(canvas);
      texture.needsUpdate = true;
      return texture;
    }

    // Create scene, camera, and renderer
    const scene = new THREE.Scene();
    sceneRef.current = scene;
    
    const camera = new THREE.PerspectiveCamera(
      60,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    cameraRef.current = camera;

    // Try to create the renderer with error handling
    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({
        alpha: true,
        antialias: true, // Smoother edges
        powerPreference: graphicsQuality, // Graphics quality setting
      });
      rendererRef.current = renderer;

      // Check if the renderer was created successfully
      if (!renderer || !renderer.domElement) {
        throw new Error("Failed to create WebGL renderer");
      }

      // Setup renderer with high quality settings
      renderer.setSize(window.innerWidth, window.innerHeight);
      renderer.setClearColor(0x000000, 0);
      renderer.setPixelRatio(window.devicePixelRatio); // Sharper rendering

      // Use the componentRef instead of searching by ID
      if (containerRef.current) {
        containerRef.current.appendChild(renderer.domElement);
      } else {
        throw new Error("Container element not found");
      }
    } catch (err) {
      console.error("Failed to create WebGL renderer:", err);
      setHasWebGLError(true);
      return;
    }

    // ==== DODGEBALL PARTICLE SYSTEM CREATION ====
    // Create multiple particle systems for the epic dodgeball battle
    let particleCount = {
      red: 600, // Red team players
      green: 600, // Green team players
      blueBalls: 150, // Dodgeballs (initially in the center)
    };

    // Adjust count based on performance settings and device
    const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    if (graphicsQuality === "high-performance" && !isMobile) {
      particleCount = {
        red: 600,
        green: 600,
        blueBalls: 150,
      };
    } else if (graphicsQuality === "low-power" || (isMobile && MOBILE_OPTIMIZED)) {
      particleCount = {
        red: 80,
        green: 80,
        blueBalls: 20,
      };
    } else {
      particleCount = {
        red: 300,
        green: 300,
        blueBalls: 80,
      };
    }

    // Game state tracking
    type PlayerStatus = "active" | "eliminated" | "carrying";
    type BallOwner = -1 | 0 | 1; // -1 = no owner, 0 = red team, 1 = green team
    type GamePhase = "ready" | "rush" | "battle" | "endgame";

    const gameState = {
      phase: "ready" as GamePhase,
      phaseStartTime: 0,
      redTeamActive: particleCount.red, // Number of active players
      greenTeamActive: particleCount.green,
      redTeamBalls: 0, // Number of dodgeballs held by team
      greenTeamBalls: 0,
      ballOwnership: new Array(particleCount.blueBalls).fill(-1) as BallOwner[],
      playerStatus: {
        red: new Array(particleCount.red).fill("active") as PlayerStatus[],
        green: new Array(particleCount.green).fill("active") as PlayerStatus[],
      },
      lastHitTime: 0, // To control hit frequency
      rushComplete: false,
    };

    // Create particle textures with more vibrant colors for the teams
    const redGlow = createParticleTexture("#ff3333"); // Bright red for Team Red
    const greenGlow = createParticleTexture("#33ff33"); // Bright green for Team Green
    const blueGlow = createParticleTexture("#4488ff"); // Blue for dodgeballs

    // 1. RED TEAM PLAYERS
    const redGeometry = new THREE.BufferGeometry();
    const redPositions = new Float32Array(particleCount.red * 3);
    const redSizes = new Float32Array(particleCount.red);
    const redVelocities = new Float32Array(particleCount.red * 3);
    const redEnergies = new Float32Array(particleCount.red);

    for (let i = 0; i < particleCount.red; i++) {
      // Position in formation at the left side of the arena, ready to rush
      const rowSize = Math.ceil(Math.sqrt(particleCount.red));
      const row = Math.floor(i / rowSize);
      const col = i % rowSize;

      // Create a grid formation on the left side
      const xSpread = 8; // Width of formation
      const zSpread = 8; // Depth of formation
      const x = -20 + (col / rowSize) * xSpread - xSpread / 2; // Left side starting position
      const z = -zSpread / 2 + (row / rowSize) * zSpread;
      const y = 0; // All players on the ground plane

      redPositions[i * 3] = x;
      redPositions[i * 3 + 1] = y;
      redPositions[i * 3 + 2] = z;

      // Players are uniform size initially
      redSizes[i] = 0.5;

      // Initial velocities zero - they'll start moving on whistle
      redVelocities[i * 3] = 0;
      redVelocities[i * 3 + 1] = 0;
      redVelocities[i * 3 + 2] = 0;

      // Energy/speed level varies by player
      redEnergies[i] = 0.7 + Math.random() * 0.3; // 0.7-1.0 range for energy
    }

    redGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(redPositions, 3)
    );
    redGeometry.setAttribute("size", new THREE.BufferAttribute(redSizes, 1));

    const redMaterial = new THREE.PointsMaterial({
      size: 0.8, // Larger for more dramatic blur effect
      map: redGlow,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: false,
      sizeAttenuation: true,
      opacity: OPACITY_MAGNITUDE * 0.3, // Further reduced opacity for more subtlety
    });

    redMaterial.color.set(0xff2200); // Intense red color
    const redParticles = new THREE.Points(redGeometry, redMaterial);
    redParticles.name = "redParticles";
    scene.add(redParticles);

    // 2. GREEN TEAM PLAYERS
    const greenGeometry = new THREE.BufferGeometry();
    const greenPositions = new Float32Array(particleCount.green * 3);
    const greenSizes = new Float32Array(particleCount.green);
    const greenVelocities = new Float32Array(particleCount.green * 3);
    const greenEnergies = new Float32Array(particleCount.green);

    for (let i = 0; i < particleCount.green; i++) {
      // Position in formation at the right side of the arena, ready to rush
      const rowSize = Math.ceil(Math.sqrt(particleCount.green));
      const row = Math.floor(i / rowSize);
      const col = i % rowSize;

      // Create a grid formation on the right side
      const xSpread = 8; // Width of formation
      const zSpread = 8; // Depth of formation
      const x = 20 - (col / rowSize) * xSpread + xSpread / 2; // Right side starting position
      const z = -zSpread / 2 + (row / rowSize) * zSpread;
      const y = 0; // All players on the ground plane

      greenPositions[i * 3] = x;
      greenPositions[i * 3 + 1] = y;
      greenPositions[i * 3 + 2] = z;

      // Players are uniform size initially
      greenSizes[i] = 0.5;

      // Initial velocities zero - they'll start moving on whistle
      greenVelocities[i * 3] = 0;
      greenVelocities[i * 3 + 1] = 0;
      greenVelocities[i * 3 + 2] = 0;

      // Energy/speed level varies by player
      greenEnergies[i] = 0.7 + Math.random() * 0.3; // 0.7-1.0 range for energy
    }

    greenGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(greenPositions, 3)
    );
    greenGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(greenSizes, 1)
    );

    const greenMaterial = new THREE.PointsMaterial({
      size: 0.8, // Larger for more dramatic blur effect
      map: greenGlow,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: false,
      sizeAttenuation: true,
      opacity: OPACITY_MAGNITUDE * 0.3, // Further reduced opacity for more subtlety
    });

    greenMaterial.color.set(0x00ff44); // Intense green color
    const greenParticles = new THREE.Points(greenGeometry, greenMaterial);
    greenParticles.name = "greenParticles";
    scene.add(greenParticles);

    // 3. BLUE DODGEBALLS (at center court)
    const blueBallsGeometry = new THREE.BufferGeometry();
    const blueBallsPositions = new Float32Array(particleCount.blueBalls * 3);
    const blueBallsSizes = new Float32Array(particleCount.blueBalls);
    const blueBallsVelocities = new Float32Array(particleCount.blueBalls * 3);

    for (let i = 0; i < particleCount.blueBalls; i++) {
      // Position dodgeballs in a line at center court
      const lineWidth = 10; // Width of the center line of balls
      const segments = Math.ceil(Math.sqrt(particleCount.blueBalls));
      // const row = Math.floor(i / segments); // Not used in this 1D layout
      const col = i % segments;

      // Create a line of balls down the center court
      const x = 0; // Center court
      const z = -lineWidth / 2 + (col / segments) * lineWidth;
      const y = 0; // All balls on the ground

      // Add slight random offset for more natural look
      const jitter = 0.5;
      const randomOffset = Math.random() - 0.5; // Calculate once and reuse
      const xJitter = randomOffset * jitter;
      const zJitter = randomOffset * jitter;

      blueBallsPositions[i * 3] = x + xJitter;
      blueBallsPositions[i * 3 + 1] = y;
      blueBallsPositions[i * 3 + 2] = z + zJitter;

      // Uniform size for dodgeballs
      blueBallsSizes[i] = 0.6;

      // No initial velocity
      blueBallsVelocities[i * 3] = 0;
      blueBallsVelocities[i * 3 + 1] = 0;
      blueBallsVelocities[i * 3 + 2] = 0;

      // No owner initially (handled in gameState)
    }

    blueBallsGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(blueBallsPositions, 3)
    );
    blueBallsGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(blueBallsSizes, 1)
    );

    const blueBallsMaterial = new THREE.PointsMaterial({
      size: 0.8,
      map: blueGlow,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
      vertexColors: false,
      sizeAttenuation: true,
      opacity: OPACITY_MAGNITUDE * 0.5, // More visible for the dodgeballs
    });

    blueBallsMaterial.color.set(0x4488ff); // Bright blue for dodgeballs
    const blueBallsParticles = new THREE.Points(
      blueBallsGeometry,
      blueBallsMaterial
    );
    blueBallsParticles.name = "blueBallsParticles";
    scene.add(blueBallsParticles);

    // === DODGEBALL COURT AND VISUAL EFFECTS ===
    // Center court with dividing line
    const courtGeometry = new THREE.PlaneGeometry(50, 30); // Dodgeball court
    const courtMaterial = new THREE.MeshBasicMaterial({
      color: 0x222266, // Dark blue court
      transparent: true,
      opacity: OPACITY_MAGNITUDE * 0.1,
      side: THREE.DoubleSide,
    });

    // Add center dividing line
    const centerLineGeometry = new THREE.PlaneGeometry(0.5, 30);
    const centerLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff, // White line
      transparent: true,
      opacity: OPACITY_MAGNITUDE * 0.2,
      side: THREE.DoubleSide,
    });
    const court = new THREE.Mesh(courtGeometry, courtMaterial);
    court.rotation.x = Math.PI / 2;
    court.position.y = -0.5; // Just below players
    scene.add(court);

    const centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    centerLine.rotation.x = Math.PI / 2;
    centerLine.position.y = -0.4; // Slightly above court
    scene.add(centerLine);

    // Add team colored lighting for dramatic effect
    const redLight = new THREE.PointLight(0xff3333, 0.4, 30); // Red team light
    redLight.position.set(-15, 5, 0);
    scene.add(redLight);

    const greenLight = new THREE.PointLight(0x33ff33, 0.4, 30); // Green team light
    greenLight.position.set(15, 5, 0);
    scene.add(greenLight);

    // Add spotlight in center for dodgeballs
    const centerLight = new THREE.PointLight(0x4488ff, 0.3, 15); // Blue light for center
    centerLight.position.set(0, 5, 0);
    scene.add(centerLight);

    // Add collision effects system
    const collisionGeometry = new THREE.BufferGeometry();
    const collisionPositions = new Float32Array(100 * 3); // Up to 100 simultaneous collisions
    const collisionSizes = new Float32Array(100);
    const collisionOpacities = new Float32Array(100);
    const collisionAge = new Float32Array(100);
    const collisionColors = new Float32Array(100 * 3);

    // Initialize invisible collision effects
    for (let i = 0; i < 100; i++) {
      collisionPositions[i * 3] = 0;
      collisionPositions[i * 3 + 1] = 0;
      collisionPositions[i * 3 + 2] = 0;
      collisionSizes[i] = 0;
      collisionOpacities[i] = 0;
      collisionAge[i] = 0;
      collisionColors[i * 3] = 1;
      collisionColors[i * 3 + 1] = 1;
      collisionColors[i * 3 + 2] = 1;
    }

    collisionGeometry.setAttribute(
      "position",
      new THREE.BufferAttribute(collisionPositions, 3)
    );
    collisionGeometry.setAttribute(
      "size",
      new THREE.BufferAttribute(collisionSizes, 1)
    );
    collisionGeometry.setAttribute(
      "opacity",
      new THREE.BufferAttribute(collisionOpacities, 1)
    );
    collisionGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(collisionColors, 3)
    );

    // Custom shader material for dynamic collision effects
    const collisionMaterial = new THREE.ShaderMaterial({
      uniforms: {
        pointTexture: { value: createParticleTexture("#ffffff") },
      },
      vertexShader: `
        attribute float size;
        attribute float opacity;
        attribute vec3 color;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          vOpacity = opacity;
          vColor = color;
          vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        uniform sampler2D pointTexture;
        varying float vOpacity;
        varying vec3 vColor;
        
        void main() {
          gl_FragColor = vec4(vColor, vOpacity) * texture2D(pointTexture, gl_PointCoord);
        }
      `,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      transparent: true,
    });

    const collisionParticles = new THREE.Points(
      collisionGeometry,
      collisionMaterial
    );
    collisionParticles.name = "collisionParticles";
    scene.add(collisionParticles);

    // Position camera to view the dodgeball court from above
    camera.position.z = 25; // Further back to see whole court
    camera.position.y = 15; // Higher for top-down view
    camera.position.x = 0; // Centered
    camera.lookAt(0, 0, 0); // Look at center court

    // Track active collision effects
    let activeCollisions = 0;

    // Create a collision effect
    function createCollision(x: number, y: number, z: number, isRed: boolean) {
      if (activeCollisions >= 100) return; // Max capacity

      const idx = activeCollisions;
      activeCollisions++;

      // Set collision position
      collisionPositions[idx * 3] = x;
      collisionPositions[idx * 3 + 1] = y;
      collisionPositions[idx * 3 + 2] = z;

      // Set color based on participant
      if (isRed) {
        collisionColors[idx * 3] = 1.0; // Red
        collisionColors[idx * 3 + 1] = 0.3; // Some green
        collisionColors[idx * 3 + 2] = 0.1; // Little blue
      } else {
        collisionColors[idx * 3] = 0.3; // Some red
        collisionColors[idx * 3 + 1] = 1.0; // Green
        collisionColors[idx * 3 + 2] = 0.1; // Little blue
      }

      // Initialize parameters
      collisionSizes[idx] = 0.5;
      collisionOpacities[idx] = 1.0;
      collisionAge[idx] = 0;

      // Update geometry attributes
      collisionGeometry.attributes.position.needsUpdate = true;
      collisionGeometry.attributes.size.needsUpdate = true;
      collisionGeometry.attributes.opacity.needsUpdate = true;
      collisionGeometry.attributes.color.needsUpdate = true;
    }

    // Animation variables
    let time = 0;
    let activePulses: Array<{
      x: number;
      y: number;
      z: number;
      time: number;
      strength: number;
    }> = [];

    // Define the market pulse handler
    const handleMarketPulse = (e: CustomEvent) => {
      const { x, y, strength } = e.detail;
      // Add a new pulse wave
      activePulses.push({
        x,
        y,
        z: 0,
        time: 0,
        strength,
      });
    };

    // Add event listener for mouse/touch movement to create pulse waves
    const handleInteraction = (e: MouseEvent | TouchEvent) => {
      // Only create pulse waves occasionally to avoid overloading
      // Increase chance on mobile for better responsiveness
      const isMobile = "ontouchstart" in window;
      const threshold = isMobile ? 0.15 : 0.07;
      if (Math.random() > threshold) return;

      let clientX, clientY;

      if ("touches" in e) {
        // Touch event
        clientX = e.touches[0].clientX;
        clientY = e.touches[0].clientY;
      } else {
        // Mouse event
        clientX = e.clientX;
        clientY = e.clientY;
      }

      // Calculate relative position in scene
      const x = (clientX / window.innerWidth) * 2 - 1;
      const y = -((clientY / window.innerHeight) * 2 - 1);

      // Communicate pulse with the THREE.js scene via a custom event
      const pulseStrength = isMobile
        ? 0.7 + Math.random() * 0.3
        : 0.5 + Math.random() * 0.5;
      const event = new CustomEvent("market-pulse", {
        detail: { x, y, strength: pulseStrength },
      });
      window.dispatchEvent(event);
    };

    // Add event listeners with passive flag for better performance
    window.addEventListener("mousemove", handleInteraction, { passive: true });
    window.addEventListener("touchmove", handleInteraction, { passive: true });
    window.addEventListener("touchstart", handleInteraction, { passive: true });
    window.addEventListener("market-pulse", handleMarketPulse as EventListener);

    // Handle window resize with debouncing and mobile optimizations
    let resizeTimeout: number | undefined;
    const initialHeight = window.innerHeight;
    let lastWidth = window.innerWidth;

    const handleResize = () => {
      // Clear previous timeout to debounce rapid resize events
      if (resizeTimeout !== undefined) {
        window.clearTimeout(resizeTimeout);
      }

      // Delay execution to avoid thrashing during scroll on mobile
      resizeTimeout = window.setTimeout(() => {
        const currentWidth = window.innerWidth;
        const widthChanged = Math.abs(currentWidth - lastWidth) > 20;

        // Only update if meaningful width change (avoid chrome menu triggers)
        if (widthChanged || !MOBILE_OPTIMIZED) {
          // Use fixed height on mobile to prevent jumping during browser UI changes
          const isMobile = /iPhone|iPad|iPod|Android/i.test(
            navigator.userAgent
          );
          const targetHeight =
            isMobile && MOBILE_OPTIMIZED ? initialHeight : window.innerHeight;

          // Update renderer and camera
          camera.aspect = window.innerWidth / targetHeight;
          camera.updateProjectionMatrix();
          renderer.setSize(window.innerWidth, targetHeight);

          // Update camera position based on aspect ratio
          if (camera.aspect < 1) {
            // Portrait mode
            camera.position.z = 35; // Further back
            camera.position.y = 20; // Higher position
          } else {
            camera.position.z = 25;
            camera.position.y = 15;
          }

          // Remember current width for comparison
          lastWidth = currentWidth;
        }
      }, 250); // 250ms debounce
    };

    // Initial resize to set correct viewport
    handleResize();

    // Listen for resize events
    window.addEventListener("resize", handleResize);

    // Animation loop with error handling
    const animate = () => {
      if (!mountedRef.current) return;

      // Store reference to animation frame for cleanup
      requestRef.current = requestAnimationFrame(animate);
      
      try {
        time += 0.01;

        // Process active pulse waves
        const remainingPulses = [];

        for (const pulse of activePulses) {
          pulse.time += 0.02;

          // Pulse influence range grows over time then fades
          const pulseRadius = pulse.time * 12; // Expands outward
          const pulseStrength =
            Math.max(0, 0.2 - pulse.time * 0.1) * pulse.strength;

          // Only keep pulses that still have influence
          if (pulseStrength > 0.001) {
            remainingPulses.push(pulse);
          }

          // Apply pulse influence to nearby particles
          if (pulseStrength > 0) {
            // Reduce sample size based on device performance
            const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
            const sampleSize = isMobile && MOBILE_OPTIMIZED ? 30 : 60;
            
            // Only process if pulse is strong enough to have visible impact
            if (pulseStrength > 0.02) {
              for (let i = 0; i < sampleSize; i++) {
                // Randomly sample from all particles - calculate once and reuse
                const redRandom = Math.floor(Math.random() * particleCount.red);
                const greenRandom = Math.floor(Math.random() * particleCount.green);
                const blueRandom = Math.floor(Math.random() * particleCount.blueBalls);
                
                const idx = redRandom * 3;
                const gIdx = greenRandom * 3; 
                const bIdx = blueRandom * 3;

                // Calculate distance to pulse center for each particle type
                const distanceRed = Math.sqrt(
                  Math.pow(
                    redParticles.geometry.attributes.position.array[idx] -
                      pulse.x,
                    2
                  ) +
                    Math.pow(
                      redParticles.geometry.attributes.position.array[idx + 1] -
                        pulse.y,
                      2
                    )
                );

                const distanceGreen = Math.sqrt(
                  Math.pow(
                    greenParticles.geometry.attributes.position.array[gIdx] -
                      pulse.x,
                    2
                  ) +
                    Math.pow(
                      greenParticles.geometry.attributes.position.array[
                        gIdx + 1
                      ] - pulse.y,
                      2
                    )
                );

                const distanceBlueBalls = Math.sqrt(
                  Math.pow(
                    blueBallsParticles.geometry.attributes.position.array[bIdx] -
                      pulse.x,
                    2
                  ) +
                    Math.pow(
                      blueBallsParticles.geometry.attributes.position.array[
                        bIdx + 1
                      ] - pulse.y,
                      2
                    )
                );

                // Apply force if within pulse wave radius
                const pulseWidth = 3.0; // Width of the wave

                // Red particles
                if (Math.abs(distanceRed - pulseRadius) < pulseWidth) {
                  const force =
                    ((pulseWidth - Math.abs(distanceRed - pulseRadius)) /
                      pulseWidth) *
                    pulseStrength;
                  const direction =
                    distanceRed > 0
                      ? (distanceRed - pulseRadius) /
                        Math.abs(distanceRed - pulseRadius)
                      : 1;

                  // Direction from pulse center to particle
                  const dx =
                    redParticles.geometry.attributes.position.array[idx] -
                    pulse.x;
                  const dy =
                    redParticles.geometry.attributes.position.array[idx + 1] -
                    pulse.y;
                  const normalizer = Math.sqrt(dx * dx + dy * dy) || 1;

                  // Apply outward force
                  redVelocities[idx] +=
                    (dx / normalizer) * force * 0.05 * direction;
                  redVelocities[idx + 1] +=
                    (dy / normalizer) * force * 0.05 * direction;
                  redSizes[idx / 3] = Math.min(
                    1.0,
                    redSizes[idx / 3] + force * 0.2
                  );
                }

                // Green particles
                if (Math.abs(distanceGreen - pulseRadius) < pulseWidth) {
                  const force =
                    ((pulseWidth - Math.abs(distanceGreen - pulseRadius)) /
                      pulseWidth) *
                    pulseStrength;
                  const direction =
                    distanceGreen > 0
                      ? (distanceGreen - pulseRadius) /
                        Math.abs(distanceGreen - pulseRadius)
                      : 1;

                  // Direction from pulse center to particle
                  const dx =
                    greenParticles.geometry.attributes.position.array[gIdx] -
                    pulse.x;
                  const dy =
                    greenParticles.geometry.attributes.position.array[gIdx + 1] -
                    pulse.y;
                  const normalizer = Math.sqrt(dx * dx + dy * dy) || 1;

                  // Apply outward force
                  greenVelocities[gIdx] +=
                    (dx / normalizer) * force * 0.05 * direction;
                  greenVelocities[gIdx + 1] +=
                    (dy / normalizer) * force * 0.05 * direction;
                  greenSizes[gIdx / 3] = Math.min(
                    1.0,
                    greenSizes[gIdx / 3] + force * 0.2
                  );
                }

                // Blue dodgeballs - more responsive to pulses
                if (
                  Math.abs(distanceBlueBalls - pulseRadius) <
                  pulseWidth * 1.5
                ) {
                  const force =
                    ((pulseWidth * 1.5 -
                      Math.abs(distanceBlueBalls - pulseRadius)) /
                      (pulseWidth * 1.5)) *
                    pulseStrength *
                    2.5;

                  // Direction from pulse center to particle
                  const dx =
                    blueBallsParticles.geometry.attributes.position.array[bIdx] -
                    pulse.x;
                  const dy =
                    blueBallsParticles.geometry.attributes.position.array[
                      bIdx + 1
                    ] - pulse.y;
                  const normalizer = Math.sqrt(dx * dx + dy * dy) || 1;

                  // Apply both outward force and attraction depending on distance
                  if (distanceBlueBalls < pulseRadius) {
                    // Inside pulse - push outward
                    blueBallsParticles.geometry.attributes.position.array[bIdx] +=
                      (dx / normalizer) * force * 0.1;
                    blueBallsParticles.geometry.attributes.position.array[
                      bIdx + 1
                    ] += (dy / normalizer) * force * 0.1;
                  } else {
                    // Outside pulse - pull inward to the wave
                    blueBallsParticles.geometry.attributes.position.array[bIdx] -=
                      (dx / normalizer) * force * 0.07;
                    blueBallsParticles.geometry.attributes.position.array[
                      bIdx + 1
                    ] -= (dy / normalizer) * force * 0.07;
                  }

                  // Increase size temporarily
                  blueBallsSizes[bIdx / 3] = Math.min(
                    1.5,
                    blueBallsSizes[bIdx / 3] + force * 0.6
                  );
                }
              }
            }
          }
        }

        // Update active pulses list
        activePulses = remainingPulses;

        // Game Logic Update - Control the dodgeball game phases
        if (gameState.phase === "ready" && time > 2) {
          // Start the game after 2 seconds - the rush to center
          gameState.phase = "rush";
          gameState.phaseStartTime = time;

          // Give initial velocity toward center for all players
          for (let i = 0; i < particleCount.red; i++) {
            const idx = i * 3;
            redVelocities[idx] = 0.1 + Math.random() * 0.05; // Rush toward center (right)
            redVelocities[idx + 2] = (Math.random() - 0.5) * 0.02; // Slight z variation
          }

          for (let i = 0; i < particleCount.green; i++) {
            const idx = i * 3;
            greenVelocities[idx] = -0.1 - Math.random() * 0.05; // Rush toward center (left)
            greenVelocities[idx + 2] = (Math.random() - 0.5) * 0.02; // Slight z variation
          }
        }

        // Transition from rush to battle phase when enough time has passed
        else if (
          gameState.phase === "rush" &&
          time - gameState.phaseStartTime > 3
        ) {
          gameState.phase = "battle";
          gameState.phaseStartTime = time;
          gameState.rushComplete = true;

          // Slow down players after the rush
          for (let i = 0; i < particleCount.red; i++) {
            const idx = i * 3;
            redVelocities[idx] *= 0.3;
            redVelocities[idx + 2] *= 0.3;
          }

          for (let i = 0; i < particleCount.green; i++) {
            const idx = i * 3;
            greenVelocities[idx] *= 0.3;
            greenVelocities[idx + 2] *= 0.3;
          }
        }

        // 1. Update Red Team Players
        const redPos = redParticles.geometry.attributes.position
          .array as Float32Array;
        const redSize = redParticles.geometry.attributes.size
          .array as Float32Array;

        for (let i = 0; i < particleCount.red; i++) {
          if (gameState.playerStatus.red[i] === "eliminated") continue; // Skip eliminated players

          const idx = i * 3;

          // Apply velocity - more directed during rush phase
          redPos[idx] += redVelocities[idx];
          redPos[idx + 1] += redVelocities[idx + 1];
          redPos[idx + 2] += redVelocities[idx + 2];

          // Add slight jitter for more natural movement during battle
          if (gameState.phase === "battle") {
            redPos[idx] += (Math.random() - 0.5) * 0.02;
            redPos[idx + 2] += (Math.random() - 0.5) * 0.02;
          }

          // Keep players on the ground
          if (redPos[idx + 1] > 0) {
            redPos[idx + 1] = 0;
            redVelocities[idx + 1] = 0;
          }

          // Court boundaries with bounce effect - keep players in bounds
          const courtWidth = 25;
          const courtDepth = 15;

          if (Math.abs(redPos[idx]) > courtWidth) {
            redVelocities[idx] *= -0.5; // Bounce with energy loss
            redPos[idx] = Math.sign(redPos[idx]) * courtWidth;
          }

          if (Math.abs(redPos[idx + 2]) > courtDepth) {
            redVelocities[idx + 2] *= -0.5; // Bounce with energy loss
            redPos[idx + 2] = Math.sign(redPos[idx + 2]) * courtDepth;
          }

          // During battle phase, players may pick up dodgeballs or throw them
          if (gameState.phase === "battle") {
            // Players size based on status
            if (gameState.playerStatus.red[i] === "carrying") {
              redSize[i] = 0.6; // Bigger when carrying a ball
            } else {
              redSize[i] = 0.4 + 0.1 * Math.sin(time * 2 + i); // Normal pulsing
            }
          } else {
            // During rush, size indicates speed
            redSize[i] =
              0.4 +
              Math.sqrt(
                redVelocities[idx] * redVelocities[idx] +
                  redVelocities[idx + 2] * redVelocities[idx + 2]
              ) *
                2;
          }
        }

        // 2. Update Green Team Players
        const greenPos = greenParticles.geometry.attributes.position
          .array as Float32Array;
        const greenSize = greenParticles.geometry.attributes.size
          .array as Float32Array;

        for (let i = 0; i < particleCount.green; i++) {
          if (gameState.playerStatus.green[i] === "eliminated") continue; // Skip eliminated players

          const idx = i * 3;

          // Apply velocity - more directed during rush phase
          greenPos[idx] += greenVelocities[idx];
          greenPos[idx + 1] += greenVelocities[idx + 1];
          greenPos[idx + 2] += greenVelocities[idx + 2];

          // Add slight jitter for more natural movement during battle
          if (gameState.phase === "battle") {
            greenPos[idx] += (Math.random() - 0.5) * 0.02;
            greenPos[idx + 2] += (Math.random() - 0.5) * 0.02;
          }

          // Keep players on the ground
          if (greenPos[idx + 1] > 0) {
            greenPos[idx + 1] = 0;
            greenVelocities[idx + 1] = 0;
          }

          // Court boundaries with bounce effect - keep players in bounds
          const courtWidth = 25;
          const courtDepth = 15;

          if (Math.abs(greenPos[idx]) > courtWidth) {
            greenVelocities[idx] *= -0.5; // Bounce with energy loss
            greenPos[idx] = Math.sign(greenPos[idx]) * courtWidth;
          }

          if (Math.abs(greenPos[idx + 2]) > courtDepth) {
            greenVelocities[idx + 2] *= -0.5; // Bounce with energy loss
            greenPos[idx + 2] = Math.sign(greenPos[idx + 2]) * courtDepth;
          }

          // During battle phase, players may pick up dodgeballs or throw them
          if (gameState.phase === "battle") {
            // Players size based on status
            if (gameState.playerStatus.green[i] === "carrying") {
              greenSize[i] = 0.6; // Bigger when carrying a ball
            } else {
              greenSize[i] = 0.4 + 0.1 * Math.sin(time * 2 + i); // Normal pulsing
            }
          } else {
            // During rush, size indicates speed
            greenSize[i] =
              0.4 +
              Math.sqrt(
                greenVelocities[idx] * greenVelocities[idx] +
                  greenVelocities[idx + 2] * greenVelocities[idx + 2]
              ) *
                2;
          }
        }

        // 3. Update Blue Dodgeballs
        const blueBallsPos = blueBallsParticles.geometry.attributes.position
          .array as Float32Array;
        const blueBallsSize = blueBallsParticles.geometry.attributes.size
          .array as Float32Array;

        for (let i = 0; i < particleCount.blueBalls; i++) {
          const idx = i * 3;

          // Update ball positions based on rush/battle phase
          if (gameState.phase === "ready") {
            // Balls are stationary at center
            blueBallsPos[idx + 1] = 0 + Math.sin(time * 5 + i) * 0.05; // Slight hovering
          } else if (gameState.phase === "rush") {
            // During rush, balls get pushed around by players rushing in
            blueBallsPos[idx] += blueBallsVelocities[idx];
            blueBallsPos[idx + 1] += blueBallsVelocities[idx + 1];
            blueBallsPos[idx + 2] += blueBallsVelocities[idx + 2];

            // Apply gravity, so balls fall back down
            if (blueBallsPos[idx + 1] > 0) {
              blueBallsVelocities[idx + 1] -= 0.002;
            }

            // Friction slows balls
            blueBallsVelocities[idx] *= 0.98;
            blueBallsVelocities[idx + 2] *= 0.98;

            // Ball size pulsates slightly
            blueBallsSize[i] = 0.6 + Math.sin(time * 10 + i) * 0.05;
          } else if (gameState.phase === "battle") {
            // During battle, balls are either held by players or thrown
            const ballOwner = gameState.ballOwnership[i];

            if (ballOwner === -1) {
              // Ball is on the ground
              if (blueBallsPos[idx + 1] > 0) {
                blueBallsVelocities[idx + 1] -= 0.002; // Gravity
                blueBallsPos[idx + 1] += blueBallsVelocities[idx + 1];
              } else {
                blueBallsPos[idx + 1] = 0; // Rest on ground
                blueBallsVelocities[idx + 1] = 0;

                // Ball rolling friction
                blueBallsVelocities[idx] *= 0.95;
                blueBallsVelocities[idx + 2] *= 0.95;
              }

              // Apply remaining velocity
              blueBallsPos[idx] += blueBallsVelocities[idx];
              blueBallsPos[idx + 2] += blueBallsVelocities[idx + 2];

              // Size pulsates for visibility
              blueBallsSize[i] = 0.6 + Math.sin(time * 5 + i) * 0.1;
            } else {
              // Ball is being thrown or held - handled in player updates
              // This just handles visual effect for the ball
              blueBallsSize[i] = 0.7; // Larger when actively in play
            }
          }

          // Keep balls within court bounds
          const courtWidth = 25;
          const courtDepth = 15;

          if (Math.abs(blueBallsPos[idx]) > courtWidth) {
            blueBallsVelocities[idx] *= -0.7; // Bounce with energy loss
            blueBallsPos[idx] = Math.sign(blueBallsPos[idx]) * courtWidth;
          }

          if (Math.abs(blueBallsPos[idx + 2]) > courtDepth) {
            blueBallsVelocities[idx + 2] *= -0.7; // Bounce with energy loss
            blueBallsPos[idx + 2] =
              Math.sign(blueBallsPos[idx + 2]) * courtDepth;
          }
        }

        // 4. Check for collisions between red and green particles - ENHANCED BATTLE MODE
        // Reduce collision checks based on device performance
        const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
        const checkRatio = isMobile && MOBILE_OPTIMIZED ? 0.05 : 0.1;
        const checkLimit = Math.floor(particleCount.red * checkRatio);
        const startIdx = Math.floor(
          Math.random() * (particleCount.red - checkLimit)
        );
        
        // Skip some frames for collision detection on mobile
        const shouldProcessCollisions = !isMobile || time % 2 < 0.01; // Only check every other frame on mobile
        
        if (shouldProcessCollisions) {
          for (let i = startIdx; i < startIdx + checkLimit; i++) {
            const redIdx = i * 3;
            const rx = redPos[redIdx];
            const ry = redPos[redIdx + 1];
            const rz = redPos[redIdx + 2];
  
            // Check against fewer green particles on mobile
            const checksPerRed = isMobile && MOBILE_OPTIMIZED ? 2 : 4;
            for (let j = 0; j < checksPerRed; j++) {
              // Sample green particles more efficiently
              const greenIdx =
                Math.floor(Math.random() * particleCount.green) * 3;
              const gx = greenPos[greenIdx];
              const gy = greenPos[greenIdx + 1];
              const gz = greenPos[greenIdx + 2];
  
              // Use squared distance for faster comparison (avoid sqrt)
              const distanceSquare = distanceSquared(rx, ry, rz, gx, gy, gz);
              const collisionRadiusSquare = 1.44; // 1.2^2
  
              // If particles collide - using squared distance
              if (distanceSquare < collisionRadiusSquare) {
                // Increased from 0.8 for more frequent collisions
                // Create collision effect
                const collisionX = (rx + gx) / 2;
                const collisionY = (ry + gy) / 2;
                const collisionZ = (rz + gz) / 2;

                // Determine winner by energy and random factor
                const redWins = redEnergies[i] > Math.random();
                createCollision(collisionX, collisionY, collisionZ, redWins);

                // Enhanced repulsion for more dramatic battles
                const repelForce = 0.15; // Increased from 0.1
                const dx = rx - gx;
                const dy = ry - gy;
                const dz = rz - gz;

                // Normalize direction
                const mag = Math.sqrt(dx * dx + dy * dy + dz * dz);
                const dirX = dx / mag;
                const dirY = dy / mag;
                const dirZ = dz / mag;

                // Apply stronger forces for more dramatic interactions
                redVelocities[redIdx] += dirX * repelForce * 1.2;
                redVelocities[redIdx + 1] += dirY * repelForce * 1.2;
                redVelocities[redIdx + 2] += dirZ * repelForce * 1.2;

                greenVelocities[greenIdx] -= dirX * repelForce * 1.2;
                greenVelocities[greenIdx + 1] -= dirY * repelForce * 1.2;
                greenVelocities[greenIdx + 2] -= dirZ * repelForce * 1.2;

                // Temporarily increase the particle sizes during collision for visual emphasis
                redSize[Math.floor(redIdx / 3)] += 0.2;
                greenSize[Math.floor(greenIdx / 3)] += 0.2;

                // Modulate energies (they exchange some energy)
                redEnergies[i] = redEnergies[i] * 0.9 + Math.random() * 0.1;
                greenEnergies[Math.floor(greenIdx / 3)] =
                  greenEnergies[Math.floor(greenIdx / 3)] * 0.9 +
                  Math.random() * 0.1;

                // Break after one collision found
                break;
              }
            }
          }
        }

        // 5. Update Collision Effects
        let remainingCollisions = 0;

        for (let i = 0; i < activeCollisions; i++) {
          collisionAge[i] += 0.05;

          if (collisionAge[i] < 1.0) {
            // Collision is still active
            const expandPhase = Math.min(collisionAge[i] * 2, 1); // 0-1 over first half of life
            const fadePhase = Math.max(0, 1 - (collisionAge[i] - 0.5) * 2); // 1-0 over second half

            // Expand and fade
            collisionSizes[i] = 0.5 + expandPhase * 3.0; // Grow from 0.5 to 3.5
            collisionOpacities[i] = fadePhase;

            // Keep this collision
            if (i !== remainingCollisions) {
              // Move this collision data to the active slot
              collisionPositions[remainingCollisions * 3] =
                collisionPositions[i * 3];
              collisionPositions[remainingCollisions * 3 + 1] =
                collisionPositions[i * 3 + 1];
              collisionPositions[remainingCollisions * 3 + 2] =
                collisionPositions[i * 3 + 2];

              collisionSizes[remainingCollisions] = collisionSizes[i];
              collisionOpacities[remainingCollisions] = collisionOpacities[i];
              collisionAge[remainingCollisions] = collisionAge[i];
              collisionColors[remainingCollisions * 3] = collisionColors[i * 3];
              collisionColors[remainingCollisions * 3 + 1] =
                collisionColors[i * 3 + 1];
              collisionColors[remainingCollisions * 3 + 2] =
                collisionColors[i * 3 + 2];
            }

            remainingCollisions++;
          }
        }

        activeCollisions = remainingCollisions;

        // 6. Update lights for dynamic effect with reduced intensity
        redLight.intensity = 0.3 + 0.1 * Math.sin(time * 2);
        greenLight.intensity = 0.3 + 0.1 * Math.sin(time * 2 + Math.PI);

        // Make camera slowly orbit the scene - more optimized for mobile
        if (!MOBILE_OPTIMIZED) {
          // Only do camera animation on desktop for better performance
          camera.position.x = 15 * Math.sin(time * 0.1);
          camera.position.z = 15 * Math.cos(time * 0.1);
          camera.position.y = 3 + Math.sin(time * 0.2) * 2;
          camera.lookAt(0, 0, 0);
        }

        // Update geometries - only update on every frame for desktop or every other frame for mobile
        const frameSkip = isMobile && MOBILE_OPTIMIZED;
        
        // Only update on specific frames for better performance on mobile
        if (!frameSkip || Math.floor(time * 30) % 2 === 0) {
          redParticles.geometry.attributes.position.needsUpdate = true;
          redParticles.geometry.attributes.size.needsUpdate = true;
          
          greenParticles.geometry.attributes.position.needsUpdate = true;
          greenParticles.geometry.attributes.size.needsUpdate = true;
          
          blueBallsParticles.geometry.attributes.position.needsUpdate = true;
          blueBallsParticles.geometry.attributes.size.needsUpdate = true;
          
          // Always update collision particles as they are visually important
          collisionParticles.geometry.attributes.position.needsUpdate = true;
          collisionParticles.geometry.attributes.size.needsUpdate = true;
          collisionParticles.geometry.attributes.opacity.needsUpdate = true;
          collisionParticles.geometry.attributes.color.needsUpdate = true;
        }

        // Only render if the component is still mounted and renderer exists
        if (mountedRef.current && renderer && scene && camera) {
          renderer.render(scene, camera);
        }
      } catch (error) {
        console.error("Error in animation loop:", error);
        setHasWebGLError(true);

        // Cancel animation frame to stop the loop
        if (requestRef.current) {
          cancelAnimationFrame(requestRef.current);
        }
      }
    };

    animate();

    // Return cleanup function
    return () => {
      // Set mounted ref to false to stop animation loop
      mountedRef.current = false;

      // Cancel any pending animation frame
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }

      // Remove the renderer from the DOM
      try {
        if (containerRef.current && rendererRef.current && rendererRef.current.domElement) {
          containerRef.current.removeChild(rendererRef.current.domElement);
        }
      } catch (error) {
        console.error("Error removing renderer from DOM:", error);
      }

      // Clean up event listeners
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("mousemove", handleInteraction);
      window.removeEventListener("touchmove", handleInteraction);
      window.removeEventListener("touchstart", handleInteraction);
      window.removeEventListener(
        "market-pulse",
        handleMarketPulse as EventListener
      );

      // Dispose of all Three.js resources
      try {
        // Clear scene
        if (sceneRef.current) {
          sceneRef.current.clear();
        }

        // Dispose renderer
        if (rendererRef.current) {
          rendererRef.current.dispose();
          rendererRef.current.forceContextLoss();
          rendererRef.current = null;
        }
      } catch (error) {
        console.error("Error during cleanup:", error);
      }
    };
  }, [graphicsQuality]);

  // When component mounts, set it to mounted after a short delay
  useEffect(() => {
    setIsMounted(true);
    return () => setIsMounted(false);
  }, []);

  // If WebGL error occurred, render a simplified version or nothing
  if (hasWebGLError) {
    return null;
  }

  return (
    <div
      ref={containerRef}
      id="particles-container"
      className="particles-container"
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: "100%",
        pointerEvents: "none", // Don't capture clicks/taps
        zIndex: 10,
        opacity: isMounted ? OPACITY_MAGNITUDE * 0.3 : OPACITY_MAGNITUDE * 0.7, // Start brighter, then fade to subtle
        transition: "opacity 3s ease-out", // Smooth transition over 3 seconds
        transform: "translateZ(0)", // Force GPU acceleration
        willChange: "opacity", // Hint for browser optimization
      }}
    ></div>
  );
};