import * as THREE from "three";

/**
 * ThreeManager - Singleton manager for Three.js rendering
 *
 * This class centralizes all Three.js rendering into a single WebGL context.
 * Components register their scenes with this manager instead of creating
 * their own renderers, dramatically improving performance.
 */
class ThreeManager {
  private static instance: ThreeManager;

  // Core Three.js objects
  private renderer: THREE.WebGLRenderer;
  // Removing these unused variables since they're not needed
  // The renderer is the only core Three.js object we actually need to maintain

  // Component scenes - each visual component gets its own scene, but uses the same renderer
  private scenes: Map<string, THREE.Scene> = new Map();
  private cameras: Map<string, THREE.Camera> = new Map();
  private renderOrder: string[] = []; // Controls the order of rendering (z-order)

  // DOM elements for components
  private containers: Map<string, HTMLElement> = new Map();

  // Shared resources
  private geometries: Map<string, THREE.BufferGeometry> = new Map();
  private materials: Map<string, THREE.Material> = new Map();
  private textures: Map<string, THREE.Texture> = new Map();

  // Animation management
  private animationCallbacks: Map<string, (deltaTime: number) => void> =
    new Map();
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;

  // Performance monitoring
  private frameCounter: number = 0;
  private fpsUpdateInterval: number = 500; // ms
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private fpsHistory: number[] = [];
  private qualityLevel: "high" | "medium" | "low" = "high";

  // Device detection and fallback flags
  private isMobile: boolean = false;
  private isWebGLFallback: boolean = false;
  private isStaticFallback: boolean = false;

  private constructor() {
    // Detect mobile
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);

    // Start with an appropriate quality level
    this.qualityLevel = this.isMobile ? "medium" : "high";

