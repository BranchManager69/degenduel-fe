import * as THREE from "three";

import { TokenData } from "../../types";
import ThreeManager from "./ThreeManager";

export class MarketVerseScene {
  // Component ID for ThreeManager
  private readonly COMPONENT_ID = "market-verse-scene";

  // Three.js objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // References to objects
  private spheres: THREE.Mesh[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-1000, -1000);
  private targetCameraPosition = new THREE.Vector3(0, 100, 400);
  private highlightedSphere: THREE.Mesh | null = null;

  // Game state
  private lastUpdateTime?: Date;

  constructor(container: HTMLElement) {
    // Get ThreeManager instance
    const threeManager = ThreeManager.getInstance();

    // Register scene with ThreeManager
    const { scene, camera } = threeManager.createScene(this.COMPONENT_ID, {
      fov: 45,
      near: 1,
      far: 2000,
      position: new THREE.Vector3(0, 100, 400),
      lookAt: new THREE.Vector3(0, 0, 0),
    });

    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;

    // Position camera
    this.camera.position.z = 400;
    this.camera.position.y = 100;
    this.camera.lookAt(0, 0, 0);
    this.targetCameraPosition.copy(this.camera.position);

    // Setup scene
    this.setupScene();

    // Register with animation loop
    threeManager.registerScene(this.COMPONENT_ID, this.update.bind(this));

    // Add mouse move event listener
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));

    // Add scroll event listener
    window.addEventListener("scroll", this.handleScroll.bind(this));

    // Attach to container
    threeManager.attachToContainer(this.COMPONENT_ID, container);
  }

  private handleMouseMove(event: MouseEvent): void {
    // Calculate mouse position in normalized device coordinates
    const rect =
      this.camera.aspect === window.innerWidth / window.innerHeight
        ? {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          }
        : document
            .querySelector("#market-verse-container")
            ?.getBoundingClientRect() || {
            left: 0,
            top: 0,
            width: window.innerWidth,
            height: window.innerHeight,
          };

    this.mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    this.mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private handleScroll(): void {
    // Calculate scroll position as a percentage
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollPercent = Math.min(1, Math.max(0, scrollY / maxScroll));

    // Adjust camera target based on scroll
    const scrollTarget = new THREE.Vector3(
      0,
      100 + scrollPercent * 50, // Move up as we scroll
      400 - scrollPercent * 100, // Move closer as we scroll
    );

    // Smoothly transition to new position
    this.targetCameraPosition.lerp(scrollTarget, 0.5);
  }

  // Setup scene with shared resources
  private setupScene(): void {
    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040);
    this.scene.add(ambientLight);

    // Add point light
    const light = new THREE.PointLight(0xffffff, 1, 1000);
    light.position.set(100, 100, 100);
    this.scene.add(light);

    // Setup background
    this.scene.background = new THREE.Color(0x000000);

    // Add fog for depth
    this.scene.fog = new THREE.FogExp2(0x000000, 0.001);
  }

  // Update market data
  public updateMarketData(marketData: TokenData[]): void {
    // Clear existing spheres
    this.spheres.forEach((sphere) => this.scene.remove(sphere));
    this.spheres = [];

    // Create spheres based on token data
    const threeManager = ThreeManager.getInstance();

    marketData.forEach((token) => {
      const price = parseFloat(token.price?.toString() || "0");
      const volume = parseFloat(token.volume24h?.toString() || "0");
      const change = parseFloat(token.change24h?.toString() || "0");

      // Scale sphere size based on volume
      const size = Math.max(0.5, Math.min(5, Math.log10(volume + 1) * 0.5));

      // Get shared geometry
      const geometry = threeManager.getOrCreateGeometry(
        `market-sphere-${size.toFixed(1)}`,
        () => new THREE.SphereGeometry(size, 32, 32),
      );

      // Determine color based on price change
      const color = change >= 0 ? 0x00ff44 : 0xff4444;
      const emissiveColor = change >= 0 ? 0x00aa22 : 0xaa2222;
      const emissiveIntensity = Math.min(1, Math.abs(change) / 10);

      // Create material (cannot share as each has unique colors)
      const material = new THREE.MeshPhongMaterial({
        color: color,
        emissive: emissiveColor,
        emissiveIntensity: emissiveIntensity,
        shininess: 90,
        specular: 0xffffff,
      });

      // Create sphere
      const sphere = new THREE.Mesh(geometry, material);

      // Position randomly
      sphere.position.x = (Math.random() - 0.5) * 200;
      sphere.position.y = (Math.random() - 0.5) * 200;
      sphere.position.z = (Math.random() - 0.5) * 200;

      // Save token data on sphere for interaction
      (sphere as any).userData = {
        token: token.symbol,
        price: price,
        change: change,
      };

      this.scene.add(sphere);
      this.spheres.push(sphere);
    });

    this.lastUpdateTime = new Date();
  }

  // Animation update function - called by ThreeManager
  private update(_deltaTime: number): void {
    // Update visual elements

    // Perform raycasting for hover effects
    this.raycaster.setFromCamera(this.mouse, this.camera);
    const intersects = this.raycaster.intersectObjects(this.spheres);

    // Reset previous highlight
    if (
      this.highlightedSphere &&
      (!intersects.length || this.highlightedSphere !== intersects[0].object)
    ) {
      const material = this.highlightedSphere
        .material as THREE.MeshPhongMaterial;
      material.emissiveIntensity *= 0.5; // Reduce glow
      this.highlightedSphere.scale.set(1, 1, 1); // Reset scale
      this.highlightedSphere = null;
    }

    // Create highlight effect and adjust camera focus
    if (intersects.length > 0) {
      const sphere = intersects[0].object as THREE.Mesh;
      if (sphere !== this.highlightedSphere) {
        this.highlightedSphere = sphere;
        const material = sphere.material as THREE.MeshPhongMaterial;
        material.emissiveIntensity *= 2; // Increase glow
        sphere.scale.set(1.2, 1.2, 1.2); // Scale up

        // Move camera to focus on highlighted sphere
        const targetPos = new THREE.Vector3().copy(sphere.position);
        targetPos.z += 150; // Keep some distance
        this.targetCameraPosition.copy(targetPos);

        // Maybe show token info tooltip here if needed
      }
    } else {
      // If no hover, gradually return to original position
      this.targetCameraPosition.lerp(new THREE.Vector3(0, 100, 400), 0.02);
    }

    // Smoothly move camera toward target position
    this.camera.position.lerp(this.targetCameraPosition, 0.03);

    // Animate spheres
    this.spheres.forEach((sphere) => {
      // Get token change from userData
      const change = (sphere as any).userData.change || 0;

      // Rotate based on price change direction
      sphere.rotation.x += 0.005 * Math.sign(change);
      sphere.rotation.y += 0.005 * Math.sign(change);

      // Add gentle floating motion
      sphere.position.y +=
        Math.sin(Date.now() * 0.001 + sphere.position.x) * 0.05;
    });
  }

  // Cleanup resources
  public dispose(): void {
    // Clean up event listeners
    document.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("scroll", this.handleScroll);

    // Unregister from ThreeManager
    ThreeManager.getInstance().removeScene(this.COMPONENT_ID);

    console.log("[MarketVerseScene] Disposed");
  }

  // Getter for last update time
  public getLastUpdateTime(): Date | undefined {
    return this.lastUpdateTime;
  }
}

export default MarketVerseScene;
