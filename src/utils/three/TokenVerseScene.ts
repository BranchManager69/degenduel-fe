import * as THREE from "three";

import { Token, TokenHelpers } from "../../types";
import ThreeManager from "./ThreeManager";

interface TokenNode {
  id: number;
  symbol: string;
  name: string;
  price: number;
  marketCap: number;
  volume24h: number;
  change24h: number;
  mesh?: THREE.Mesh;
  highlightBeam?: THREE.Object3D;
  position: THREE.Vector3;
  velocity: THREE.Vector3;
  connections: TokenNode[];
  isHovered?: boolean;
}

export class TokenVerseScene {
  // Component ID for ThreeManager
  private readonly COMPONENT_ID = "token-verse-scene";

  // Three.js objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;

  // Node tracking
  private nodes: TokenNode[] = [];
  private raycaster = new THREE.Raycaster();
  private mouse = new THREE.Vector2(-1000, -1000);
  private targetCameraPosition = new THREE.Vector3(0, 0, 50);

  // Settings (can be updated)
  private settings = {
    intensity: 1.0,
    starIntensity: 1.0,
    bloomStrength: 1.0,
    updateFrequency: 1.0,
    particleCount: 2000,
  };

  // Background particles
  private particles?: THREE.Points;

  constructor(container: HTMLElement) {
    // Get ThreeManager instance
    const threeManager = ThreeManager.getInstance();

    // Register scene with ThreeManager
    const { scene, camera } = threeManager.createScene(this.COMPONENT_ID, {
      fov: 60,
      near: 0.1,
      far: 1000,
      position: new THREE.Vector3(0, 0, 50),
      lookAt: new THREE.Vector3(0, 0, 0),
    });

    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;

    // Setup scene
    this.setupScene();

    // Register with animation loop
    threeManager.registerScene(this.COMPONENT_ID, this.update.bind(this));

    // Add mouse move event listener
    document.addEventListener("mousemove", this.handleMouseMove.bind(this));

    // Add scroll listener
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
            .querySelector("#token-verse-container")
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
    // Calculate how far down the page we've scrolled (0 to 1)
    const scrollY = window.scrollY;
    const maxScroll = document.body.scrollHeight - window.innerHeight;
    const scrollFraction = Math.min(1, Math.max(0, scrollY / maxScroll));

    // Adjust camera position based on scroll
    const scrollPosition = new THREE.Vector3(
      0,
      -20 * scrollFraction, // Move camera down as we scroll
      50 + 20 * scrollFraction, // Move camera away as we scroll
    );

    // Blend with current target (for hover effects)
    this.targetCameraPosition.lerp(scrollPosition, 0.5);
  }

  private setupScene(): void {
    // Setup scene with fog for depth
    this.scene.fog = new THREE.FogExp2(0x000000, 0.01);

    // Add ambient light
    const ambientLight = new THREE.AmbientLight(0x404040, 3);
    this.scene.add(ambientLight);

    // Add point lights
    const lights = [
      { color: 0x0088ff, position: [50, 50, 50] as [number, number, number] },
      {
        color: 0xff8800,
        position: [-50, -50, -50] as [number, number, number],
      },
      { color: 0x00ff88, position: [-50, 50, -50] as [number, number, number] },
    ];

    lights.forEach(({ color, position }) => {
      const light = new THREE.PointLight(
        color,
        this.settings.intensity / 25,
        300,
      );
      light.position.set(position[0], position[1], position[2]);
      this.scene.add(light);
    });

    // Create background particles
    this.createBackgroundParticles();
  }

