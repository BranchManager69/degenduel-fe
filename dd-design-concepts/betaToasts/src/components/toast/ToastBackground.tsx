import React, { useEffect, useRef } from "react";
import * as THREE from "three";
interface ToastBackgroundProps {
  color: string;
  type: "success" | "error" | "warning" | "info";
}
export const ToastBackground: React.FC<ToastBackgroundProps> = ({
  color,
  type
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const particlesRef = useRef<THREE.Points | null>(null);
  useEffect(() => {
    if (!containerRef.current) return;

    // Scene setup
    const scene = new THREE.Scene();
    sceneRef.current = scene;

    // Camera setup
    const camera = new THREE.PerspectiveCamera(75, containerRef.current.clientWidth / containerRef.current.clientHeight, 0.1, 1000);
    camera.position.z = 5;
    cameraRef.current = camera;

    // Renderer setup
    const renderer = new THREE.WebGLRenderer({
      alpha: true,
      antialias: true
    });
    renderer.setSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
    containerRef.current.appendChild(renderer.domElement);
    rendererRef.current = renderer;

    // Particles
    const particleCount = type === "error" ? 150 : type === "warning" ? 130 : type === "success" ? 120 : 100;
    const particleSpeed = type === "error" ? 4.0 : type === "warning" ? 3.0 : type === "success" ? 2.5 : 2.0;
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
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("color", new THREE.BufferAttribute(colors, 3));
    geometry.setAttribute("size", new THREE.BufferAttribute(sizes, 1));
    const material = new THREE.ShaderMaterial({
      uniforms: {
        time: {
          value: 0
        },
        baseColor: {
          value: new THREE.Color(color)
        }
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
    const particles = new THREE.Points(geometry, material);
    scene.add(particles);
    particlesRef.current = particles;

    // Animation
    let animationFrameId: number;
    const animate = (time: number) => {
      if (!particles) return;
      material.uniforms.time.value = time / 1000;
      particles.rotation.x += 0.001;
      particles.rotation.y += 0.002;
      renderer.render(scene, camera);
      animationFrameId = requestAnimationFrame(animate);
    };
    animate(0);

    // Cleanup
    return () => {
      if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
      }
      if (renderer && containerRef.current) {
        containerRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
    };
  }, [color, type]);
  return <div ref={containerRef} className="absolute inset-0 -z-10" style={{
    pointerEvents: "none",
    opacity: type === "error" ? "0.85" : type === "warning" ? "0.8" : type === "success" ? "0.75" : "0.7"
  }} />;
};