import { useFrame } from "@react-three/fiber";
import React, { useEffect, useRef } from "react";
import type { Points } from "three";
import * as THREE from "three";
import { useTokenData } from "../../contexts/TokenDataContext";
import { useStore } from "../../store/useStore";

export const ParticlesEffect: React.FC = () => {
  const particlesRef = useRef<Points>(null);
  const { tokens } = useTokenData();
  const { maintenanceMode, user } = useStore();

  // Create particles based on token data
  useEffect(() => {
    // Skip particle update during maintenance mode (unless admin/superadmin)
    if (maintenanceMode && !(user?.is_admin || user?.is_superadmin)) return;

    if (!particlesRef.current || !tokens.length) return;

    // Update particle colors and properties based on token data
    const geometry = particlesRef.current.geometry;
    const positions = geometry.attributes.position.array as Float32Array;
    const colors = new Float32Array(positions.length);

    // Get a standardized array with token changes to affect particles
    const tokenChanges = tokens.map((token) => ({
      change: parseFloat(token.change24h || "0"),
      volume: parseFloat(token.volume24h || "0"),
      price: parseFloat(token.price || "0"),
    }));

    // Update particle attributes based on token data
    for (let i = 0; i < positions.length; i += 3) {
      const tokenIndex = Math.floor(i / 3) % tokenChanges.length;
      const token = tokenChanges[tokenIndex];

      // Color based on price change (green for positive, red for negative)
      const r = token.change < 0 ? 1.0 : 0.0;
      const g = token.change > 0 ? 1.0 : 0.0;
      const b = 0.5; // Add some blue to all particles

      // Set RGB values in the colors array
      colors[i] = r;
      colors[i + 1] = g;
      colors[i + 2] = b;
    }

    // Add the color attribute to the geometry
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
  }, [tokens, maintenanceMode, user]);

  useFrame(({ clock }) => {
    // Skip animation during maintenance mode (unless admin/superadmin)
    if (maintenanceMode && !(user?.is_admin || user?.is_superadmin)) return;

    if (!particlesRef.current) return;

    const positions = particlesRef.current.geometry.attributes.position
      .array as Float32Array;
    const time = clock.getElapsedTime();

    for (let i = 0; i < positions.length; i += 3) {
      // Smoke-like movement
      positions[i] += Math.sin(time + positions[i]) * 0.01;
      positions[i + 1] += Math.cos(time + positions[i + 1]) * 0.01 + 0.02;
      positions[i + 2] += Math.sin(time * 0.5 + positions[i + 2]) * 0.01;

      // Reset particles that move too far
      if (positions[i + 1] > 2.5) {
        positions[i + 1] = -2.5;
      }
    }

    particlesRef.current.geometry.attributes.position.needsUpdate = true;
  });

  // Scale the number of particles based on token count
  const particleCount = Math.max(1000, tokens.length * 50);

  // Don't render during maintenance mode (unless admin/superadmin)
  if (maintenanceMode && !(user?.is_admin || user?.is_superadmin)) {
    return null;
  }

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particleCount}
          array={new Float32Array(particleCount * 3).map(
            () => (Math.random() - 0.5) * 10
          )}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        vertexColors // Use vertex colors instead of a single color
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
};
