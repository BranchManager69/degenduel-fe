import { Float, Text } from "@react-three/drei";
import { Canvas, extend, useFrame, useThree } from "@react-three/fiber";
import { Bloom, EffectComposer } from "@react-three/postprocessing";
import { AnimatePresence, motion, useAnimation } from "framer-motion";
import { KernelSize } from "postprocessing";
import React, { Suspense, useEffect, useMemo, useRef, useState } from "react";
import { FaPowerOff } from "react-icons/fa";
import * as THREE from "three";

import { User } from "../../types";

interface WebSocketService {
  name: string;
  status: "operational" | "degraded" | "error";
  metrics: {
    totalConnections: number;
    activeSubscriptions: number;
    messageCount: number;
    errorCount: number;
    cacheHitRate: number;
    averageLatency: number;
    lastUpdate: string;
  };
  performance: {
    messageRate: number;
    errorRate: number;
    latencyTrend: number[];
  };
  config?: {
    maxMessageSize: number;
    rateLimit: number;
    requireAuth: boolean;
  };
}

interface WebSocketCardProps {
  service: WebSocketService;
  onPowerAction?: () => void;
  isDisabled?: boolean;
  transitionType?:
    | "powerUp"
    | "powerDown"
    | "degrading"
    | "recovering"
    | "failing"
    | "healing";
}

type EffectTier =
  | "SUPERADMIN_DESKTOP" // Unique effects, not just maxed settings
  | "SUPERADMIN_MOBILE" // Mobile-optimized special effects
  | "DESKTOP_HIGH" // The max-performance tier
  | "DESKTOP_BALANCED" // Sweet spot for regular desktops
  | "DESKTOP_LITE" // Basic desktop/older laptops
  | "MOBILE_HIGH" // Flagship phones/tablets
  | "MOBILE_BALANCED" // Sweet spot for decent phones
  | "MOBILE_LITE"; // Basic/budget phones

const detectEffectTier = (user: User | null): EffectTier => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  const dpr = window.devicePixelRatio;
  const isMobile = width < 1024;

  // Super admin gets special effects based on device
  if (user?.is_superadmin) {
    return isMobile ? "SUPERADMIN_MOBILE" : "SUPERADMIN_DESKTOP";
  }

  // Mobile tiers
  if (isMobile) {
    if (dpr >= 3 && height >= 800) return "MOBILE_HIGH";
    if (dpr >= 2 && height >= 700) return "MOBILE_BALANCED";
    return "MOBILE_LITE";
  }

  // Desktop tiers
  if (width >= 1920 && height >= 1080 && dpr <= 2) return "DESKTOP_HIGH";
  if (width >= 1440 && height >= 900) return "DESKTOP_BALANCED";
  return "DESKTOP_LITE";
};

interface ShaderConfig {
  scanLines: number;
  noiseIntensity: number;
  specialEffects?: boolean;
}

interface TierConfig {
  particles: {
    primary: number;
    secondary: number;
  };
  bloom: {
    intensity: number;
    kernelSize: KernelSize;
  };
  dpr: number;
  height: number;
  shader: ShaderConfig;
  animations: string;
}