  private createBackgroundParticles(): void {
    // Clean up existing particles if any
    if (this.particles) {
      this.scene.remove(this.particles);
    }

    const threeManager = ThreeManager.getInstance();

    // Use shared geometry for particles
    const particleGeometry = threeManager.getOrCreateGeometry(
      "token-verse-particles",
      () => {
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(this.settings.particleCount * 3);

        for (let i = 0; i < this.settings.particleCount * 3; i += 3) {
          positions[i] = (Math.random() - 0.5) * 100;
          positions[i + 1] = (Math.random() - 0.5) * 100;
          positions[i + 2] = (Math.random() - 0.5) * 100;
        }

        geometry.setAttribute(
          "position",
          new THREE.BufferAttribute(positions, 3),
        );
        return geometry;
      },
    );

    // Use shared material for particles
    const particleMaterial = threeManager.getOrCreateMaterial(
      "token-verse-particle-material",
      () =>
        new THREE.PointsMaterial({
          size: 0.1,
          color: 0x88ccff,
          transparent: true,
          opacity: this.settings.starIntensity / 100,
          blending: THREE.AdditiveBlending,
        }),
    ) as THREE.PointsMaterial;

    // Update opacity based on current settings
    particleMaterial.opacity = this.settings.starIntensity / 100;

    this.particles = new THREE.Points(particleGeometry, particleMaterial);
    this.scene.add(this.particles);
  }

  // Update token data
  public updateTokenData(tokens: Token[]): void {
    // Process token data
    const nodes: TokenNode[] = tokens.map((token, index) => ({
      id: index,
      symbol: token.symbol,
      name: token.name,
      price: TokenHelpers.getPrice(token),
      marketCap: parseFloat(token.marketCap?.toString() || "0"),
      volume24h: parseFloat(token.volume24h?.toString() || "0"),
      change24h: parseFloat(token.change24h?.toString() || "0"), // Use 24h change for animations
      position: new THREE.Vector3(
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
        (Math.random() - 0.5) * 50,
      ),
      velocity: new THREE.Vector3(),
      connections: [],
    }));

    // Create connections
    nodes.forEach((node) => {
      const connectionCount = Math.floor(Math.random() * 3) + 1;
      const otherNodes = nodes.filter((n) => n.id !== node.id);
      node.connections = otherNodes
        .sort(() => Math.random() - 0.5)
        .slice(0, connectionCount);
    });

    // Remove old meshes
    this.nodes.forEach((node) => {
      if (node.mesh) this.scene.remove(node.mesh);
      if (node.highlightBeam) this.scene.remove(node.highlightBeam);
    });

    // Create new meshes
    this.createTokenMeshes(nodes);

    // Update nodes reference
    this.nodes = nodes;
  }

  private createTokenMeshes(nodes: TokenNode[]): void {
    const threeManager = ThreeManager.getInstance();

    nodes.forEach((node) => {
      const size = Math.max(0.2, Math.min(2, Math.log10(node.marketCap) * 0.2));

      // Use different geometries based on market cap for visual variety
      let geometry;
      if (node.marketCap > 1000000000) {
        // Large market cap - complex geometry
        geometry = threeManager.getOrCreateGeometry(
          "token-verse-large-cap",
          () => new THREE.IcosahedronGeometry(size, 2),
        );
      } else if (node.marketCap > 100000000) {
        // Medium market cap - dodecahedron
        geometry = threeManager.getOrCreateGeometry(
          "token-verse-medium-cap",
          () => new THREE.DodecahedronGeometry(size, 1),
        );
      } else if (node.marketCap > 10000000) {
        // Small market cap - octahedron
        geometry = threeManager.getOrCreateGeometry(
          "token-verse-small-cap",
          () => new THREE.OctahedronGeometry(size, 1),
        );
      } else {
        // Tiny market cap - tetrahedron
        geometry = threeManager.getOrCreateGeometry(
          "token-verse-tiny-cap",
          () => new THREE.TetrahedronGeometry(size, 0),
        );
      }

      // Create material - cannot share these as they have variable properties
      const positiveChange = node.change24h >= 0;
      const changeIntensity = Math.min(1, Math.abs(node.change24h) / 10);

      const material = new THREE.MeshPhongMaterial({
        color: positiveChange ? 0x00ff88 : 0xff4444,
        emissive: positiveChange ? 0x00aa44 : 0xaa2222,
        emissiveIntensity: 0.5 + changeIntensity,
        shininess: 100,
        transparent: true,
        opacity: 0.9,
        specular: 0xffffff,
      });

      const mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(node.position);

      // Add slight random rotation for more visual interest
      mesh.rotation.x = Math.random() * Math.PI;
      mesh.rotation.y = Math.random() * Math.PI;
      mesh.rotation.z = Math.random() * Math.PI;

      this.scene.add(mesh);
      node.mesh = mesh;
    });

    // Create connections as lines
    this.createConnectionLines(nodes);
  }

