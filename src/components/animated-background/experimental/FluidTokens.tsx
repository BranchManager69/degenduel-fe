import React, { useEffect, useRef, useState } from "react";

import { useTokenData } from "../../../contexts/TokenDataContext";

// Simulation grid constants
const GRID_SIZE = 64; // Size of simulation grid (smaller for performance)
const DIFFUSION = 0.98; // How quickly dye diffuses
const VISCOSITY = 0.5; // Fluid viscosity
const ITERATIONS = 4; // Physics solver iterations (higher = more accurate but slower)

export const FluidTokens: React.FC = () => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { tokens, isConnected } = useTokenData();
  const [dimensions, setDimensions] = useState({ width: 0, height: 0 });
  const animationRef = useRef<number>();

  // Fluid simulation data structures
  const fluidRef = useRef<{
    density: Float32Array;
    velocityX: Float32Array;
    velocityY: Float32Array;
    densityPrev: Float32Array;
    velocityXPrev: Float32Array;
    velocityYPrev: Float32Array;
  } | null>(null);

  // Token influence points
  const tokenPointsRef = useRef<
    Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      color: [number, number, number];
      symbol: string;
      strength: number;
      lastUpdate: number;
    }>
  >([]);

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

  // Initialize fluid simulation data structures
  useEffect(() => {
    const size = GRID_SIZE * GRID_SIZE;

    fluidRef.current = {
      density: new Float32Array(size * 3), // RGB values
      velocityX: new Float32Array(size),
      velocityY: new Float32Array(size),
      densityPrev: new Float32Array(size * 3),
      velocityXPrev: new Float32Array(size),
      velocityYPrev: new Float32Array(size),
    };

    return () => {
      fluidRef.current = null;
    };
  }, []);

  // Process token data into influence points
  useEffect(() => {
    if (!isConnected || !tokens.length) return;

    console.log("[FluidTokens] Initializing with token data");

    // Take top 10 tokens by market cap
    const relevantTokens = tokens
      .sort(
        (a, b) =>
          parseFloat(b.marketCap || "0") - parseFloat(a.marketCap || "0"),
      )
      .slice(0, 10);

    // Create influence points for each token
    const points = relevantTokens.map((token, index) => {
      // Position influence points around the canvas
      const angle = (index / relevantTokens.length) * Math.PI * 2;
      const radius = Math.min(dimensions.width, dimensions.height) * 0.4;

      const x = dimensions.width / 2 + Math.cos(angle) * radius;
      const y = dimensions.height / 2 + Math.sin(angle) * radius;

      // Use 5-minute change instead of 24h for more dynamic animations
      const change = parseFloat(token.change5m || token.change24h || "0");
      let color: [number, number, number];

      if (change > 1) {
        color = [0, 255, 120]; // Strong positive - bright green
      } else if (change > 0) {
        color = [100, 255, 150]; // Slight positive - light green
      } else if (change > -1) {
        color = [255, 70, 70]; // Slight negative - light red
      } else {
        color = [255, 0, 0]; // Strong negative - bright red
      }

      // Determine strength of influence based on market cap
      const marketCap = parseFloat(token.marketCap || "0");
      const strength = Math.min(1, Math.log10(marketCap) / 12);

      return {
        x,
        y,
        vx: Math.cos(angle) * (change > 0 ? 1 : -1) * 0.5,
        vy: Math.sin(angle) * (change > 0 ? 1 : -1) * 0.5,
        color,
        symbol: token.symbol,
        strength: strength * 10,
        lastUpdate: Date.now(),
      };
    });

    tokenPointsRef.current = points;
  }, [tokens, isConnected, dimensions]);

  // Main simulation and rendering logic
  useEffect(() => {
    if (
      !canvasRef.current ||
      !dimensions.width ||
      !dimensions.height ||
      !fluidRef.current
    )
      return;

    const ctx = canvasRef.current.getContext("2d", {
      alpha: true,
      desynchronized: true, // Potential performance improvement
    });

    if (!ctx) return;

    // === FLUID SIMULATION HELPER FUNCTIONS ===

    // Function to map from canvas coordinates to grid coordinates
    const toGrid = (x: number, y: number) => {
      const gridX = Math.floor((x / dimensions.width) * GRID_SIZE);
      const gridY = Math.floor((y / dimensions.height) * GRID_SIZE);
      return {
        x: Math.max(1, Math.min(gridX, GRID_SIZE - 2)),
        y: Math.max(1, Math.min(gridY, GRID_SIZE - 2)),
      };
    };

    // Index into the 1D arrays from 2D coordinates
    const IX = (x: number, y: number) => y * GRID_SIZE + x;

    // Diffuse quantities through the fluid
    const diffuse = (
      _: number,
      x: Float32Array,
      x0: Float32Array,
      diff: number,
      dt: number,
    ) => {
      const a = dt * diff * (GRID_SIZE - 2) * (GRID_SIZE - 2);

      for (let k = 0; k < ITERATIONS; k++) {
        for (let j = 1; j < GRID_SIZE - 1; j++) {
          for (let i = 1; i < GRID_SIZE - 1; i++) {
            x[IX(i, j)] =
              (x0[IX(i, j)] +
                a *
                  (x[IX(i + 1, j)] +
                    x[IX(i - 1, j)] +
                    x[IX(i, j + 1)] +
                    x[IX(i, j - 1)])) /
              (1 + 4 * a);
          }
        }
      }
    };

    // RGB version of diffuse for density
    const diffuseRGB = (
      x: Float32Array,
      x0: Float32Array,
      diff: number,
      dt: number,
    ) => {
      const a = dt * diff * (GRID_SIZE - 2) * (GRID_SIZE - 2);

      for (let k = 0; k < ITERATIONS; k++) {
        for (let j = 1; j < GRID_SIZE - 1; j++) {
          for (let i = 1; i < GRID_SIZE - 1; i++) {
            const idx = IX(i, j) * 3;
            const idxRight = IX(i + 1, j) * 3;
            const idxLeft = IX(i - 1, j) * 3;
            const idxTop = IX(i, j - 1) * 3;
            const idxBottom = IX(i, j + 1) * 3;

            for (let c = 0; c < 3; c++) {
              x[idx + c] =
                (x0[idx + c] +
                  a *
                    (x[idxRight + c] +
                      x[idxLeft + c] +
                      x[idxBottom + c] +
                      x[idxTop + c])) /
                (1 + 4 * a);
            }
          }
        }
      }
    };

    // Advect quantities through the fluid
    const advect = (
      _: number,
      d: Float32Array,
      d0: Float32Array,
      velocX: Float32Array,
      velocY: Float32Array,
      dt: number,
    ) => {
      let i0, i1, j0, j1;
      let x, y, s0, t0, s1, t1;

      const dtx = dt * (GRID_SIZE - 2);
      const dty = dt * (GRID_SIZE - 2);

      for (let j = 1; j < GRID_SIZE - 1; j++) {
        for (let i = 1; i < GRID_SIZE - 1; i++) {
          const index = IX(i, j);

          // Backtrack to find where this particle came from
          x = i - dtx * velocX[index];
          y = j - dty * velocY[index];

          // Clamp values
          if (x < 0.5) x = 0.5;
          if (x > GRID_SIZE - 1.5) x = GRID_SIZE - 1.5;
          if (y < 0.5) y = 0.5;
          if (y > GRID_SIZE - 1.5) y = GRID_SIZE - 1.5;

          // Interpolation indices
          i0 = Math.floor(x);
          i1 = i0 + 1;
          j0 = Math.floor(y);
          j1 = j0 + 1;

          // Interpolation weights
          s1 = x - i0;
          s0 = 1 - s1;
          t1 = y - j0;
          t0 = 1 - t1;

          // Bilinear interpolation
          d[index] =
            s0 * (t0 * d0[IX(i0, j0)] + t1 * d0[IX(i0, j1)]) +
            s1 * (t0 * d0[IX(i1, j0)] + t1 * d0[IX(i1, j1)]);
        }
      }
    };

    // RGB version of advect
    const advectRGB = (
      d: Float32Array,
      d0: Float32Array,
      velocX: Float32Array,
      velocY: Float32Array,
      dt: number,
    ) => {
      let i0, i1, j0, j1;
      let x, y, s0, t0, s1, t1;

      const dtx = dt * (GRID_SIZE - 2);
      const dty = dt * (GRID_SIZE - 2);

      for (let j = 1; j < GRID_SIZE - 1; j++) {
        for (let i = 1; i < GRID_SIZE - 1; i++) {
          const index = IX(i, j);

          // Backtrack to find where this particle came from
          x = i - dtx * velocX[index];
          y = j - dty * velocY[index];

          // Clamp values
          if (x < 0.5) x = 0.5;
          if (x > GRID_SIZE - 1.5) x = GRID_SIZE - 1.5;
          if (y < 0.5) y = 0.5;
          if (y > GRID_SIZE - 1.5) y = GRID_SIZE - 1.5;

          // Interpolation indices
          i0 = Math.floor(x);
          i1 = i0 + 1;
          j0 = Math.floor(y);
          j1 = j0 + 1;

          // Interpolation weights
          s1 = x - i0;
          s0 = 1 - s1;
          t1 = y - j0;
          t0 = 1 - t1;

          // RGB interpolation
          const idx = index * 3;
          for (let c = 0; c < 3; c++) {
            d[idx + c] =
              s0 * (t0 * d0[IX(i0, j0) * 3 + c] + t1 * d0[IX(i0, j1) * 3 + c]) +
              s1 * (t0 * d0[IX(i1, j0) * 3 + c] + t1 * d0[IX(i1, j1) * 3 + c]);
          }
        }
      }
    };

    // Add sources to the fluid
    const addSource = (
      dest: Float32Array,
      source: number,
      x: number,
      y: number,
      radius: number,
      strength: number,
    ) => {
      const gridPos = toGrid(x, y);
      const r = Math.max(
        1,
        Math.ceil(
          (radius * GRID_SIZE) / Math.max(dimensions.width, dimensions.height),
        ),
      );

      for (let j = -r; j <= r; j++) {
        for (let i = -r; i <= r; i++) {
          const gx = gridPos.x + i;
          const gy = gridPos.y + j;

          // Stay within grid bounds
          if (gx < 1 || gx >= GRID_SIZE - 1 || gy < 1 || gy >= GRID_SIZE - 1)
            continue;

          // Calculate distance falloff
          const distSq = (i * i + j * j) / (r * r);
          if (distSq > 1) continue;

          const idx = IX(gx, gy);
          dest[idx] += source * strength * (1 - distSq);
        }
      }
    };

    // RGB version of addSource
    const addSourceRGB = (
      dest: Float32Array,
      r: number,
      g: number,
      b: number,
      x: number,
      y: number,
      radius: number,
      strength: number,
    ) => {
      const gridPos = toGrid(x, y);
      const r2 = Math.max(
        1,
        Math.ceil(
          (radius * GRID_SIZE) / Math.max(dimensions.width, dimensions.height),
        ),
      );

      for (let j = -r2; j <= r2; j++) {
        for (let i = -r2; i <= r2; i++) {
          const gx = gridPos.x + i;
          const gy = gridPos.y + j;

          // Stay within grid bounds
          if (gx < 1 || gx >= GRID_SIZE - 1 || gy < 1 || gy >= GRID_SIZE - 1)
            continue;

          // Calculate distance falloff
          const distSq = (i * i + j * j) / (r2 * r2);
          if (distSq > 1) continue;

          const factor = strength * (1 - distSq);
          const idx = IX(gx, gy) * 3;

          dest[idx] += r * factor;
          dest[idx + 1] += g * factor;
          dest[idx + 2] += b * factor;
        }
      }
    };

    // Solve incompressibility to maintain divergence-free velocity field
    const project = (
      velocX: Float32Array,
      velocY: Float32Array,
      p: Float32Array,
      div: Float32Array,
    ) => {
      // Calculate divergence
      for (let j = 1; j < GRID_SIZE - 1; j++) {
        for (let i = 1; i < GRID_SIZE - 1; i++) {
          const idx = IX(i, j);
          div[idx] =
            (-0.5 *
              (velocX[IX(i + 1, j)] -
                velocX[IX(i - 1, j)] +
                velocY[IX(i, j + 1)] -
                velocY[IX(i, j - 1)])) /
            GRID_SIZE;
          p[idx] = 0;
        }
      }

      // Solve Poisson equation
      for (let k = 0; k < ITERATIONS; k++) {
        for (let j = 1; j < GRID_SIZE - 1; j++) {
          for (let i = 1; i < GRID_SIZE - 1; i++) {
            const idx = IX(i, j);
            p[idx] =
              (div[idx] +
                p[IX(i + 1, j)] +
                p[IX(i - 1, j)] +
                p[IX(i, j + 1)] +
                p[IX(i, j - 1)]) /
              4;
          }
        }
      }

      // Subtract gradient from velocity field
      for (let j = 1; j < GRID_SIZE - 1; j++) {
        for (let i = 1; i < GRID_SIZE - 1; i++) {
          const idx = IX(i, j);
          velocX[idx] -= 0.5 * (p[IX(i + 1, j)] - p[IX(i - 1, j)]) * GRID_SIZE;
          velocY[idx] -= 0.5 * (p[IX(i, j + 1)] - p[IX(i, j - 1)]) * GRID_SIZE;
        }
      }
    };

    // Velocity step of the fluid simulation
    const velocityStep = (
      velocX: Float32Array,
      velocY: Float32Array,
      velocX0: Float32Array,
      velocY0: Float32Array,
      dt: number,
    ) => {
      // Add forces
      for (let i = 0; i < velocX.length; i++) {
        velocX[i] += dt * velocX0[i];
        velocY[i] += dt * velocY0[i];
      }

      // Swap arrays for diffusion
      [velocX0, velocX] = [velocX, velocX0];
      [velocY0, velocY] = [velocY, velocY0];

      // Diffusion
      diffuse(1, velocX, velocX0, VISCOSITY, dt);
      diffuse(2, velocY, velocY0, VISCOSITY, dt);

      // Projection to ensure mass conservation
      project(velocX, velocY, velocX0, velocY0);

      // Swap arrays for advection
      [velocX0, velocX] = [velocX, velocX0];
      [velocY0, velocY] = [velocY, velocY0];

      // Advection
      advect(1, velocX, velocX0, velocX0, velocY0, dt);
      advect(2, velocY, velocY0, velocX0, velocY0, dt);

      // Final projection
      project(velocX, velocY, velocX0, velocY0);
    };

    // Density step of the fluid simulation
    const densityStep = (
      x: Float32Array,
      x0: Float32Array,
      velocX: Float32Array,
      velocY: Float32Array,
      dt: number,
    ) => {
      // Add sources
      for (let i = 0; i < x.length; i++) {
        x[i] += dt * x0[i];
      }

      // Swap arrays for diffusion
      [x0, x] = [x, x0];

      // Diffusion
      diffuseRGB(x, x0, DIFFUSION, dt);

      // Swap arrays for advection
      [x0, x] = [x, x0];

      // Advection
      advectRGB(x, x0, velocX, velocY, dt);
    };

    // Main render function
    const animate = () => {
      if (!fluidRef.current) return;

      const now = Date.now();
      const dt = Math.min(0.1, (now - (lastUpdateRef.current || now)) / 1000);
      lastUpdateRef.current = now;

      const {
        density,
        velocityX,
        velocityY,
        densityPrev,
        velocityXPrev,
        velocityYPrev,
      } = fluidRef.current;

      // Clear prev arrays
      for (let i = 0; i < densityPrev.length; i++) {
        densityPrev[i] = 0;
      }
      for (let i = 0; i < velocityXPrev.length; i++) {
        velocityXPrev[i] = 0;
        velocityYPrev[i] = 0;
      }

      // Apply token influence points
      tokenPointsRef.current.forEach((point) => {
        // Update point position based on velocity
        point.x += point.vx * 2;
        point.y += point.vy * 2;

        // Boundary conditions - bounce off edges
        if (point.x < 0 || point.x > dimensions.width) {
          point.vx *= -1;
          point.x = Math.max(0, Math.min(point.x, dimensions.width));
        }
        if (point.y < 0 || point.y > dimensions.height) {
          point.vy *= -1;
          point.y = Math.max(0, Math.min(point.y, dimensions.height));
        }

        // Add velocity to fluid
        addSource(
          velocityXPrev,
          point.vx * 5,
          point.x,
          point.y,
          50,
          point.strength,
        );
        addSource(
          velocityYPrev,
          point.vy * 5,
          point.y,
          point.y,
          50,
          point.strength,
        );

        // Add color to fluid
        addSourceRGB(
          densityPrev,
          point.color[0],
          point.color[1],
          point.color[2],
          point.x,
          point.y,
          50,
          point.strength * 0.05,
        );
      });

      // Run simulation
      velocityStep(velocityX, velocityY, velocityXPrev, velocityYPrev, dt);
      densityStep(density, densityPrev, velocityX, velocityY, dt);

      // Render fluid
      const imageData = ctx.createImageData(
        dimensions.width,
        dimensions.height,
      );
      const data = imageData.data;

      // Clear
      ctx.clearRect(0, 0, dimensions.width, dimensions.height);

      // Map fluid simulation to canvas
      for (let y = 0; y < dimensions.height; y++) {
        for (let x = 0; x < dimensions.width; x++) {
          // Convert canvas coords to grid coords
          const gx = Math.floor((x / dimensions.width) * GRID_SIZE);
          const gy = Math.floor((y / dimensions.height) * GRID_SIZE);

          // Ensure within bounds
          if (gx < 0 || gx >= GRID_SIZE || gy < 0 || gy >= GRID_SIZE) continue;

          // Get density at this point
          const idx = IX(gx, gy) * 3;
          const idxCanvas = (y * dimensions.width + x) * 4;

          // Update image data
          data[idxCanvas] = Math.max(
            0,
            Math.min(255, Math.floor(density[idx])),
          ); // R
          data[idxCanvas + 1] = Math.max(
            0,
            Math.min(255, Math.floor(density[idx + 1])),
          ); // G
          data[idxCanvas + 2] = Math.max(
            0,
            Math.min(255, Math.floor(density[idx + 2])),
          ); // B

          // Calculate alpha based on overall density
          const totalDensity =
            density[idx] + density[idx + 1] + density[idx + 2];
          data[idxCanvas + 3] = Math.min(255, totalDensity * 0.3); // Alpha
        }
      }

      // Put image data on canvas
      ctx.putImageData(imageData, 0, 0);

      // Optional: Render token symbols
      tokenPointsRef.current.forEach((point) => {
        ctx.font = "12px monospace";
        ctx.fillStyle = `rgb(${point.color[0]}, ${point.color[1]}, ${point.color[2]})`;
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(point.symbol, point.x, point.y);
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    // Track last update time
    const lastUpdateRef = useRef<number>(Date.now());

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
