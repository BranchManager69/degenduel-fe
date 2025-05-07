import React, { useEffect, useRef } from "react";
import * as THREE from "three";

import ThreeManager from "../../src/utils/three/ThreeManager";

interface Logo3DProps {
  isCompact?: boolean;
}

export const Logo3D: React.FC<Logo3DProps> = ({ isCompact = false }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const logoId = "header-logo-3d";

  // Setup the 3D logo scene using ThreeManager
  useEffect(() => {
    if (!containerRef.current) return;

    // First check if logo already exists in ThreeManager
    const threeManager = ThreeManager.getInstance();

    // Create scene with logo using ThreeManager
    const { scene } = threeManager.createScene(
      logoId,
      {
        fov: 50,
        near: 0.1,
        far: 1000,
        position: new THREE.Vector3(0, 0, 10),
        lookAt: new THREE.Vector3(0, 0, 0),
      },
      50, // Highest render priority to be above other visuals
    );

    // Setup the scene
    setupLogoScene(scene, isCompact);

    // Attach renderer to container
    threeManager.attachRenderer(logoId, containerRef.current);

    // Register animation function
    threeManager.registerScene(logoId, (deltaTime) => {
      animateLogo(scene, deltaTime);
    });

    // Cleanup function
    return () => {
      threeManager.unregisterScene(logoId);
    };
  }, [isCompact]);

  // Setup the logo scene
  const setupLogoScene = (
    scene: THREE.Scene | undefined,
    isCompact: boolean,
  ) => {
    if (!scene) return;
    // Clear any existing objects
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambientLight);

    // Add directional light
    const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
    directionalLight.position.set(1, 1, 2);
    scene.add(directionalLight);

    // Add point lights for the glow effect
    const purpleLight = new THREE.PointLight(0x9333ea, 1, 10);
    purpleLight.position.set(-1, 0, 2);
    scene.add(purpleLight);

    const cyanLight = new THREE.PointLight(0x00e1ff, 0.7, 10);
    cyanLight.position.set(1, 0, 2);
    scene.add(cyanLight);

    // Create geometry and materials - scale based on isCompact
    const scale = isCompact ? 0.8 : 1;

    // Create shared materials
    const threeManager = ThreeManager.getInstance();

    // Purple material for "DEGEN"
    const purpleMaterial = threeManager.getOrCreateMaterial(
      "logo-purple-material",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x9333ea,
          metalness: 0.8,
          roughness: 0.2,
          emissive: 0x6a0dad,
          emissiveIntensity: 0.3,
        }),
    );

    // Silver material for "DUEL"
    const silverMaterial = threeManager.getOrCreateMaterial(
      "logo-silver-material",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xdddddd,
          metalness: 0.9,
          roughness: 0.2,
          emissive: 0x666666,
          emissiveIntensity: 0.1,
        }),
    );

    // Instead of text geometry, we'll create stylized 3D boxes for the logo
    // Create a group for "DEGEN" - left side
    const degenGroup = new THREE.Group();
    degenGroup.position.set(-2.5 * scale, 0, 0);
    scene.add(degenGroup);

    // Create a group for "DUEL" - right side
    const duelGroup = new THREE.Group();
    duelGroup.position.set(2.5 * scale, 0, 0);
    scene.add(duelGroup);

    // Create box geometries for the letters
    const letterGeometry = threeManager.getOrCreateGeometry(
      "logo-letter-geometry",
      () => new THREE.BoxGeometry(0.4 * scale, 0.8 * scale, 0.2 * scale),
    );

    // Create rounded box for more elegant appearance
    const roundedLetterGeometry = threeManager.getOrCreateGeometry(
      "logo-rounded-letter-geometry",
      () => new THREE.CapsuleGeometry(0.2 * scale, 0.6 * scale, 4, 8),
    );

    // Create the DEGEN side with purple material
    const degenSpacing = 0.5 * scale;
    for (let i = 0; i < 5; i++) {
      // Skip the middle position to create the spacing for "DEGEN"
      if (i === 2) continue;

      const letter = new THREE.Mesh(
        i % 2 === 0 ? letterGeometry : roundedLetterGeometry,
        purpleMaterial,
      );

      // Position across x-axis with gaps
      let posX = (i - 2) * degenSpacing;
      // Adjust for the skipped letter
      if (i > 2) posX += degenSpacing;

      letter.position.set(posX, 0, 0);

      // Randomly rotate each letter slightly for style
      letter.rotation.z = (Math.random() - 0.5) * 0.1;
      letter.rotation.y = (Math.random() - 0.5) * 0.1;

      degenGroup.add(letter);
    }

    // Create the DUEL side with silver material
    const duelSpacing = 0.5 * scale;
    for (let i = 0; i < 4; i++) {
      const letter = new THREE.Mesh(
        i % 2 === 0 ? letterGeometry : roundedLetterGeometry,
        silverMaterial,
      );

      // Position across x-axis with gaps
      const posX = (i - 1.5) * duelSpacing;

      letter.position.set(posX, 0, 0);

      // Randomly rotate each letter slightly for style
      letter.rotation.z = (Math.random() - 0.5) * 0.1;
      letter.rotation.y = (Math.random() - 0.5) * 0.1;

      duelGroup.add(letter);
    }

    // Store initial positions for animation
    degenGroup.userData.initialPosition = degenGroup.position.clone();
    duelGroup.userData.initialPosition = duelGroup.position.clone();

    // Create X symbol
    const xGeometry = threeManager.getOrCreateGeometry(
      "logo-x-geometry",
      () => {
        // Create custom X geometry with two crossed bars
        const geometry = new THREE.BufferGeometry();
        const vertices = new Float32Array([
          // First bar (top-left to bottom-right)
          -0.4, 0.4, 0, 0.4, -0.4, 0, -0.3, 0.4, 0, 0.4, -0.3, 0,

          // Second bar (top-right to bottom-left)
          0.4, 0.4, 0, -0.4, -0.4, 0, 0.3, 0.4, 0, -0.4, -0.3, 0,
        ]);

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(vertices, 3),
        );
        geometry.setIndex([0, 2, 3, 0, 3, 1, 4, 6, 7, 4, 7, 5]);

        return geometry;
      },
    );

    // Create cyan material for X
    const cyanMaterial = threeManager.getOrCreateMaterial(
      "logo-cyan-material",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x00e1ff,
          metalness: 0.7,
          roughness: 0.2,
          emissive: 0x00e1ff,
          emissiveIntensity: 0.5,
        }),
    );

    // We replaced the text meshes with the degenGroup and duelGroup created above

    // Create X mesh
    const xMesh = new THREE.Mesh(xGeometry, cyanMaterial);
    xMesh.position.set(0, 0, 0);
    xMesh.scale.set(scale, scale, scale);
    xMesh.userData.initialPosition = xMesh.position.clone();
    scene.add(xMesh);

    // Add glowing energy core in the middle of the X
    const coreGeometry = new THREE.SphereGeometry(0.15 * scale, 16, 16);
    const coreMaterial = threeManager.getOrCreateMaterial(
      "logo-core-material",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x00e1ff,
          metalness: 0.5,
          roughness: 0.2,
          emissive: 0x00e1ff,
          emissiveIntensity: 1.0,
        }),
    );

    const energyCore = new THREE.Mesh(coreGeometry, coreMaterial);
    energyCore.position.set(0, 0, 0.05);
    energyCore.userData.originalScale = energyCore.scale.clone();
    scene.add(energyCore);

    // Create a pulsing glow ring around the X
    const ringGeometry = new THREE.RingGeometry(0.3 * scale, 0.35 * scale, 32);
    const ringMaterial = threeManager.getOrCreateMaterial(
      "logo-ring-material",
      () =>
        new THREE.MeshBasicMaterial({
          color: 0x00e1ff,
          transparent: true,
          opacity: 0.7,
          side: THREE.DoubleSide,
        }),
    );

    const glowRing = new THREE.Mesh(ringGeometry, ringMaterial);
    glowRing.position.set(0, 0, 0);
    glowRing.rotation.x = Math.PI / 2; // Make it flat in the scene
    scene.add(glowRing);

    // Camera positioning is already handled in createScene
    // The camera position is set during the scene creation above
    // No need to modify it here
  };

  // Animate the logo elements
  const animateLogo = (scene: THREE.Scene | undefined, deltaTime: number) => {
    if (!scene) return;

    // Current time for animations
    const now = performance.now();

    // Generic animate function for all Group objects that might be the DEGEN or DUEL groups
    const animateGroup = (object: THREE.Object3D, phaseOffset = 0) => {
      if (!(object instanceof THREE.Group)) return;

      // Try to get initial position
      const initialPos = object.userData?.initialPosition;
      if (initialPos && initialPos instanceof THREE.Vector3) {
        // Apply floating animation
        object.position.y =
          initialPos.y + Math.sin(now * 0.001 + phaseOffset) * 0.05;
      }

      // Animate children (letters)
      object.children.forEach((child, index) => {
        if (child instanceof THREE.Mesh) {
          child.rotation.z =
            Math.sin(now * 0.001 + index * 0.5 + phaseOffset) * 0.05;
        }
      });
    };

    // Find objects by direct scene traversal with type guards
    scene.children.forEach((object) => {
      // Identify groups by their position
      if (object instanceof THREE.Group) {
        if (object.position.x < 0) {
          // This is the DEGEN group (left side)
          animateGroup(object, 0);
        } else if (object.position.x > 0) {
          // This is the DUEL group (right side)
          animateGroup(object, Math.PI);
        }
      }
      // Identify and animate the X mesh
      else if (
        object instanceof THREE.Mesh &&
        object.material instanceof THREE.Material &&
        object.material.name === "logo-cyan-material"
      ) {
        // Animate the X
        object.rotation.z += deltaTime * 0.5;
      }
      // Identify and animate the energy core
      else if (
        object instanceof THREE.Mesh &&
        object.material instanceof THREE.MeshStandardMaterial &&
        object.material.name === "logo-core-material"
      ) {
        // Pulse the energy core
        const pulse = 0.9 + Math.sin(now * 0.003) * 0.2;
        object.scale.set(pulse, pulse, pulse);

        // Adjust emissive intensity
        object.material.emissiveIntensity = 0.8 + Math.sin(now * 0.002) * 0.2;
      }
      // Identify and animate the glow ring
      else if (
        object instanceof THREE.Mesh &&
        object.material instanceof THREE.MeshBasicMaterial &&
        object.material.name === "logo-ring-material"
      ) {
        // Pulse the glow ring
        const ringPulse = 0.9 + Math.sin(now * 0.002) * 0.3;
        object.scale.set(ringPulse, ringPulse, ringPulse);

        // Fade opacity
        object.material.opacity = 0.5 + Math.sin(now * 0.0015) * 0.3;
      }
    });
  };

  return (
    <div
      ref={containerRef}
      className="relative overflow-hidden"
      style={{
        width: isCompact ? "60px" : "70px",
        height: isCompact ? "25px" : "30px",
        display: "inline-block",
        maxWidth: "70px",
        maxHeight: "30px",
      }}
    >
      {/* Fallback text in case WebGL fails */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center font-bold opacity-0">DEGEN×DUEL</div>
      </div>
    </div>
  );
};
