import React, { useEffect, useRef } from "react";
import * as THREE from "three";
import ThreeManager from "../../utils/three/ThreeManager";

interface ToastBackgroundProps {
  color: string;
  type: "success" | "error" | "warning" | "info";
}

export const ToastBackground: React.FC<ToastBackgroundProps> = ({
  color,
  type
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentIdRef = useRef<string>(`toast-${type}-${Math.random().toString(36).substring(2, 9)}`);
  
  useEffect(() => {
    if (!containerRef.current) return;
    
    const threeManager = ThreeManager.getInstance();
    const componentId = componentIdRef.current;
    
    // Skip if WebGL is not available
    if (!threeManager.isWebGLAvailable()) {
      return;
    }
    
    // Attach the ThreeManager's renderer to our container
    threeManager.attachToContainer(componentId, containerRef.current);
    
    // Camera options for different toast types
    const cameraOptions = {
      fov: 75,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 0, 5)
    };
    
    // Create scene and camera in the ThreeManager
    const { scene } = threeManager.createScene(componentId, cameraOptions);
    
    // Particle configuration based on toast type
    const particleCount = type === "error" ? 150 : type === "warning" ? 130 : type === "success" ? 120 : 100;
    const particleSpeed = type === "error" ? 4.0 : type === "warning" ? 3.0 : type === "success" ? 2.5 : 2.0;
    
    // Create particle positions, colors, and sizes
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);
    const sizes = new Float32Array(particleCount);
    const colorObj = new THREE.Color(color);
    
    for (let i = 0; i < particleCount; i++) {
      // Position
      positions[i * 3] = (Math.random() - 0.5) * 10;
      positions[i * 3 + 1] = (Math.random() - 0.5) * 4;
      positions[i * 3 + 2] = (Math.random() - 0.5) * 4;
      
      // Color
      colors[i * 3] = colorObj.r;
      colors[i * 3 + 1] = colorObj.g;
      colors[i * 3 + 2] = colorObj.b;
      
      // Size
      sizes[i] = Math.random() * 0.1;
    }
    
    // Create geometry and add attributes
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    
    // Create shader material
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: { value: 0 },
        baseColor: { value: new THREE.Color(color) }
      },
      vertexShader: `
        attribute float size;
        varying vec3 vColor;
        uniform float time;
        void main() {
          vColor = color;
          vec3 pos = position;
          pos.x += sin(time * ${particleSpeed} + position.z) * 0.1;
          pos.y += cos(time * ${particleSpeed} + position.x) * 0.1;
          vec4 mvPosition = modelViewMatrix * vec4(pos, 1.0);
          gl_PointSize = size * (300.0 / -mvPosition.z);
          gl_Position = projectionMatrix * mvPosition;
        }
      `,
      fragmentShader: `
        varying vec3 vColor;
        uniform vec3 baseColor;
        void main() {
          float dist = length(gl_PointCoord - vec2(0.5));
          if (dist > 0.5) discard;
          float alpha = 1.0 - (dist * 2.0);
          vec3 finalColor = mix(baseColor, vColor, 0.5);
          gl_FragColor = vec4(finalColor, alpha * 0.5);
        }
      `,
      transparent: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });
    
    // Create particles
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    
    // Register animation callback
    let time = 0;
    threeManager.registerAnimation(componentId, (deltaTime) => {
      time += deltaTime;
      material.uniforms.time.value = time;
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.002;
    });
    
    // Cleanup function
    return () => {
      threeManager.removeScene(componentId);
      geometry.dispose();
      material.dispose();
    };
  }, [color, type]);
  
  return (
    <div
      ref={containerRef}
      className="absolute inset-0 -z-10"
      style={{
        pointerEvents: "none",
        opacity: type === "error" ? "0.85" : type === "warning" ? "0.8" : type === "success" ? "0.75" : "0.7"
      }}
    />
  );
};