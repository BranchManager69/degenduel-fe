import React, { useEffect, useRef, useState } from "react";

import { useTokenData } from "../../../contexts/TokenDataContext";

export const AbstractPatterns: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const { tokens, isConnected } = useTokenData();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);

  // Pattern generation parameters
  const patternsRef = useRef<{
    segments: {
      startPoint: [number, number];
      endPoint: [number, number];
      thickness: number;
      color: [number, number, number, number];
      speed: number;
      phase: number;
      amplitude: number;
    }[];
    circles: {
      center: [number, number];
      radius: number;
      color: [number, number, number, number];
      pulseFactor: number;
      pulseSpeed: number;
      phase: number;
    }[];
    triangles: {
      points: [[number, number], [number, number], [number, number]];
      color: [number, number, number, number];
      rotationSpeed: number;
      pulseFactor: number;
      phase: number;
    }[];
  }>({
    segments: [],
    circles: [],
    triangles: [],
  });

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

  // Process token data into abstract pattern elements
  useEffect(() => {
    if (!isConnected || !tokens.length) return;

    console.log("[AbstractPatterns] Initializing with token data");

    // Group tokens into positive and negative performers
    const positiveTokens = tokens
      .filter((token) => parseFloat(token.change24h?.toString() || "0") > 0)
      .slice(0, 8); // Limit to prevent performance issues

    const negativeTokens = tokens
      .filter((token) => parseFloat(token.change24h?.toString() || "0") < 0)
      .slice(0, 8);

    // Get tokens by market cap
    const highCapTokens = [...tokens]
      .sort(
        (a, b) =>
          parseFloat(b.marketCap?.toString() || "0") -
          parseFloat(a.marketCap?.toString() || "0"),
      )
      .slice(0, 5);

    // Initialize pattern elements
    const segments = [];
    const circles = [];
    const triangles = [];

    // Create segments based on positive tokens
    for (let i = 0; i < positiveTokens.length; i++) {
      const token = positiveTokens[i];
      const change = parseFloat(token.change24h?.toString() || "0");
      const angle = (i / positiveTokens.length) * Math.PI * 2;

      // Determine color intensity based on change percentage
      const intensityFactor = Math.min(1, Math.abs(change) / 20);
      const alpha = 0.5 + intensityFactor * 0.5;

      // Create a segment
      segments.push({
        startPoint: [dimensions.width / 2, dimensions.height / 2],
        endPoint: [
          dimensions.width / 2 + Math.cos(angle) * dimensions.width * 0.4,
          dimensions.height / 2 + Math.sin(angle) * dimensions.height * 0.4,
        ],
        thickness: 2 + change * 0.5,
        color: [0, 255, 100, alpha], // Green for positive
        speed: 0.5 + change * 0.1,
        phase: angle,
        amplitude: 20 + change * 5,
      });
    }

    // Create segments based on negative tokens
    for (let i = 0; i < negativeTokens.length; i++) {
      const token = negativeTokens[i];
      const change = parseFloat(token.change24h?.toString() || "0");
      const angle = (i / negativeTokens.length) * Math.PI * 2;

      // Determine color intensity
      const intensityFactor = Math.min(1, Math.abs(change) / 20);
      const alpha = 0.5 + intensityFactor * 0.5;

      // Create a segment
      segments.push({
        startPoint: [dimensions.width / 2, dimensions.height / 2],
        endPoint: [
          dimensions.width / 2 +
            Math.cos(angle + Math.PI) * dimensions.width * 0.4,
          dimensions.height / 2 +
            Math.sin(angle + Math.PI) * dimensions.height * 0.4,
        ],
        thickness: 2 + Math.abs(change) * 0.5,
        color: [255, 40, 80, alpha], // Red for negative
        speed: 0.5 + Math.abs(change) * 0.1,
        phase: angle,
        amplitude: 20 + Math.abs(change) * 5,
      });
    }

    // Create circles based on high cap tokens
    for (let i = 0; i < highCapTokens.length; i++) {
      const token = highCapTokens[i];
      const marketCap = parseFloat(token.marketCap?.toString() || "0");
      const change = parseFloat(token.change24h?.toString() || "0");
      const angle = (i / highCapTokens.length) * Math.PI * 2;

      // Circle position on a ring around center
      const distance = dimensions.width * 0.25;
      const centerX = dimensions.width / 2 + Math.cos(angle) * distance;
      const centerY = dimensions.height / 2 + Math.sin(angle) * distance;

      // Size based on market cap
      const radiusFactor = Math.log10(marketCap) / 12;
      const radius = Math.max(
        20,
        Math.min(100, dimensions.width * 0.05 * radiusFactor),
      );

      // Color based on change
      let color: [number, number, number, number];
      if (change > 0) {
        const intensity = Math.min(1, change / 10);
        color = [0, 200 + intensity * 55, 100 + intensity * 155, 0.6];
      } else {
        const intensity = Math.min(1, Math.abs(change) / 10);
        color = [
          200 + intensity * 55,
          30 + intensity * 25,
          60 + intensity * 20,
          0.6,
        ];
      }

      // Pulse properties based on trading activity
      const volume = parseFloat(token.volume24h?.toString() || "0");
      const volumeToMarketCap = volume / marketCap;
      const pulseSpeed = 0.5 + volumeToMarketCap * 10;

      circles.push({
        center: [centerX, centerY],
        radius,
        color,
        pulseFactor: 0.2 + volumeToMarketCap * 2,
        pulseSpeed,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Create triangles using the remaining token data
    const remainingTokens = tokens
      .filter((token) => !highCapTokens.includes(token))
      .slice(0, 6);

    for (let i = 0; i < remainingTokens.length; i++) {
      const token = remainingTokens[i];
      const change = parseFloat(token.change24h?.toString() || "0");
      const marketCap = parseFloat(token.marketCap?.toString() || "0");

      // Position around the outer edges
      const angle = (i / remainingTokens.length) * Math.PI * 2;
      const distanceFactor = 0.35 + Math.random() * 0.1;
      const centerX =
        dimensions.width / 2 +
        Math.cos(angle) * dimensions.width * distanceFactor;
      const centerY =
        dimensions.height / 2 +
        Math.sin(angle) * dimensions.height * distanceFactor;

      // Size based on market cap
      const sizeFactor = Math.log10(marketCap) / 12;
      const size = Math.max(
        30,
        Math.min(120, dimensions.width * 0.05 * sizeFactor),
      );

      // Create triangle points
      const triangleAngle = Math.random() * Math.PI * 2;
      const points: [[number, number], [number, number], [number, number]] = [
        [
          centerX + Math.cos(triangleAngle) * size,
          centerY + Math.sin(triangleAngle) * size,
        ],
        [
          centerX + Math.cos(triangleAngle + (Math.PI * 2) / 3) * size,
          centerY + Math.sin(triangleAngle + (Math.PI * 2) / 3) * size,
        ],
        [
          centerX + Math.cos(triangleAngle + (Math.PI * 4) / 3) * size,
          centerY + Math.sin(triangleAngle + (Math.PI * 4) / 3) * size,
        ],
      ];

      // Color based on change direction and intensity
      let color: [number, number, number, number];
      const absChange = Math.abs(change);

      if (change > 5) {
        // Strong positive
        color = [100, 255, 150, 0.7];
      } else if (change > 0) {
        // Moderate positive
        color = [150, 200, 255, 0.7];
      } else if (change > -5) {
        // Moderate negative
        color = [255, 150, 100, 0.7];
      } else {
        // Strong negative
        color = [255, 50, 100, 0.7];
      }

      triangles.push({
        points,
        color,
        rotationSpeed: 0.1 + absChange * 0.02,
        pulseFactor: 0.1 + absChange * 0.05,
        phase: Math.random() * Math.PI * 2,
      });
    }

    // Update ref with all pattern elements
    patternsRef.current = {
      segments: segments as any,
      circles: circles as any,
      triangles,
    };
  }, [tokens, isConnected, dimensions]);

  // Animation and rendering
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const ctx = canvasRef.current.getContext("2d", {
      alpha: true,
      desynchronized: true, // Potential performance improvement
    });

    if (!ctx) return;

    // Helper to draw a wavy line between two points
    const drawWavyLine = (
      startX: number,
      startY: number,
      endX: number,
      endY: number,
      thickness: number,
      color: [number, number, number, number],
      phase: number,
      amplitude: number,
    ) => {
      const distance = Math.sqrt(
        Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2),
      );
      const steps = Math.max(10, Math.floor(distance / 5));

      // Calculate direction vector
      const dirX = (endX - startX) / distance;
      const dirY = (endY - startY) / distance;

      // Calculate perpendicular vector for wave movement
      const perpX = -dirY;
      const perpY = dirX;

      ctx.beginPath();

      // Draw wave as a path
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const baseX = startX + (endX - startX) * t;
        const baseY = startY + (endY - startY) * t;

        // Add wave displacement
        const waveAmplitude = amplitude * Math.sin(phase + t * Math.PI * 5);
        const x = baseX + perpX * waveAmplitude;
        const y = baseY + perpY * waveAmplitude;

        if (i === 0) {
          ctx.moveTo(x, y);
        } else {
          ctx.lineTo(x, y);
        }
      }

      // Set line properties
      ctx.strokeStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
      ctx.lineWidth = thickness;
      ctx.lineCap = "round";
      ctx.stroke();
    };

    // Draw a pulsing circle
    const drawPulsingCircle = (
      centerX: number,
      centerY: number,
      baseRadius: number,
      color: [number, number, number, number],
      pulseFactor: number,
      phase: number,
    ) => {
      // Calculate current radius with pulse
      const radius = baseRadius * (1 + Math.sin(phase) * pulseFactor);

      // Draw the circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3] * (0.7 + Math.sin(phase) * 0.3)})`;
      ctx.fill();
    };

    // Draw a rotating/pulsing triangle
    const drawAnimatedTriangle = (
      points: [[number, number], [number, number], [number, number]],
      color: [number, number, number, number],
      phase: number,
      pulseFactor: number,
    ) => {
      // Calculate center point
      const centerX = (points[0][0] + points[1][0] + points[2][0]) / 3;
      const centerY = (points[0][1] + points[1][1] + points[2][1]) / 3;

      // Draw the triangle with rotation and pulse
      ctx.beginPath();

      for (let i = 0; i < 3; i++) {
        const point = points[i];

        // Calculate vector from center to point
        const vx = point[0] - centerX;
        const vy = point[1] - centerY;

        // Calculate distance and apply pulse
        const distance = Math.sqrt(vx * vx + vy * vy);
        const pulsedDistance = distance * (1 + Math.sin(phase) * pulseFactor);

        // Apply rotation
        const angle = Math.atan2(vy, vx) + phase;
        const newX = centerX + Math.cos(angle) * pulsedDistance;
        const newY = centerY + Math.sin(angle) * pulsedDistance;

        if (i === 0) {
          ctx.moveTo(newX, newY);
        } else {
          ctx.lineTo(newX, newY);
        }
      }

      ctx.closePath();
      ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${color[3]})`;
      ctx.fill();
    };

    // Main animation loop
    const animate = () => {
      // Calculate delta time for smooth animation
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Draw all pattern elements
      const { segments, circles, triangles } = patternsRef.current;

      // Draw segments (wavy lines)
      segments.forEach((segment) => {
        // Update phase
        segment.phase += segment.speed * deltaTime;

        // Draw wavy line
        drawWavyLine(
          segment.startPoint[0],
          segment.startPoint[1],
          segment.endPoint[0],
          segment.endPoint[1],
          segment.thickness,
          segment.color,
          segment.phase,
          segment.amplitude,
        );
      });

      // Draw circles
      circles.forEach((circle) => {
        // Update phase
        circle.phase += circle.pulseSpeed * deltaTime;

        // Draw pulsing circle
        drawPulsingCircle(
          circle.center[0],
          circle.center[1],
          circle.radius,
          circle.color,
          circle.pulseFactor,
          circle.phase,
        );
      });

      // Draw triangles
      triangles.forEach((triangle) => {
        // Update phase
        triangle.phase += triangle.rotationSpeed * deltaTime;

        // Draw animated triangle
        drawAnimatedTriangle(
          triangle.points,
          triangle.color,
          triangle.phase,
          triangle.pulseFactor,
        );
      });

      // Request next frame
      animationRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationRef.current = requestAnimationFrame(animate);

    // Cleanup
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
