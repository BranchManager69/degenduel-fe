import { useFrame } from '@react-three/fiber';
import React, { useRef } from 'react';
import * as THREE from 'three';

export const Particles: React.FC = () => {
  const particlesRef = useRef<THREE.Points>(null);
  
  useFrame(({ clock }) => {
    if (!particlesRef.current) return;
    
    const positions = particlesRef.current.geometry.attributes.position.array as Float32Array;
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

  return (
    <points ref={particlesRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={1000}
          array={new Float32Array(3000).map(() => (Math.random() - 0.5) * 10)}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color="#ffffff"
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
        depthWrite={false}
      />
    </points>
  );
}; 