const effectConfigs: Record<EffectTier, TierConfig> = {
  SUPERADMIN_DESKTOP: {
    particles: { primary: 24, secondary: 0 },
    bloom: { intensity: 0.7, kernelSize: KernelSize.MEDIUM },
    dpr: 1.5,
    height: 36,
    shader: {
      scanLines: 30,
      noiseIntensity: 0.25,
      specialEffects: true, // Enables unique super admin effects
    },
    animations: "special",
  },

  SUPERADMIN_MOBILE: {
    particles: { primary: 16, secondary: 0 },
    bloom: { intensity: 0.4, kernelSize: KernelSize.SMALL },
    dpr: 1,
    height: 32,
    shader: {
      scanLines: 20,
      noiseIntensity: 0.2,
      specialEffects: true, // Mobile-optimized special effects
    },
    animations: "special-mobile",
  },

  DESKTOP_HIGH: {
    particles: { primary: 32, secondary: 24 },
    bloom: { intensity: 1.0, kernelSize: KernelSize.LARGE },
    dpr: 2,
    height: 40,
    shader: {
      scanLines: 50,
      noiseIntensity: 0.35,
      specialEffects: false,
    },
    animations: "ultra",
  },

  DESKTOP_BALANCED: {
    particles: { primary: 24, secondary: 0 },
    bloom: { intensity: 0.6, kernelSize: KernelSize.MEDIUM },
    dpr: 1.25,
    height: 32,
    shader: {
      scanLines: 30,
      noiseIntensity: 0.25,
      specialEffects: false,
    },
    animations: "balanced",
  },

  DESKTOP_LITE: {
    particles: { primary: 16, secondary: 0 },
    bloom: { intensity: 0.4, kernelSize: KernelSize.SMALL },
    dpr: 1,
    height: 28,
    shader: {
      scanLines: 20,
      noiseIntensity: 0.2,
      specialEffects: false,
    },
    animations: "lite",
  },

  MOBILE_HIGH: {
    particles: { primary: 16, secondary: 0 },
    bloom: { intensity: 0.4, kernelSize: KernelSize.SMALL },
    dpr: 1,
    height: 32,
    shader: {
      scanLines: 20,
      noiseIntensity: 0.2,
      specialEffects: false,
    },
    animations: "mobile-high",
  },

  MOBILE_BALANCED: {
    particles: { primary: 12, secondary: 0 },
    bloom: { intensity: 0.3, kernelSize: KernelSize.SMALL },
    dpr: 1,
    height: 28,
    shader: {
      scanLines: 15,
      noiseIntensity: 0.15,
      specialEffects: false,
    },
    animations: "mobile-balanced",
  },

  MOBILE_LITE: {
    particles: { primary: 8, secondary: 0 },
    bloom: { intensity: 0.2, kernelSize: KernelSize.SMALL },
    dpr: 1,
    height: 24,
    shader: {
      scanLines: 10,
      noiseIntensity: 0.1,
      specialEffects: false,
    },
    animations: "mobile-lite",
  },
};

const ParticleField: React.FC<{ status: string; intensity: number }> = ({
  status,
  intensity,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const particles = useRef<
    Array<{ x: number; y: number; vx: number; vy: number; size: number }>
  >([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const getColor = () => {
      switch (status) {
        case "operational":
          return "rgba(34, 197, 94, 0.6)";
        case "degraded":
          return "rgba(234, 179, 8, 0.6)";
        case "error":
          return "rgba(239, 68, 68, 0.6)";
        default:
          return "rgba(148, 163, 184, 0.6)";
      }
    };

    // Initialize particles
    const particleCount = Math.floor(intensity * 50);
    particles.current = Array.from({ length: particleCount }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * 2,
      vy: (Math.random() - 0.5) * 2,
      size: Math.random() * 3 + 1,
    }));

    let animationFrame: number;

    const animate = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.current.forEach((particle) => {
        // Update
        particle.x += particle.vx;
        particle.y += particle.vy;

        // Bounce off walls
        if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1;
        if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1;

        // Draw
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
        ctx.fillStyle = getColor();
        ctx.fill();
      });

      animationFrame = requestAnimationFrame(animate);
    };

    animate();

    return () => cancelAnimationFrame(animationFrame);
  }, [status, intensity]);

  return (
    <canvas
      ref={canvasRef}
      className="absolute inset-0 w-full h-full pointer-events-none"
      style={{ opacity: 0.5 }}
    />
  );
};

