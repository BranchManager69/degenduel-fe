import * as THREE from 'three';

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
  private animationCallbacks: Map<string, (deltaTime: number) => void> = new Map();
  private lastFrameTime: number = 0;
  private animationFrameId: number | null = null;
  
  // Performance monitoring
  private frameCounter: number = 0;
  private fpsUpdateInterval: number = 500; // ms
  private lastFpsUpdate: number = 0;
  private currentFps: number = 0;
  private fpsHistory: number[] = [];
  private qualityLevel: 'high' | 'medium' | 'low' = 'high';
  
  // Device detection
  private isMobile: boolean = false;
  
  private constructor() {
    // Detect mobile
    this.isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
    
    // Start with an appropriate quality level
    this.qualityLevel = this.isMobile ? 'medium' : 'high';
    
    // Create renderer with optimal settings
    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isMobile, // Disable antialiasing on mobile for performance
      alpha: true,
      powerPreference: 'high-performance',
      stencil: false,
      depth: true
    });
    
    // Configure renderer
    this.renderer.setPixelRatio(this.isMobile ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    // Update from outputEncoding (deprecated) to the new outputColorSpace property
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    
    // We no longer initialize unused main scene and camera
    // Each component will register its own scene and camera through registerScene
    
    // Set up resize handler with debounce for performance
    let resizeTimeout: number | null = null;
    window.addEventListener('resize', () => {
      if (resizeTimeout) window.clearTimeout(resizeTimeout);
      resizeTimeout = window.setTimeout(() => {
        this.handleResize();
        resizeTimeout = null;
      }, 200);
    });
    
    // Start animation loop
    this.startAnimationLoop();
    
    console.log('[ThreeManager] Initialized with quality level:', this.qualityLevel);
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
      
      // Setting the renderer style to position: fixed with z-index: -1
      // ensures it's behind all content but visible everywhere
      this.renderer.domElement.style.position = 'fixed';
      this.renderer.domElement.style.top = '0';
      this.renderer.domElement.style.left = '0';
      this.renderer.domElement.style.width = '100%';
      this.renderer.domElement.style.height = '100%';
      this.renderer.domElement.style.zIndex = '-1';
      this.renderer.domElement.style.pointerEvents = 'none';
    }
  }
  
  /**
   * Add the renderer to a DOM element for a specific component (alias for attachRenderer)
   */
  public attachToContainer(componentId: string, domElement: HTMLElement): void {
    this.attachRenderer(componentId, domElement);
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
    renderOrder: number = 0
  ): { scene: THREE.Scene, camera: THREE.Camera } {
    const scene = new THREE.Scene();
    
    // Create camera with options or defaults
    const fov = cameraOptions?.fov ?? 70;
    const near = cameraOptions?.near ?? 0.1;
    const far = cameraOptions?.far ?? 1000;
    const camera = new THREE.PerspectiveCamera(
      fov,
      window.innerWidth / window.innerHeight,
      near,
      far
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
    animationCallback: (deltaTime: number) => void
  ): void {
    // Register the animation callback
    this.registerAnimation(componentId, animationCallback);
    
    console.log(`[ThreeManager] Registered animation for scene: ${componentId}`);
  }
  
  /**
   * Insert a component ID into the render order array
   */
  private insertInRenderOrder(componentId: string, order: number): void {
    // Remove if already exists
    this.renderOrder = this.renderOrder.filter(id => id !== componentId);
    
    // Find insertion point based on order
    const allComponents = this.renderOrder.map((id, index) => ({ id, index }));
    const insertPoint = allComponents.findIndex(
      component => order > parseInt(component.id.split('-')[1] || '0')
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
    this.renderOrder = this.renderOrder.filter(id => id !== componentId);
    
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
    callback: (deltaTime: number) => void
  ): void {
    this.animationCallbacks.set(componentId, callback);
  }
  
  /**
   * Get or create a shared geometry
   */
  public getOrCreateGeometry(
    key: string, 
    creator: () => THREE.BufferGeometry
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
    creator: () => THREE.Material
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
    creator: () => THREE.Texture
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
    const animate = (time: number) => {
      this.animationFrameId = requestAnimationFrame(animate);
      
      // Calculate delta time
      const deltaTime = this.lastFrameTime ? (time - this.lastFrameTime) / 1000 : 0.016;
      this.lastFrameTime = time;
      
      // Update FPS counter
      this.frameCounter++;
      if (time - this.lastFpsUpdate > this.fpsUpdateInterval) {
        this.currentFps = Math.round(
          (this.frameCounter * 1000) / (time - this.lastFpsUpdate)
        );
        
        this.lastFpsUpdate = time;
        this.frameCounter = 0;
        
        // Store in history
        this.fpsHistory.push(this.currentFps);
        if (this.fpsHistory.length > 10) {
          this.fpsHistory.shift();
        }
        
        // Adjust quality if needed (not too often)
        if (this.fpsHistory.length >= 5) {
          this.adjustQualityForPerformance();
        }
      }
      
      // Run component animation callbacks
      this.animationCallbacks.forEach(callback => {
        try {
          callback(deltaTime);
        } catch (error) {
          console.error('[ThreeManager] Error in animation callback:', error);
        }
      });
      
      // Clear the renderer once
      this.renderer.clear();
      
      // Render all registered scenes in order
      this.renderOrder.forEach(componentId => {
        const scene = this.scenes.get(componentId);
        const camera = this.cameras.get(componentId);
        
        if (scene && camera) {
          // Render the scene
          this.renderer.render(scene, camera);
        }
      });
    };
    
    this.animationFrameId = requestAnimationFrame(animate);
  }
  
  /**
   * Handle window resize
   */
  private handleResize(): void {
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    
    // Update all cameras
    this.cameras.forEach(camera => {
      if (camera instanceof THREE.PerspectiveCamera) {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
      }
    });
    
    console.log('[ThreeManager] Resized renderer');
  }
  
  /**
   * Clean up resources
   */
  public dispose(): void {
    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
    }
    
    // Dispose all resources
    this.geometries.forEach(geometry => geometry.dispose());
    this.materials.forEach(material => material.dispose());
    this.textures.forEach(texture => texture.dispose());
    
    this.renderer.dispose();
    
    console.log('[ThreeManager] Disposed all resources');
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
    if (avgFps < 30 && this.qualityLevel !== 'low') {
      this.qualityLevel = 'low';
      this.renderer.setPixelRatio(1);
      console.log('[ThreeManager] Reducing quality to low (FPS:', avgFps, ')');
    } else if (avgFps < 50 && avgFps >= 30 && this.qualityLevel !== 'medium') {
      this.qualityLevel = 'medium';
      this.renderer.setPixelRatio(Math.min(1.5, window.devicePixelRatio));
      console.log('[ThreeManager] Setting quality to medium (FPS:', avgFps, ')');
    } else if (avgFps >= 50 && this.qualityLevel !== 'high' && !this.isMobile) {
      this.qualityLevel = 'high';
      this.renderer.setPixelRatio(Math.min(2, window.devicePixelRatio));
      console.log('[ThreeManager] Setting quality to high (FPS:', avgFps, ')');
    }
  }
  
  /**
   * Get current quality level
   */
  public getQualityLevel(): 'high' | 'medium' | 'low' {
    return this.qualityLevel;
  }
}

export default ThreeManager;