import React, { useEffect, useRef, useState } from "react";

import { useTokenData } from "../../../contexts/TokenDataContext";

export const GradientWaves: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tokens, isConnected } = useTokenData();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();

  // Gradient waves configuration
  const waveGroups = useRef<any[]>([]);
  const lastUpdateTimeRef = useRef<number>(Date.now());

  // Initialize canvas and resize handler
  useEffect(() => {
    const updateDimensions = () => {
      setDimensions({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    };

    // Set initial dimensions
    updateDimensions();

    // Add resize listener
    window.addEventListener("resize", updateDimensions);

    return () => {
      window.removeEventListener("resize", updateDimensions);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, []);

  // Initialize wave groups based on token data
  useEffect(() => {
    if (!isConnected || !tokens.length) return;

    console.log("[GradientWaves] Initializing with token data");

    // Create wave groups based on categories of tokens
    const groups = [];

    // Group 1: Positive change tokens (green waves)
    const positiveTokens = tokens
      .filter((token) => parseFloat(token.change24h || "0") > 0)
      .slice(0, 5); // Limit to prevent performance issues

    if (positiveTokens.length) {
      groups.push({
        tokens: positiveTokens,
        baseColor: [0, 255, 120], // Green base
        opacity: 0.4,
        speed: 0.8,
        amplitude: 120,
        frequency: 0.005,
        phase: 0,
      });
    }

    // Group 2: Negative change tokens (red waves)
    const negativeTokens = tokens
      .filter((token) => parseFloat(token.change24h || "0") < 0)
      .slice(0, 5);

    if (negativeTokens.length) {
      groups.push({
        tokens: negativeTokens,
        baseColor: [255, 50, 80], // Red base
        opacity: 0.3,
        speed: 0.6,
        amplitude: 100,
        frequency: 0.006,
        phase: Math.PI / 2,
      });
    }

    // Group 3: High market cap tokens (blue waves)
    const highCapTokens = tokens
      .sort(
        (a, b) =>
          parseFloat(b.marketCap || "0") - parseFloat(a.marketCap || "0"),
      )
      .slice(0, 3);

    if (highCapTokens.length) {
      groups.push({
        tokens: highCapTokens,
        baseColor: [40, 100, 255], // Blue base
        opacity: 0.25,
        speed: 0.4,
        amplitude: 80,
        frequency: 0.004,
        phase: Math.PI,
      });
    }

    // Group 4: High volume tokens (purple waves)
    const highVolumeTokens = tokens
      .sort(
        (a, b) =>
          parseFloat(b.volume24h || "0") - parseFloat(a.volume24h || "0"),
      )
      .slice(0, 3);

    if (highVolumeTokens.length) {
      groups.push({
        tokens: highVolumeTokens,
        baseColor: [140, 70, 255], // Purple base
        opacity: 0.35,
        speed: 1.0,
        amplitude: 130,
        frequency: 0.007,
        phase: Math.PI * 1.5,
      });
    }

    waveGroups.current = groups;
  }, [tokens, isConnected]);

  // Animation loop
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const ctx = canvasRef.current.getContext("2d", {
      alpha: true,
      desynchronized: true, // Potential performance improvement
    });

    if (!ctx) return;

    const animate = () => {
      // Clear canvas with full transparency
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Calculate delta time for smooth animation
      const now = Date.now();
      const deltaTime = (now - lastUpdateTimeRef.current) / 1000;
      lastUpdateTimeRef.current = now;

      // Draw each wave group
      waveGroups.current.forEach((group) => {
        // Update phase based on speed and time
        group.phase += group.speed * deltaTime;

        // Set up gradient
        const gradient = ctx.createLinearGradient(
          0,
          0,
          dimensions.width,
          dimensions.height,
        );

        // Add color stops based on tokens in this group
        group.tokens.forEach((token: any, index: number) => {
          const position = index / (group.tokens.length - 1 || 1);
          const change = Math.abs(parseFloat(token.change24h || "0"));
          const intensity = Math.min(1, change / 20);

          // Customize color based on token properties
          const color = [...group.baseColor];

          // Adjust brightness based on token properties
          const brightnessFactor = 0.7 + intensity * 0.3;
          color[0] = Math.min(255, color[0] * brightnessFactor);
          color[1] = Math.min(255, color[1] * brightnessFactor);
          color[2] = Math.min(255, color[2] * brightnessFactor);

          gradient.addColorStop(
            position,
            `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${group.opacity})`,
          );
        });

        // Begin drawing wave path
        ctx.beginPath();
        ctx.moveTo(0, dimensions.height / 2);

        // Draw curved sine wave
        for (let x = 0; x < dimensions.width; x += 10) {
          const y =
            dimensions.height / 2 +
            Math.sin(x * group.frequency + group.phase) * group.amplitude;

          ctx.lineTo(x, y);
        }

        // Complete path to bottom corners
        ctx.lineTo(dimensions.width, dimensions.height);
        ctx.lineTo(0, dimensions.height);
        ctx.closePath();

        // Fill with gradient
        ctx.fillStyle = gradient;
        ctx.fill();
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [dimensions]);

  return (
    <canvas
      ref={canvasRef}
      width={dimensions.width}
      height={dimensions.height}
      className="absolute inset-0"
      style={{
        width: "100%",
        height: "100%",
        pointerEvents: "none",
        objectFit: "cover",
      }}
    />
  );
};