    // Try to create optimal WebGL renderer with comprehensive fallback system
    try {
      // First try: High quality renderer
      try {
        this.renderer = new THREE.WebGLRenderer({
          antialias: !this.isMobile,
          alpha: true,
          powerPreference: "high-performance",
          stencil: false,
          depth: true,
        });

        // Configure renderer
        this.renderer.setPixelRatio(
          this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2),
        );
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        console.log("[ThreeManager] WebGL renderer initialized successfully");
      } catch (highQualityError) {
        // Second try: Minimal WebGL renderer with lowest settings
        console.warn(
          "[ThreeManager] High-quality renderer failed, trying minimal WebGL:",
          highQualityError,
        );
        this.isWebGLFallback = true;

        this.renderer = new THREE.WebGLRenderer({
          antialias: false,
          alpha: true,
          powerPreference: "low-power",
          precision: "lowp",
          depth: false,
          stencil: false,
        });

        // Set minimal configuration
        this.renderer.setPixelRatio(1);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputColorSpace = THREE.SRGBColorSpace;

        // Force low quality mode
        this.qualityLevel = "low";
        console.warn(
          "[ThreeManager] Using fallback low-quality WebGL renderer",
        );
      }
    } catch (error) {
      // Final fallback: No WebGL at all, use a non-WebGL static background
      console.error("[ThreeManager] WebGL completely unavailable:", error);
      this.isStaticFallback = true;

      // Create a mock renderer object that does nothing
      this.renderer = {
        domElement: document.createElement("div"),
        setPixelRatio: () => {},
        setSize: () => {},
        clear: () => {},
        render: () => {},
        dispose: () => {},
        outputColorSpace: THREE.SRGBColorSpace,
      } as unknown as THREE.WebGLRenderer;

      // Style the fallback element to look decent
      const fallbackEl = this.renderer.domElement;
      fallbackEl.className = "webgl-fallback";
      fallbackEl.style.background =
        "radial-gradient(circle, rgba(20,20,30,1) 0%, rgba(10,10,15,1) 100%)";
      fallbackEl.style.position = "absolute";
      fallbackEl.style.top = "0";
      fallbackEl.style.left = "0";
      fallbackEl.style.width = "100%";
      fallbackEl.style.height = "100%";

      // Add a message for browsers with developer tools open
      console.warn(
        "[ThreeManager] Using non-WebGL fallback - visual effects disabled",
      );
    }

    // We no longer initialize unused main scene and camera
    // Each component will register its own scene and camera through registerScene

    // Set up resize handler with debounce for performance
    let resizeTimeout: number | null = null;
    window.addEventListener("resize", () => {
      if (resizeTimeout) window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.handleResize();
        resizeTimeout = null;
      }, 200);
    });

    // Start animation loop
    this.startAnimationLoop();

    console.log(
      "[ThreeManager] Initialized with quality level:",
      this.qualityLevel,
    );
  }

  /**
   * Get the singleton instance of ThreeManager
   */
  public static getInstance(): ThreeManager {
    if (!ThreeManager.instance) {
      ThreeManager.instance = new ThreeManager();
    }
    return ThreeManager.instance;
  }

  /**
   * Get the WebGL renderer instance
   */
  public getRenderer(): THREE.WebGLRenderer {
    return this.renderer;
  }

  /**
   * Add the renderer to a DOM element for a specific component
   */
  public attachRenderer(componentId: string, domElement: HTMLElement): void {
    // Store reference to container
    this.containers.set(componentId, domElement);

    // We only need to append the renderer to the DOM once
    // But we track which components are using it
    if (!this.renderer.domElement.parentElement) {
      domElement.appendChild(this.renderer.domElement);

      // Use relative positioning to respect container boundaries
      // This prevents the renderer from expanding beyond its container
      this.renderer.domElement.style.position = "relative";
      this.renderer.domElement.style.width = "100%";
      this.renderer.domElement.style.height = "100%";
      this.renderer.domElement.style.pointerEvents = "none";

      // If we're in static fallback mode, add a user-friendly message
      if (this.isStaticFallback) {
        const messageEl = document.createElement("div");
        messageEl.className = "webgl-fallback-message";
        messageEl.textContent = "Enhanced visual effects unavailable";
        messageEl.style.position = "absolute";
        messageEl.style.bottom = "10px";
        messageEl.style.left = "0";
        messageEl.style.width = "100%";
        messageEl.style.textAlign = "center";
        messageEl.style.color = "rgba(255,255,255,0.5)";
        messageEl.style.fontSize = "12px";
        messageEl.style.padding = "5px";
        messageEl.style.fontFamily = "sans-serif";
        messageEl.style.pointerEvents = "none";
        this.renderer.domElement.appendChild(messageEl);
      }
    }
  }

  /**
   * Add the renderer to a DOM element for a specific component (alias for attachRenderer)
   */
  public attachToContainer(componentId: string, domElement: HTMLElement): void {
    this.attachRenderer(componentId, domElement);
  }

  /**
   * Check if a scene exists
   */
  public hasScene(componentId: string): boolean {
    return this.scenes.has(componentId);
  }

  /**
   * Create a new scene with camera
   */
  public createScene(
    componentId: string,
    cameraOptions?: {
      fov?: number;
      near?: number;
      far?: number;
      position?: THREE.Vector3;
      lookAt?: THREE.Vector3;
    },
    renderOrder: number = 0,
  ): { scene: THREE.Scene; camera: THREE.Camera } {
    const scene = new THREE.Scene();

    // Create camera with options or defaults
    const fov = cameraOptions?.fov ?? 70;
    const near = cameraOptions?.near ?? 0.1;
    const far = cameraOptions?.far ?? 1000;
    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far,
    );

    // Position camera if specified
    if (cameraOptions?.position) {
      camera.position.copy(cameraOptions.position);
    }

    // Set camera lookAt if specified
    if (cameraOptions?.lookAt) {
      camera.lookAt(cameraOptions.lookAt);
    }

    // Store in maps
    this.scenes.set(componentId, scene);
    this.cameras.set(componentId, camera);

    // Store in render order
    this.insertInRenderOrder(componentId, renderOrder);

    console.log(`[ThreeManager] Created scene: ${componentId}`);
    return { scene, camera };
  }

  /**
   * Register a component scene - each visual component gets its own scene
   */
  public registerScene(
    componentId: string,
    animationCallback: (deltaTime: number) => void,
  ): void {
    // Register the animation callback
    this.registerAnimation(componentId, animationCallback);

    console.log(
      `[ThreeManager] Registered animation for scene: ${componentId}`,
    );
  }

  /**
   * Insert a component ID into the render order array
   */
  private insertInRenderOrder(componentId: string, order: number): void {
    // Remove if already exists
    this.renderOrder = this.renderOrder.filter((id) => id !== componentId);

    // Find insertion point based on order
    const allComponents = this.renderOrder.map((id, index) => ({ id, index }));
    const insertPoint = allComponents.findIndex(
      (component) => order > parseInt(component.id.split("-")[1] || "0"),
    );

    if (insertPoint === -1) {
      // Add to end
      this.renderOrder.push(componentId);
    } else {
      // Insert at point
      this.renderOrder.splice(insertPoint, 0, componentId);
    }
  }

  /**
   * Unregister a component when it unmounts
   */
  public unregisterScene(componentId: string): void {
    this.scenes.delete(componentId);
    this.cameras.delete(componentId);
    this.animationCallbacks.delete(componentId);
    this.containers.delete(componentId);
    this.renderOrder = this.renderOrder.filter((id) => id !== componentId);

    // If no more scenes, we could detach the renderer, but keeping it
    // prevents re-creation costs when new scenes register
    console.log(`[ThreeManager] Unregistered scene: ${componentId}`);
  }

  /**
   * Remove a scene (alias for unregisterScene)
   */
  public removeScene(componentId: string): void {
    this.unregisterScene(componentId);
  }

  /**
   * Register animation callback for a component
   */
  public registerAnimation(
    componentId: string,
    callback: (deltaTime: number) => void,
  ): void {
    this.animationCallbacks.set(componentId, callback);
  }

  /**
   * Get or create a shared geometry
   */
  public getOrCreateGeometry(
    key: string,
    creator: () => THREE.BufferGeometry,
  ): THREE.BufferGeometry {
    if (!this.geometries.has(key)) {
      this.geometries.set(key, creator());
    }
    return this.geometries.get(key)!;
  }

  /**
   * Get or create a shared material
   */
  public getOrCreateMaterial(
    key: string,
    creator: () => THREE.Material,
  ): THREE.Material {
    if (!this.materials.has(key)) {
      this.materials.set(key, creator());
    }
    return this.materials.get(key)!;
  }

  /**
   * Get or create a shared texture
   */
  public getOrCreateTexture(
    key: string,
    creator: () => THREE.Texture,
  ): THREE.Texture {
    if (!this.textures.has(key)) {
      this.textures.set(key, creator());
    }
    return this.textures.get(key)!;
  }

  /**
   * Main animation loop
   */
  private startAnimationLoop(): void {
    // If in static fallback mode, don't run the animation loop at all
    if (this.isStaticFallback) {
      console.log("[ThreeManager] Static fallback mode - animation disabled");
      return;
    }

    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);

      // Calculate delta time
      const deltaTime = this.lastFrameTime
        ? (time - this.lastFrameTime) / 1000
        : 0.016;
      this.lastFrameTime = time;

      // Update FPS counter (skip if in WebGL fallback mode to reduce overhead)
      if (!this.isWebGLFallback) {
        this.frameCounter++;
        if (time - this.lastFpsUpdate > this.fpsUpdateInterval) {
          this.currentFps = Math.round(
            (this.frameCounter * 1000) / (time - this.lastFpsUpdate),
          );

          this.lastFpsUpdate = time;
          this.frameCounter = 0;

          // Store in history
          this.fpsHistory.push(this.currentFps);
          if (this.fpsHistory.length > 10) {
            this.fpsHistory.shift();
          }

          // Adjust quality if needed (not too often)
          if (this.fpsHistory.length >= 5 && !this.isWebGLFallback) {
            this.adjustQualityForPerformance();
          }
        }
      }

      try {
        // Run component animation callbacks with error boundaries
        this.animationCallbacks.forEach((callback) => {
          try {
            callback(deltaTime);
          } catch (error) {
            console.error("[ThreeManager] Error in animation callback:", error);
          }
        });

        // Clear the renderer once
        this.renderer.clear();

        // Render all registered scenes in order
        this.renderOrder.forEach((componentId) => {
          const scene = this.scenes.get(componentId);
          const camera = this.cameras.get(componentId);
          const container = this.containers.get(componentId);

          if (scene && camera && container) {
            try {
              // Get container size
              const rect = container.getBoundingClientRect();

              // Only render if container is visible (has width and height)
              if (rect.width > 0 && rect.height > 0) {
                // Set renderer size to match container
                this.renderer.setSize(rect.width, rect.height, false);

                // Render the scene with error catching for each individual scene
                this.renderer.render(scene, camera);
              }
            } catch (error) {
              console.error(
                `[ThreeManager] Error rendering scene ${componentId}:`,
                error,
              );
              // Remove problematic scene to prevent continual errors
              this.unregisterScene(componentId);
            }
          }
        });
      } catch (renderError) {
        // If we hit a catastrophic rendering error, switch to static fallback
        console.error(
          "[ThreeManager] Catastrophic render error, disabling WebGL:",
          renderError,
        );
        this.switchToStaticFallback();
      }
    };

    this.animationFrameId = requestAnimationFrame(animate);
  }

  /**
   * Emergency switch to static fallback when WebGL fails during runtime
   */
  private switchToStaticFallback(): void {
    // Cancel animation frame
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }

    // Set fallback flag
    this.isStaticFallback = true;

    // Clean up WebGL context
    if (this.renderer && typeof this.renderer.dispose === "function") {
      try {
        this.renderer.dispose();
      } catch (e) {
        console.error("[ThreeManager] Error disposing renderer:", e);
      }
    }

    // Create a static fallback element
    const fallbackEl = document.createElement("div");
    fallbackEl.className = "webgl-fallback";
    fallbackEl.style.background =
      "radial-gradient(circle, rgba(20,20,30,1) 0%, rgba(10,10,15,1) 100%)";
    fallbackEl.style.position = "absolute";
    fallbackEl.style.top = "0";
    fallbackEl.style.left = "0";
    fallbackEl.style.width = "100%";
    fallbackEl.style.height = "100%";

    // Replace renderer with mock
    this.renderer = {
      domElement: fallbackEl,
      setPixelRatio: () => {},
      setSize: () => {},
      clear: () => {},
      render: () => {},
      dispose: () => {},
      outputColorSpace: THREE.SRGBColorSpace,
    } as unknown as THREE.WebGLRenderer;

    // Attach fallback element to all registered containers
    this.containers.forEach((container) => {
      // Remove any existing children
      while (container.firstChild) {
        container.removeChild(container.firstChild);
      }
      // Add fallback
      container.appendChild(fallbackEl.cloneNode(true));
    });

    console.warn(
      "[ThreeManager] Switched to static fallback - visual effects disabled",
    );
  }

  /**
   * Handle window resize
   */
  private handleResize(): void {
    // Don't resize renderer globally - we'll handle this per render

    // Update camera aspects based on their containers
    this.containers.forEach((container, componentId) => {
      const camera = this.cameras.get(componentId);
      if (camera instanceof THREE.PerspectiveCamera) {
        const rect = container.getBoundingClientRect();
        camera.aspect = rect.width / rect.height;
        camera.updateProjectionMatrix();
      }
    });

    console.log("[ThreeManager] Updated camera aspects for all components");
  }

  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }

    // Dispose all resources
    this.geometries.forEach((geometry) => geometry.dispose());
    this.materials.forEach((material) => material.dispose());
    this.textures.forEach((texture) => texture.dispose());

    this.renderer.dispose();

    console.log("[ThreeManager] Disposed all resources");
  }

  /**
   * Get current FPS
   */
  public getCurrentFps(): number {
    return this.currentFps;
  }

  /**
   * Get average FPS over recent history
   */
  public getAverageFps(): number {
    if (this.fpsHistory.length === 0) return 0;
    const sum = this.fpsHistory.reduce((a, b) => a + b, 0);
    return sum / this.fpsHistory.length;
  }

  /**
   * Adjust rendering quality based on performance
   */
  private adjustQualityForPerformance(): void {
    const avgFps = this.getAverageFps();

    // Don't change too frequently - stick with a setting
    if (avgFps < 30 && this.qualityLevel !== "low") {
      this.qualityLevel = "low";
      this.renderer.setPixelRatio(1);
      console.log("[ThreeManager] Reducing quality to low (FPS:", avgFps, ")");
    } else if (avgFps < 50 && avgFps >= 30 && this.qualityLevel !== "medium") {
      this.qualityLevel = "medium";
      this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
      console.log(
        "[ThreeManager] Setting quality to medium (FPS:",
        avgFps,
        ")",
      );
    } else if (avgFps >= 50 && this.qualityLevel !== "high" && !this.isMobile) {
      this.qualityLevel = "high";
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      console.log("[ThreeManager] Setting quality to high (FPS:", avgFps, ")");
    }
  }

  /**
   * Get current quality level
   */
  public getQualityLevel(): "high" | "medium" | "low" {
    return this.qualityLevel;
  }

  /**
   * Check if WebGL is available and working
   */
  public isWebGLAvailable(): boolean {
    return !this.isStaticFallback;
  }

  /**
   * Check if using reduced quality fallback
   */
  public isUsingReducedQuality(): boolean {
    return this.isWebGLFallback;
  }

  /**
   * Check if memory usage is high (static analysis)
   */
  public isMemoryUsageHigh(): boolean {
    // This is a best-effort estimate as browsers don't expose precise memory info
    const highFpsDropCount = this.fpsHistory.filter((fps) => fps < 20).length;
    return (
      highFpsDropCount >= 3 || this.isWebGLFallback || this.isStaticFallback
    );
  }
}

export default ThreeManager;