  private createConnectionLines(nodes: TokenNode[]): void {
    const threeManager = ThreeManager.getInstance();

    // Create line material for connections
    const lineMaterial = threeManager.getOrCreateMaterial(
      "token-verse-connection-line",
      () =>
        new THREE.LineBasicMaterial({
          color: 0x44aaff,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
        }),
    );

    // Create lines for connections
    nodes.forEach((node) => {
      if (!node.mesh) return;

      node.connections.forEach((connectedNode) => {
        if (!connectedNode.mesh) return;

        // Create line geometry
        const lineGeometry = new THREE.BufferGeometry().setFromPoints([
          node.position,
          connectedNode.position,
        ]);

        const line = new THREE.Line(lineGeometry, lineMaterial);
        this.scene.add(line);

        // Store the line for later updates
        (node as any).connectionLines = (node as any).connectionLines || [];
        (node as any).connectionLines.push({
          line,
          target: connectedNode,
        });
      });
    });
  }

  // Update settings
  public updateSettings(settings: Partial<typeof this.settings>): void {
    Object.assign(this.settings, settings);

    // Update relevant components based on new settings
    if (
      settings.starIntensity !== undefined ||
      settings.particleCount !== undefined
    ) {
      this.createBackgroundParticles();
    }

    // Update point light intensity
    if (settings.intensity !== undefined) {
      this.scene.children.forEach((child) => {
        if (child instanceof THREE.PointLight) {
          child.intensity = this.settings.intensity / 25;
        }
      });
    }
  }

  // Animation update function - called by ThreeManager
  private update(deltaTime: number): void {
    // Update particle positions
    if (this.particles) {
      const positions = this.particles.geometry.attributes.position
        .array as Float32Array;
      for (let i = 0; i < positions.length; i += 3) {
        positions[i + 1] += 0.01 * (this.settings.updateFrequency / 100);
        if (positions[i + 1] > 50) positions[i + 1] = -50;
      }
      this.particles.geometry.attributes.position.needsUpdate = true;
    }

    // Perform raycasting to detect hover
    if (this.nodes.length > 0) {
      this.raycaster.setFromCamera(this.mouse, this.camera);
      const meshes = this.nodes
        .filter((node) => node.mesh)
        .map((node) => node.mesh!);

      const intersects = this.raycaster.intersectObjects(meshes);

      // Reset all hover states
      this.nodes.forEach((node) => {
        if (node.isHovered && node.mesh) {
          node.isHovered = false;
          if (node.highlightBeam) {
            this.scene.remove(node.highlightBeam);
            node.highlightBeam = undefined;
          }

          // Restore original scale
          node.mesh.scale.set(1, 1, 1);
        }
      });

      // Handle new intersections
      if (intersects.length > 0) {
        const hoveredNode = this.nodes.find(
          (node) => node.mesh === intersects[0].object,
        );

        if (hoveredNode) {
          // Handle hover effects
          this.handleNodeHover(hoveredNode);
        }
      } else {
        // If no hover, gradually return to original position
        this.targetCameraPosition.lerp(new THREE.Vector3(0, 0, 50), 0.05);
      }

      // Smoothly move camera toward target position
      this.camera.position.lerp(this.targetCameraPosition, 0.02);

      // Update token nodes
      this.updateNodes(deltaTime);

      // Update connection lines
      this.updateConnectionLines();
    }
  }

