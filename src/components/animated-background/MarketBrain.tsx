import React, { useCallback, useEffect, useRef, useState } from "react";

import { useTokenData } from "../../contexts/TokenDataContext";

interface MarketNode {
  symbol: string;
  position: { x: number; y: number };
  activity: {
    price: number;
    change: number;
    volume: number;
    correlations: Record<string, number>;
  };
  energy: number;
}

interface Connection {
  start: MarketNode;
  end: MarketNode;
  strength: number;
  dataFlow: number;
}

interface Particle {
  id: string;
  position: { x: number; y: number };
  velocity: { x: number; y: number };
  color: string;
  size: number;
  life: number;
  maxLife: number;
}

export const MarketBrain: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number>();
  const [nodes, setNodes] = useState<MarketNode[]>([]);
  const [connections] = useState<Connection[]>([]);
  const [particles, setParticles] = useState<Particle[]>([]);
  const mousePosition = useRef({ x: 0, y: 0 });
  const { tokens, isConnected, lastUpdate } = useTokenData();
  const prevTokensRef = useRef<
    Record<string, { price: string; volume24h: string }>
  >({});

  const createParticle = useCallback(
    (node: MarketNode, type: "price" | "volume" | "correlation") => {
      const getColor = () => {
        switch (type) {
          case "price":
            return node.activity.change > 0 ? "#10B981" : "#EF4444";
          case "volume":
            return "#8B5CF6";
          case "correlation":
            return "#3B82F6";
        }
      };

      return {
        id: `${node.symbol}-${Date.now()}-${Math.random()}`,
        position: { ...node.position },
        velocity: {
          x: (Math.random() - 0.5) * 2,
          y: (Math.random() - 0.5) * 2,
        },
        color: getColor(),
        size: Math.random() * 3 + 1,
        life: 1,
        maxLife: 100,
      };
    },
    [],
  );

  const updateParticles = useCallback(() => {
    setParticles((prevParticles) =>
      prevParticles
        .map((particle) => {
          // Apply forces from nodes
          const forces = nodes.reduce(
            (acc, node) => {
              const dx = node.position.x - particle.position.x;
              const dy = node.position.y - particle.position.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const force = node.energy / (distance * distance);

              return {
                x: acc.x + (dx / distance) * force,
                y: acc.y + (dy / distance) * force,
              };
            },
            { x: 0, y: 0 },
          );

          // Apply mouse influence
          const dx = mousePosition.current.x - particle.position.x;
          const dy = mousePosition.current.y - particle.position.y;
          const distance = Math.sqrt(dx * dx + dy * dy);
          if (distance < 200) {
            forces.x += (dx / distance) * 0.5;
            forces.y += (dy / distance) * 0.5;
          }

          return {
            ...particle,
            position: {
              x: particle.position.x + particle.velocity.x + forces.x,
              y: particle.position.y + particle.velocity.y + forces.y,
            },
            velocity: {
              x: (particle.velocity.x + forces.x) * 0.99,
              y: (particle.velocity.y + forces.y) * 0.99,
            },
            life: particle.life - 1,
          };
        })
        .filter((particle) => particle.life > 0),
    );
  }, [nodes]);

  const renderConnections = useCallback(
    (ctx: CanvasRenderingContext2D) => {
      connections.forEach((connection) => {
        const gradient = ctx.createLinearGradient(
          connection.start.position.x,
          connection.start.position.y,
          connection.end.position.x,
          connection.end.position.y,
        );

        gradient.addColorStop(
          0,
          `rgba(59, 130, 246, ${connection.strength * 0.5})`,
        );
        gradient.addColorStop(
          1,
          `rgba(139, 92, 246, ${connection.strength * 0.5})`,
        );

        ctx.beginPath();
        ctx.strokeStyle = gradient;
        ctx.lineWidth = connection.strength * 2;

        // Create curved path influenced by nearby particles
        const midX =
          (connection.start.position.x + connection.end.position.x) / 2;
        const midY =
          (connection.start.position.y + connection.end.position.y) / 2;

        // Find nearby particles
        const nearbyParticles = particles.filter((p) => {
          const dx = p.position.x - midX;
          const dy = p.position.y - midY;
          return Math.sqrt(dx * dx + dy * dy) < 100;
        });

        // Adjust control points based on nearby particles
        const offset = nearbyParticles.reduce(
          (acc, p) => ({
            x: acc.x + (p.position.x - midX) * 0.1,
            y: acc.y + (p.position.y - midY) * 0.1,
          }),
          { x: 0, y: 0 },
        );

        ctx.moveTo(connection.start.position.x, connection.start.position.y);
        ctx.bezierCurveTo(
          midX + offset.x,
          midY + offset.y,
          midX + offset.x,
          midY + offset.y,
          connection.end.position.x,
          connection.end.position.y,
        );
        ctx.stroke();

        // Render data pulse if active
        if (connection.dataFlow > 0) {
          const pulsePos = connection.dataFlow;
          const pulseX =
            connection.start.position.x +
            (connection.end.position.x - connection.start.position.x) *
              pulsePos;
          const pulseY =
            connection.start.position.y +
            (connection.end.position.y - connection.start.position.y) *
              pulsePos;

          ctx.beginPath();
          ctx.fillStyle = "rgba(59, 130, 246, 0.8)";
          ctx.arc(pulseX, pulseY, 4, 0, Math.PI * 2);
          ctx.fill();
        }
      });
    },
    [connections, particles],
  );

  const animate = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and render connections
    renderConnections(ctx);

    // Update and render particles
    updateParticles();
    particles.forEach((particle) => {
      const alpha = particle.life / particle.maxLife;
      ctx.beginPath();
      ctx.fillStyle = `${particle.color}${Math.floor(alpha * 255)
        .toString(16)
        .padStart(2, "0")}`;
      ctx.arc(
        particle.position.x,
        particle.position.y,
        particle.size,
        0,
        Math.PI * 2,
      );
      ctx.fill();
    });

    animationFrameRef.current = requestAnimationFrame(animate);
  }, [particles, connections, renderConnections, updateParticles]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener("resize", resizeCanvas);
    resizeCanvas();

    const handleMouseMove = (e: MouseEvent) => {
      mousePosition.current = {
        x: e.clientX,
        y: e.clientY,
      };
    };

    window.addEventListener("mousemove", handleMouseMove);
    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("resize", resizeCanvas);
      window.removeEventListener("mousemove", handleMouseMove);
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [animate]);

  const handleMarketUpdate = useCallback(
    (update: any) => {
      setNodes((prevNodes) => {
        const node = prevNodes.find((n) => n.symbol === update.symbol);
        if (!node) return prevNodes;

        // Create particles based on update type
        if (Math.abs(update.priceChange) >= 2) {
          setParticles((prev) => [...prev, createParticle(node, "price")]);
        }
        if (update.volumeChange > 200) {
          setParticles((prev) => [...prev, createParticle(node, "volume")]);
        }

        // Update node energy
        const newEnergy =
          Math.abs(update.priceChange) * 0.1 +
          Math.abs(update.volumeChange) * 0.01;

        return prevNodes.map((n) =>
          n.symbol === update.symbol
            ? {
                ...n,
                activity: {
                  ...n.activity,
                  price: update.price,
                  change: update.priceChange,
                  volume: update.volume,
                },
                energy: n.energy + newEnergy,
              }
            : n,
        );
      });
    },
    [createParticle],
  );

  useEffect(() => {
    if (isConnected && tokens.length > 0) {
      // Process tokens
      tokens.forEach((token) => {
        const currentPrice = parseFloat(token.price || "0");
        const currentVolume = parseFloat(token.volume24h || "0");
        const prevToken = prevTokensRef.current[token.symbol];
        const prevPrice = prevToken
          ? parseFloat(prevToken.price || "0")
          : currentPrice;
        const prevVolume = prevToken
          ? parseFloat(prevToken.volume24h || "0")
          : currentVolume;

        // Calculate changes
        const priceChange = prevPrice
          ? ((currentPrice - prevPrice) / prevPrice) * 100
          : 0;
        const volumeChange = prevVolume
          ? ((currentVolume - prevVolume) / prevVolume) * 100
          : 0;

        // Update the brain with this token's data
        handleMarketUpdate({
          symbol: token.symbol,
          price: currentPrice,
          priceChange: priceChange,
          volumeChange: volumeChange,
        });

        // Save current values for next comparison
        prevTokensRef.current[token.symbol] = {
          price: token.price,
          volume24h: token.volume24h,
        };
      });
    }
  }, [tokens, isConnected, lastUpdate, handleMarketUpdate]);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  );
};
