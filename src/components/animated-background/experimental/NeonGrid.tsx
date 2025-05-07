import React, { useEffect, useRef, useState } from "react";

import { useTokenData } from "../../../contexts/TokenDataContext";

export const NeonGrid: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const { tokens, isConnected } = useTokenData();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });

  // Grid and token node configuration
  const gridRef = useRef<{
    horizontalLines: {
      y: number;
      color: string;
      width: number;
      glow: number;
      speed: number;
    }[];
    verticalLines: {
      x: number;
      color: string;
      width: number;
      glow: number;
      speed: number;
    }[];
    nodes: {
      x: number;
      y: number;
      size: number;
      color: string;
      glow: number;
      pulseSpeed: number;
      phase: number;
      symbol: string;
      directed: boolean;
      targetX?: number;
      targetY?: number;
      speed?: number;
    }[];
  }>({
    horizontalLines: [],
    verticalLines: [],
    nodes: [],
  });

  const glowFilterRef = useRef<string>(""); // CSS filter string for neon glow effect

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
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
    };
  }, []);

  // Initialize grid elements (static grid with dynamic nodes)
  useEffect(() => {
    // Create grid lines
    const horizontalLines = [];
    const verticalLines = [];

    // Create horizontal grid lines
    const horizontalCount = 12;
    const horizontalSpacing = dimensions.height / (horizontalCount - 1);

    for (let i = 0; i < horizontalCount; i++) {
      horizontalLines.push({
        y: i * horizontalSpacing,
        color: "#0066ff", // Blue color for horizontal
        width: i % 4 === 0 ? 2 : 1,
        glow: i % 4 === 0 ? 8 : 4,
        speed: 0, // Static lines
      });
    }

    // Create vertical grid lines
    const verticalCount = 20;
    const verticalSpacing = dimensions.width / (verticalCount - 1);

    for (let i = 0; i < verticalCount; i++) {
      verticalLines.push({
        x: i * verticalSpacing,
        color: "#0066ff", // Blue color for vertical
        width: i % 5 === 0 ? 2 : 1,
        glow: i % 5 === 0 ? 8 : 4,
        speed: 0, // Static lines
      });
    }

    // Create CSS glow filter string
    glowFilterRef.current = `
      drop-shadow(0 0 2px rgba(0, 102, 255, 0.7))
      drop-shadow(0 0 4px rgba(0, 102, 255, 0.5))
      drop-shadow(0 0 6px rgba(0, 102, 255, 0.3))
    `;

    // Save initial grid
    gridRef.current = {
      horizontalLines,
      verticalLines,
      nodes: [],
    };
  }, [dimensions]);

  // Process token data into grid nodes
  useEffect(() => {
    if (!isConnected || !tokens.length) return;

    console.log("[NeonGrid] Initializing with token data");

    // Sort tokens by market cap
    const sortedTokens = [...tokens]
      .sort(
        (a, b) =>
          parseFloat(b.marketCap?.toString() || "0") -
          parseFloat(a.marketCap?.toString() || "0"),
      )
      .slice(0, 15); // Limit to top 15 tokens

    // Create nodes for each token
    const nodes = sortedTokens.map((token) => {
      // Get token properties
      const marketCap = parseFloat(token.marketCap?.toString() || "0");

      // Calculate size based on market cap
      const sizeFactor = Math.log10(marketCap) / 12;
      const size = Math.max(15, Math.min(30, sizeFactor * 50));

      // Only use changesJson for dynamic animations if available, or fallback to 24h change
      const change5m = token.changesJson?.m5 || parseFloat(token.change24h?.toString() || "0") / 10 || 0;

      // Base color purely on 5m change
      let color;
      if (change5m > 1) {
        // Strong positive in short term
        color = "#00ff88"; // Bright green
      } else if (change5m > 0) {
        // Moderate positive in short term
        color = "#00ccff"; // Cyan
      } else if (change5m > -1) {
        // Moderate negative in short term
        color = "#ff44aa"; // Pink
      } else {
        // Strong negative in short term
        color = "#ff0044"; // Red
      }

      // Random position on grid
      const randomGridX = Math.floor(
        Math.random() * gridRef.current.verticalLines.length,
      );
      const randomGridY = Math.floor(
        Math.random() * gridRef.current.horizontalLines.length,
      );

      const x = gridRef.current.verticalLines[randomGridX].x;
      const y = gridRef.current.horizontalLines[randomGridY].y;

      // Determine if node should move
      const directed = Math.random() > 0.5;

      // For directed nodes, pick a random target intersection
      let targetX, targetY, speed;
      if (directed) {
        const targetGridX = Math.floor(
          Math.random() * gridRef.current.verticalLines.length,
        );
        const targetGridY = Math.floor(
          Math.random() * gridRef.current.horizontalLines.length,
        );
        targetX = gridRef.current.verticalLines[targetGridX].x;
        targetY = gridRef.current.horizontalLines[targetGridY].y;

        // Speed based on token volume
        const volume = parseFloat(token.volume24h?.toString() || "0");
        const volumeToMarketCapRatio = volume / marketCap;
        speed = Math.max(5, Math.min(40, volumeToMarketCapRatio * 100));
      }

      // Pulse speed based on change percentage
      const pulseSpeed = 1 + Math.abs(change5m) * 0.2;

      return {
        x,
        y,
        size,
        color,
        glow: 10 + Math.abs(change5m),
        pulseSpeed,
        phase: Math.random() * Math.PI * 2,
        symbol: token.symbol,
        directed,
        targetX,
        targetY,
        speed,
      };
    });

    // Update grid with nodes
    gridRef.current = {
      ...gridRef.current,
      nodes,
    };
  }, [tokens, isConnected]);

  // Main rendering and animation loop
  useEffect(() => {
    if (!canvasRef.current || !dimensions.width || !dimensions.height) return;

    const ctx = canvasRef.current.getContext("2d", {
      alpha: true,
      desynchronized: true, // Potential performance improvement
    });

    if (!ctx) return;

    // Helper to draw neon line
    const drawNeonLine = (
      x1: number,
      y1: number,
      x2: number,
      y2: number,
      color: string,
      width: number,
      glow: number,
    ) => {
      // Draw line with glow effect
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.strokeStyle = color;
      ctx.lineWidth = width;
      ctx.lineCap = "round";

      // Shadow to create glow effect
      ctx.shadowColor = color;
      ctx.shadowBlur = glow;
      ctx.stroke();
    };

    // Helper to draw neon node
    const drawNeonNode = (
      x: number,
      y: number,
      size: number,
      color: string,
      glow: number,
      phase: number,
      symbol: string,
    ) => {
      // Calculate pulse effect
      const pulseSize = size * (0.8 + Math.sin(phase) * 0.2);
      const pulseGlow = glow * (0.8 + Math.sin(phase) * 0.2);

      // Draw outer glow ring
      ctx.beginPath();
      ctx.arc(x, y, pulseSize + 5, 0, Math.PI * 2);
      ctx.fillStyle = "rgba(0, 0, 0, 0)";
      ctx.shadowColor = color;
      ctx.shadowBlur = pulseGlow;
      ctx.fill();

      // Draw inner circle
      ctx.beginPath();
      ctx.arc(x, y, pulseSize, 0, Math.PI * 2);
      ctx.fillStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = pulseGlow;
      ctx.fill();

      // Draw token symbol text
      ctx.font = `${Math.max(10, Math.min(16, pulseSize * 0.7))}px monospace`;
      ctx.fillStyle = "#ffffff";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.shadowColor = "rgba(0, 0, 0, 0.7)";
      ctx.shadowBlur = 2;
      ctx.fillText(symbol, x, y);
    };

    // Main animation loop
    const animate = () => {
      // Calculate delta time for smooth animation
      const now = Date.now();
      const deltaTime = (now - lastTimeRef.current) / 1000;
      lastTimeRef.current = now;

      // Clear canvas
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Reset shadow
      ctx.shadowColor = "transparent";
      ctx.shadowBlur = 0;

      // Get current grid state
      const { horizontalLines, verticalLines, nodes } = gridRef.current;

      // Draw horizontal lines
      horizontalLines.forEach((line) => {
        drawNeonLine(
          0,
          line.y,
          dimensions.width,
          line.y,
          line.color,
          line.width,
          line.glow,
        );
      });

      // Draw vertical lines
      verticalLines.forEach((line) => {
        drawNeonLine(
          line.x,
          0,
          line.x,
          dimensions.height,
          line.color,
          line.width,
          line.glow,
        );
      });

      // Draw and update nodes
      nodes.forEach((node) => {
        // Update phase for pulsing
        node.phase += node.pulseSpeed * deltaTime;

        // Update position for directed nodes
        if (
          node.directed &&
          node.targetX !== undefined &&
          node.targetY !== undefined &&
          node.speed !== undefined
        ) {
          // Calculate direction vector
          const dx = node.targetX - node.x;
          const dy = node.targetY - node.y;

          // Calculate distance
          const distance = Math.sqrt(dx * dx + dy * dy);

          // Move if not at target
          if (distance > 5) {
            // Normalize direction
            const dirX = dx / distance;
            const dirY = dy / distance;

            // Update position
            node.x += dirX * node.speed * deltaTime;
            node.y += dirY * node.speed * deltaTime;
          } else {
            // At target, pick a new target
            const targetGridX = Math.floor(
              Math.random() * verticalLines.length,
            );
            const targetGridY = Math.floor(
              Math.random() * horizontalLines.length,
            );
            node.targetX = verticalLines[targetGridX].x;
            node.targetY = horizontalLines[targetGridY].y;
          }
        }

        // Draw node
        drawNeonNode(
          node.x,
          node.y,
          node.size,
          node.color,
          node.glow,
          node.phase,
          node.symbol,
        );
      });

      // Continue animation loop
      animationFrameIdRef.current = requestAnimationFrame(animate);
    };

    // Start animation
    animationFrameIdRef.current = requestAnimationFrame(animate);

    // Cleanup
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
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
        filter: glowFilterRef.current,
      }}
    />
  );
};