  private handleNodeHover(node: TokenNode): void {
    node.isHovered = true;

    // Make hovered token slightly larger
    if (node.mesh) {
      node.mesh.scale.set(1.3, 1.3, 1.3);
    }

    // Create neon light beam for highlighted token
    if (!node.highlightBeam) {
      // Create cylinder that points upward from the token
      const beamGeometry = new THREE.CylinderGeometry(0.2, 2, 40, 16, 1, true);
      const beamMaterial = new THREE.MeshBasicMaterial({
        color: node.change24h >= 0 ? 0x00ff88 : 0xff4444,
        transparent: true,
        opacity: 0.3,
        side: THREE.DoubleSide,
      });

      const beam = new THREE.Mesh(beamGeometry, beamMaterial);
      beam.position.copy(node.position);
      beam.position.y += 20; // Position the beam above the token
      beam.rotation.x = Math.PI / 2; // Rotate to point upward

      this.scene.add(beam);
      node.highlightBeam = beam;

      // Update camera target to focus on hovered node
      const targetPosition = new THREE.Vector3().copy(node.position);
      targetPosition.z += 30; // Keep some distance
      this.targetCameraPosition.copy(targetPosition);
    }
  }

  private updateNodes(_deltaTime: number): void {
    this.nodes.forEach((node) => {
      if (!node.mesh) return;

      // Apply forces
      node.connections.forEach((connectedNode) => {
        if (!connectedNode.mesh) return;
        const distance = node.position.distanceTo(connectedNode.position);
        const force = new THREE.Vector3()
          .subVectors(connectedNode.position, node.position)
          .normalize()
          .multiplyScalar(0.001 * distance);
        node.velocity.add(force);
      });

      // Apply center gravity
      const centerForce = new THREE.Vector3()
        .sub(node.position)
        .normalize()
        .multiplyScalar(0.01);
      node.velocity.add(centerForce);

      // Update position
      node.velocity.multiplyScalar(0.95); // Damping
      node.position.add(node.velocity);
      node.mesh.position.copy(node.position);

      // Update highlight beam position if it exists
      if (node.highlightBeam) {
        node.highlightBeam.position.copy(node.position);
        node.highlightBeam.position.y += 20;

        // Add subtle animation to the beam
        node.highlightBeam.rotation.z += 0.01;
      }

      // Rotate based on price change
      node.mesh.rotation.x += 0.01 * Math.sign(node.change24h);
      node.mesh.rotation.y += 0.01 * Math.sign(node.change24h);
    });
  }

  private updateConnectionLines(): void {
    this.nodes.forEach((node) => {
      if (!(node as any).connectionLines) return;

      (node as any).connectionLines.forEach((connection: any) => {
        const { line, target } = connection;

        // Update line positions
        const positions = [node.position, target.position];
        line.geometry.setFromPoints(positions);
        line.geometry.attributes.position.needsUpdate = true;
      });
    });
  }

  public dispose(): void {
    // Remove event listeners
    document.removeEventListener("mousemove", this.handleMouseMove);
    window.removeEventListener("scroll", this.handleScroll);

    // Clean up nodes
    this.nodes.forEach((node) => {
      if (node.mesh) {
        this.scene.remove(node.mesh);
        if ((node as any).connectionLines) {
          (node as any).connectionLines.forEach((connection: any) => {
            this.scene.remove(connection.line);
          });
        }
      }
      if (node.highlightBeam) {
        this.scene.remove(node.highlightBeam);
      }
    });

    // Clean up particles
    if (this.particles) {
      this.scene.remove(this.particles);
    }

    // Unregister from ThreeManager
    ThreeManager.getInstance().removeScene(this.COMPONENT_ID);

    console.log("[TokenVerseScene] Disposed");
  }
}

export default TokenVerseScene;