const MetricOrb: React.FC<{
  label: string;
  value: string | number;
  color: string;
  size?: "small" | "medium" | "large";
}> = ({ label, value, color, size = "medium" }) => {
  const sizeClasses = {
    small: "w-16 h-16",
    medium: "w-20 h-20",
    large: "w-24 h-24",
  };

  const orbVariants = {
    initial: { scale: 0 },
    animate: {
      scale: 1,
      transition: { type: "spring", bounce: 0.5 },
    },
  };

  return (
    <motion.div
      className={`relative ${sizeClasses[size]} flex items-center justify-center rounded-full`}
      variants={orbVariants}
      initial="initial"
      animate="animate"
    >
      <motion.div
        className="absolute inset-0 rounded-full"
        style={{ backgroundColor: color, opacity: 0.1 }}
        animate={{
          scale: [1, 1.1, 1],
          opacity: [0.1, 0.2, 0.1],
        }}
        transition={{
          duration: 2,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      />
      <div className="text-center">
        <div className="text-sm font-medium text-gray-300">{value}</div>
        <div className="text-xs text-gray-400">{label}</div>
      </div>
    </motion.div>
  );
};

// Energy Wave Effect
const EnergyWave: React.FC<{
  color: string;
  type: "success" | "error" | "warning";
}> = ({ color, type }) => {
  const waveVariants = {
    success: {
      scale: [0, 1.5],
      opacity: [0.8, 0],
      transition: { duration: 1.5, ease: "easeOut" },
    },
    error: {
      scale: [0, 1.2, 1.5],
      opacity: [0.8, 0.4, 0],
      transition: { duration: 1, ease: "easeInOut" },
    },
    warning: {
      scale: [1, 1.3, 1],
      opacity: [0.5, 0.2, 0],
      transition: { duration: 2, ease: "easeInOut", repeat: 2 },
    },
  };

  return (
    <motion.div
      className="absolute inset-0 rounded-xl"
      style={{ border: `2px solid ${color}`, zIndex: 1 }}
      initial={{ scale: 0, opacity: 0 }}
      animate={waveVariants[type]}
    />
  );
};

// Custom shader for holographic effect
const HologramShader = {
  uniforms: {
    time: { value: 0 },
    color: { value: new THREE.Color() },
    scanLineWidth: { value: 0.5 },
    scanLineSpeed: { value: 1.0 },
    noiseIntensity: { value: 0.25 },
  },
  vertexShader: `
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;
    void main() {
      vUv = uv;
      vNormal = normal;
      vPosition = position;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float time;
    uniform vec3 color;
    uniform float scanLineWidth;
    uniform float scanLineSpeed;
    uniform float noiseIntensity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      // Holographic base
      float opacity = 0.3 + 0.2 * sin(vPosition.y * 10.0 + time);
      
      // Scan lines
      float scanLine = step(scanLineWidth, fract(vUv.y * 50.0 + time * scanLineSpeed));
      
      // Edge glow
      float edge = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
      
      // Noise
      float noise = random(vUv + time * 0.1) * noiseIntensity;
      
      // Fresnel effect
      float fresnel = pow(1.0 + dot(normalize(vNormal), normalize(vPosition)), 2.0);
      
      vec3 finalColor = mix(color, color * 2.0, edge);
      finalColor += vec3(noise);
      
      gl_FragColor = vec4(finalColor, opacity * scanLine * (1.0 + fresnel * 0.5));
    }
  `,
};

// Register the custom shader
extend({ HologramMaterial: THREE.ShaderMaterial.bind(null, HologramShader) });

// Optimized particle system for orbiting elements
const OrbitingParticles: React.FC<{ color: string; count: number }> = ({
  color,
  count,
}) => {
  const positions = useMemo(() => {
    const temp = [];
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2;
      temp.push(Math.cos(angle) * 1.2, Math.sin(angle) * 1.2, 0);
    }
    return new Float32Array(temp);
  }, [count]);

  const particleRef = useRef<THREE.Points>(null);

  useFrame(({ clock }) => {
    if (particleRef.current) {
      particleRef.current.rotation.z = clock.getElapsedTime() * 0.2;
    }
  });

  return (
    <points ref={particleRef}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={positions.length / 3}
          array={positions}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.05}
        color={color}
        transparent
        opacity={0.6}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
};

// Enhanced shader for super admin special effects
const SuperAdminHologramShader = {
  ...HologramShader,
  uniforms: {
    ...HologramShader.uniforms,
    pulseTime: { value: 0 },
    dataFlow: { value: 0 },
  },
  fragmentShader: `
    uniform float time;
    uniform float pulseTime;
    uniform float dataFlow;
    uniform vec3 color;
    uniform float scanLineWidth;
    uniform float scanLineSpeed;
    uniform float noiseIntensity;
    varying vec2 vUv;
    varying vec3 vNormal;
    varying vec3 vPosition;

    float random(vec2 st) {
      return fract(sin(dot(st.xy, vec2(12.9898,78.233))) * 43758.5453123);
    }

    void main() {
      // Enhanced holographic base with data flow effect
      float opacity = 0.3 + 0.2 * sin(vPosition.y * 10.0 + time);
      opacity += 0.1 * sin(vPosition.x * 15.0 + dataFlow * time);
      
      // Advanced scan lines with pulse
      float scanLine = step(scanLineWidth, fract(vUv.y * 50.0 + time * scanLineSpeed));
      scanLine *= 1.0 + 0.2 * sin(pulseTime + vUv.y * 20.0);
      
      // Enhanced edge glow
      float edge = pow(1.0 - abs(dot(vNormal, vec3(0.0, 0.0, 1.0))), 3.0);
      edge *= 1.0 + 0.3 * sin(time * 2.0);
      
      // Reactive noise
      float noise = random(vUv + time * 0.1) * noiseIntensity;
      noise *= 1.0 + 0.5 * sin(pulseTime);
      
      // Enhanced fresnel
      float fresnel = pow(1.0 + dot(normalize(vNormal), normalize(vPosition)), 2.0);
      fresnel *= 1.0 + 0.2 * sin(time * 3.0);
      
      vec3 finalColor = mix(color, color * 2.0, edge);
      finalColor += vec3(noise);
      finalColor *= 1.0 + 0.1 * sin(dataFlow * time);
      
      gl_FragColor = vec4(finalColor, opacity * scanLine * (1.0 + fresnel * 0.5));
    }
  `,
};

// Register the enhanced shader
extend({
  SuperAdminHologramMaterial: THREE.ShaderMaterial.bind(
    null,
    SuperAdminHologramShader,
  ),
});

// Update HologramScene to handle special effects
const HologramScene: React.FC<{
  label: string;
  value: string | number;
  color: string;
  config: TierConfig;
}> = ({ label, value, color, config }) => {
  const {} = useThree();
  const hologramRef = useRef<THREE.Group>(null);
  const materialRef = useRef<THREE.ShaderMaterial>(null);

  useFrame(({ clock }) => {
    if (materialRef.current) {
      materialRef.current.uniforms.time.value = clock.getElapsedTime();

      // Special effects for super admin
      if (config.shader.specialEffects) {
        materialRef.current.uniforms.pulseTime.value =
          clock.getElapsedTime() * 2;
        materialRef.current.uniforms.dataFlow.value = Math.sin(
          clock.getElapsedTime() * 0.5,
        );
      }
    }
    if (hologramRef.current) {
      const t = clock.getElapsedTime();
      hologramRef.current.rotation.y = Math.sin(t * 0.5) * 0.2;
      hologramRef.current.rotation.z = Math.cos(t * 0.3) * 0.1;

      // Special rotation for super admin
      if (config.shader.specialEffects) {
        hologramRef.current.rotation.x = Math.sin(t * 0.2) * 0.05;
      }
    }
  });

  return (
    <>
      <Float
        speed={config.shader.specialEffects ? 3 : 2}
        rotationIntensity={config.shader.specialEffects ? 1 : 0.5}
        floatIntensity={config.shader.specialEffects ? 2 : 1}
        floatingRange={config.shader.specialEffects ? [-0.2, 0.2] : [-0.1, 0.1]}
      >
        <group ref={hologramRef}>
          <mesh>
            <cylinderGeometry
              args={[1, 1, 0.1, config.shader.scanLines, 1, true]}
            />
            {config.shader.specialEffects ? (
              // @ts-ignore - Custom shader material
              <superAdminHologramMaterial
                ref={materialRef}
                transparent
                side={THREE.DoubleSide}
                uniforms-color-value={new THREE.Color(color)}
                uniforms-scanLineWidth-value={0.5}
                uniforms-scanLineSpeed-value={2.0}
                uniforms-noiseIntensity-value={config.shader.noiseIntensity}
              />
            ) : (
              // @ts-ignore - Custom shader material
              <hologramMaterial
                ref={materialRef}
                transparent
                side={THREE.DoubleSide}
                uniforms-color-value={new THREE.Color(color)}
                uniforms-scanLineWidth-value={0.5}
                uniforms-scanLineSpeed-value={2.0}
                uniforms-noiseIntensity-value={config.shader.noiseIntensity}
              />
            )}
          </mesh>

          <Text
            position={[0, 0, 0]}
            fontSize={0.5}
            color={color}
            anchorX="center"
            anchorY="middle"
            maxWidth={2}
            outlineWidth={config.shader.specialEffects ? 0.05 : 0.02}
            outlineColor="#000000"
          >
            {value.toString()}
          </Text>

          <Text
            position={[0, -0.4, 0]}
            fontSize={0.2}
            color={color}
            anchorX="center"
            anchorY="middle"
            maxWidth={2}
            outlineWidth={0.02}
            outlineColor="#000000"
          >
            {label}
          </Text>

          <OrbitingParticles color={color} count={config.particles.primary} />

          {config.particles.secondary > 0 && (
            <group rotation={[Math.PI / 4, 0, 0]}>
              <OrbitingParticles
                color={color}
                count={config.particles.secondary}
              />
            </group>
          )}
        </group>
      </Float>

      <EffectComposer>
        <Bloom
          intensity={config.bloom.intensity}
          kernelSize={config.bloom.kernelSize}
          luminanceThreshold={0.2}
          luminanceSmoothing={0.4}
        />
      </EffectComposer>
    </>
  );
};

// Update HolographicMetric to use new config system
const HolographicMetric: React.FC<{
  label: string;
  value: string | number;
  color: string;
  user: User | null;
}> = ({ label, value, color, user }) => {
  const [hasWebGL, setHasWebGL] = useState(true);
  const tier = detectEffectTier(user);
  const config = effectConfigs[tier];

  useEffect(() => {
    try {
      const canvas = document.createElement("canvas");
      const gl = canvas.getContext("webgl2") || canvas.getContext("webgl");
      setHasWebGL(!!gl);
    } catch (e) {
      setHasWebGL(false);
    }
  }, []);

  if (!hasWebGL) {
    return <MetricOrb label={label} value={value} color={color} size="large" />;
  }

  return (
    <div className={`relative w-full h-${config.height}`}>
      <Canvas camera={{ position: [0, 0, 5], fov: 45 }} dpr={config.dpr}>
        <Suspense fallback={null}>
          <ambientLight intensity={0.7} />
          <pointLight position={[10, 10, 10]} intensity={1.5} />
          <HologramScene
            label={label}
            value={value}
            color={color}
            config={config}
          />
        </Suspense>
      </Canvas>
    </div>
  );
};

// Helper function to format time difference
const formatTimeDiff = (dateStr: string): string => {
  const diff = Date.now() - new Date(dateStr).getTime();
  const seconds = Math.floor(diff / 1000);
  const minutes = Math.floor(seconds / 60);

  if (minutes > 0) {
    return `${minutes}m ago`;
  }
  return `${seconds}s ago`;
};

const getStatusColor = (status: string) => {
  switch (status) {
    case "operational":
      return "rgb(34, 197, 94)";
    case "degraded":
      return "rgb(234, 179, 8)";
    case "error":
      return "rgb(239, 68, 68)";
    default:
      return "rgb(148, 163, 184)";
  }
};

export const WebSocketCard: React.FC<WebSocketCardProps> = ({
  service,
  onPowerAction,
  isDisabled,
  transitionType,
}) => {
  const controls = useAnimation();
  const [transitioning, setTransitioning] = useState(false);
  const [showEnergyWave, setShowEnergyWave] = useState(false);
  const [waveType, setWaveType] = useState<"success" | "error" | "warning">(
    "success",
  );

  useEffect(() => {
    if (transitionType) {
      setTransitioning(true);
      setShowEnergyWave(true);

      // Set wave type based on transition
      switch (transitionType) {
        case "powerUp":
        case "healing":
          setWaveType("success");
          break;
        case "powerDown":
        case "failing":
          setWaveType("error");
          break;
        case "degrading":
        case "recovering":
          setWaveType("warning");
          break;
      }

      // Sequence of animations
      controls.start("transition").then(() => {
        setTimeout(() => {
          setShowEnergyWave(false);
          setTransitioning(false);
        }, 2000);
      });
    }
  }, [transitionType, controls]);

  const cardVariants = {
    initial: { scale: 0.95, opacity: 0 },
    normal: { scale: 1, opacity: 1 },
    transition: {
      scale: [1, 1.05, 0.95, 1],
      rotate: [0, 2, -2, 0],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
      },
    },
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-dark-800/50 backdrop-blur-sm"
      variants={cardVariants}
      initial="initial"
      animate={transitioning ? "transition" : "normal"}
      style={{
        boxShadow: `0 0 20px ${getStatusColor(service.status)}33`,
        border: `1px solid ${getStatusColor(service.status)}33`,
      }}
    >
      <ParticleField
        status={service.status}
        intensity={transitioning ? 2 : service.performance.messageRate / 100}
      />

      <AnimatePresence>
        {showEnergyWave && (
          <EnergyWave color={getStatusColor(service.status)} type={waveType} />
        )}
      </AnimatePresence>

      <div className="relative z-10 p-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center space-x-3">
            <motion.div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: getStatusColor(service.status) }}
              animate={{
                scale: [1, 1.2, 1],
                opacity: [1, 0.7, 1],
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />
            <motion.h3
              className="text-xl font-bold text-gray-100 font-display"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              style={{
                fontFamily: "'Space Grotesk', sans-serif",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {service.name.replace(" WebSocket", "")}
            </motion.h3>
          </div>
          <span className="text-xs text-gray-400 whitespace-nowrap">
            {formatTimeDiff(service.metrics.lastUpdate)}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-4 mb-6">
          <HolographicMetric
            label="Msg/s"
            value={service.performance.messageRate}
            color={getStatusColor(service.status)}
            user={null}
          />
          <HolographicMetric
            label="Error %"
            value={service.performance.errorRate}
            color={
              service.performance.errorRate > 5
                ? getStatusColor("error")
                : getStatusColor(service.status)
            }
            user={null}
          />
          <HolographicMetric
            label="Latency"
            value={`${service.metrics.averageLatency}ms`}
            color={
              service.metrics.averageLatency > 1000
                ? getStatusColor("error")
                : getStatusColor(service.status)
            }
            user={null}
          />
        </div>

        <div className="flex justify-end">
          <motion.button
            onClick={onPowerAction}
            disabled={isDisabled}
            className={`relative w-12 h-12 rounded-full transition-all duration-300 ${
              isDisabled
                ? "opacity-50 cursor-not-allowed"
                : "cursor-pointer hover:scale-110"
            }`}
            style={{ backgroundColor: `${getStatusColor(service.status)}33` }}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
          >
            <FaPowerOff
              className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-6 h-6"
              style={{ color: getStatusColor(service.status) }}
            />
          </motion.button>
        </div>
      </div>
    </motion.div>
  );
};
