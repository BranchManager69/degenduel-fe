import * as THREE from 'three';
import ThreeManager from './ThreeManager';

/**
 * DodgeballScene - Manages the 3D scene for the dodgeball particle effect
 * 
 * This class uses InstancedMesh for efficient rendering of large numbers
 * of particles, dramatically improving performance over individual meshes.
 */
export class DodgeballScene {
  // Component ID for ThreeManager
  private readonly COMPONENT_ID = 'dodgeball-scene';
  
  // Three.js objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  // Instanced meshes
  private redPlayers: THREE.InstancedMesh | null = null;
  private greenPlayers: THREE.InstancedMesh | null = null;
  private blueBalls: THREE.InstancedMesh | null = null;
  
  // Trail effects
  private redTrails: THREE.InstancedMesh | null = null;
  private greenTrails: THREE.InstancedMesh | null = null;
  private blueTrails: THREE.InstancedMesh | null = null;
  
  // Collision effects
  private collisionEffects: THREE.InstancedMesh | null = null;
  
  // Court elements
  private court: THREE.Mesh | null = null;
  private centerLine: THREE.Mesh | null = null;
  
  // Lights
  private redLight: THREE.PointLight | null = null;
  private greenLight: THREE.PointLight | null = null;
  private centerLight: THREE.PointLight | null = null;
  
  // Camera animation
  private initialCameraAnimation = true;
  private cameraStartTime = 0;
  private cameraAnimationDuration = 3.0; // seconds
  
  // Particle counts
  private particleCount = {
    red: 0,
    green: 0,
    blueBalls: 0
  };
  
  // Matrices and vectors for updates
  private matrix = new THREE.Matrix4();
  private rotation = new THREE.Euler();
  private quaternion = new THREE.Quaternion();
  private position = new THREE.Vector3();
  private scale = new THREE.Vector3(1, 1, 1);
  
  // Position and velocity arrays
  private redPositions: Float32Array = new Float32Array(0);
  private greenPositions: Float32Array = new Float32Array(0);
  private blueBallsPositions: Float32Array = new Float32Array(0);
  private redVelocities: Float32Array = new Float32Array(0);
  private greenVelocities: Float32Array = new Float32Array(0);
  private blueBallsVelocities: Float32Array = new Float32Array(0);
  
  // Game state
  private gameState = {
    phase: 'ready' as 'ready' | 'rush' | 'battle' | 'endgame',
    phaseStartTime: 0,
    redTeamActive: 0,
    greenTeamActive: 0,
    redTeamBalls: 0,
    greenTeamBalls: 0,
    ballOwnership: [] as (-1 | 0 | 1)[],
    playerStatus: {
      red: [] as ('active' | 'eliminated' | 'carrying')[],
      green: [] as ('active' | 'eliminated' | 'carrying')[]
    },
    lastHitTime: 0,
    rushComplete: false
  };
  
  // Trail positions
  private redTrailPositions: THREE.Vector3[][] = [];
  private greenTrailPositions: THREE.Vector3[][] = [];
  private blueTrailPositions: THREE.Vector3[][] = [];
  
  // Active collisions
  private activeCollisions = 0;
  private maxCollisions = 100;
  private collisionAge: Float32Array = new Float32Array(0);
  
  // Animation variables
  private time = 0;
  private isPaused = false;
  
  // Player energy levels
  private redEnergies: Float32Array = new Float32Array(0);
  private greenEnergies: Float32Array = new Float32Array(0);
  
  constructor(
    container: HTMLElement,
    particleCountRed: number = 150,
    particleCountGreen: number = 150,
    particleCountBlueBalls: number = 40
  ) {
    // Get ThreeManager instance
    const threeManager = ThreeManager.getInstance();
    
    // Set particle counts
    this.particleCount = {
      red: particleCountRed,
      green: particleCountGreen,
      blueBalls: particleCountBlueBalls
    };
    
    // Initialize position and velocity arrays
    this.initializeArrays();
    
    // Register scene with ThreeManager
    const { scene, camera } = threeManager.createScene(
      this.COMPONENT_ID,
      {
        fov: 75,
        near: 0.1,
        far: 1000,
        position: new THREE.Vector3(0, 15, 25),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      10 // Render order - higher numbers render on top
    );
    
    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;
    
    // Set initial camera position directly above the court
    this.camera.position.set(0, 40, 0);
    this.camera.lookAt(0, 0, 0);
    
    // Start the camera animation
    this.cameraStartTime = this.time;
    
    // Setup scene
    this.setupScene();
    
    // Register scene for animation updates
    threeManager.registerScene(this.COMPONENT_ID, this.animate.bind(this));
    
    // Attach renderer to container
    threeManager.attachRenderer(this.COMPONENT_ID, container);
  }
  
  /**
   * Initialize position and velocity arrays
   */
  private initializeArrays(): void {
    // Red team
    this.redPositions = new Float32Array(this.particleCount.red * 3);
    this.redVelocities = new Float32Array(this.particleCount.red * 3);
    this.redEnergies = new Float32Array(this.particleCount.red);
    this.gameState.playerStatus.red = new Array(this.particleCount.red).fill('active');
    
    // Green team
    this.greenPositions = new Float32Array(this.particleCount.green * 3);
    this.greenVelocities = new Float32Array(this.particleCount.green * 3);
    this.greenEnergies = new Float32Array(this.particleCount.green);
    this.gameState.playerStatus.green = new Array(this.particleCount.green).fill('active');
    
    // Blue balls
    this.blueBallsPositions = new Float32Array(this.particleCount.blueBalls * 3);
    this.blueBallsVelocities = new Float32Array(this.particleCount.blueBalls * 3);
    this.gameState.ballOwnership = new Array(this.particleCount.blueBalls).fill(-1);
    
    // Collision effects
    this.collisionAge = new Float32Array(this.maxCollisions);
    
    // Initialize trail positions
    for (let i = 0; i < this.particleCount.red; i++) {
      this.redTrailPositions.push([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ]);
    }
    
    for (let i = 0; i < this.particleCount.green; i++) {
      this.greenTrailPositions.push([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ]);
    }
    
    for (let i = 0; i < this.particleCount.blueBalls; i++) {
      this.blueTrailPositions.push([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3()
      ]);
    }
  }
  
  /**
   * Set up the 3D scene
   */
  private setupScene(): void {
    const threeManager = ThreeManager.getInstance();
    
    // Create shared geometries
    const playerGeometry = threeManager.getOrCreateGeometry(
      'dodgeball-player',
      () => new THREE.IcosahedronGeometry(0.3, 1) // Low-poly sphere for players
    );
    
    const ballGeometry = threeManager.getOrCreateGeometry(
      'dodgeball-ball',
      () => new THREE.IcosahedronGeometry(0.4, 2) // Higher-detail sphere for balls
    );
    
    const trailGeometry = threeManager.getOrCreateGeometry(
      'dodgeball-trail',
      () => new THREE.IcosahedronGeometry(0.3, 1) // Low-poly sphere for trails
    );
    
    const collisionGeometry = threeManager.getOrCreateGeometry(
      'dodgeball-collision',
      () => new THREE.IcosahedronGeometry(0.1, 1) // Small sphere for collision particles
    );
    
    // Create shared materials
    const redMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-red',
      () => new THREE.MeshStandardMaterial({
        color: 0xff3333,
        emissive: 0xff0000,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.7
      })
    ) as THREE.MeshStandardMaterial;
    
    const greenMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-green',
      () => new THREE.MeshStandardMaterial({
        color: 0x33ff33,
        emissive: 0x00ff00,
        emissiveIntensity: 0.3,
        roughness: 0.4,
        metalness: 0.7
      })
    ) as THREE.MeshStandardMaterial;
    
    const blueMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-blue',
      () => new THREE.MeshStandardMaterial({
        color: 0x4488ff,
        emissive: 0x0044ff,
        emissiveIntensity: 0.5,
        roughness: 0.2,
        metalness: 0.8
      })
    ) as THREE.MeshStandardMaterial;
    
    const redTrailMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-red-trail',
      () => new THREE.MeshBasicMaterial({
        color: 0xff3333,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      })
    ) as THREE.MeshBasicMaterial;
    
    const greenTrailMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-green-trail',
      () => new THREE.MeshBasicMaterial({
        color: 0x33ff33,
        transparent: true,
        opacity: 0.3,
        blending: THREE.AdditiveBlending
      })
    ) as THREE.MeshBasicMaterial;
    
    const blueTrailMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-blue-trail',
      () => new THREE.MeshBasicMaterial({
        color: 0x4488ff,
        transparent: true,
        opacity: 0.5,
        blending: THREE.AdditiveBlending
      })
    ) as THREE.MeshBasicMaterial;
    
    const collisionMaterial = threeManager.getOrCreateMaterial(
      'dodgeball-collision',
      () => new THREE.MeshBasicMaterial({
        color: 0xffffff,
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending
      })
    ) as THREE.MeshBasicMaterial;
    
    // Create instanced meshes
    this.redPlayers = new THREE.InstancedMesh(
      playerGeometry,
      redMaterial,
      this.particleCount.red
    );
    this.redPlayers.name = 'redPlayers';
    this.scene.add(this.redPlayers);
    
    this.greenPlayers = new THREE.InstancedMesh(
      playerGeometry,
      greenMaterial,
      this.particleCount.green
    );
    this.greenPlayers.name = 'greenPlayers';
    this.scene.add(this.greenPlayers);
    
    this.blueBalls = new THREE.InstancedMesh(
      ballGeometry,
      blueMaterial,
      this.particleCount.blueBalls
    );
    this.blueBalls.name = 'blueBalls';
    this.scene.add(this.blueBalls);
    
    // Create trail meshes - 3 segments per particle
    this.redTrails = new THREE.InstancedMesh(
      trailGeometry,
      redTrailMaterial,
      this.particleCount.red * 3
    );
    this.redTrails.name = 'redTrails';
    this.scene.add(this.redTrails);
    
    this.greenTrails = new THREE.InstancedMesh(
      trailGeometry,
      greenTrailMaterial,
      this.particleCount.green * 3
    );
    this.greenTrails.name = 'greenTrails';
    this.scene.add(this.greenTrails);
    
    this.blueTrails = new THREE.InstancedMesh(
      trailGeometry,
      blueTrailMaterial,
      this.particleCount.blueBalls * 3
    );
    this.blueTrails.name = 'blueTrails';
    this.scene.add(this.blueTrails);
    
    // Create collision effects mesh
    this.collisionEffects = new THREE.InstancedMesh(
      collisionGeometry,
      collisionMaterial,
      this.maxCollisions
    );
    this.collisionEffects.name = 'collisionEffects';
    this.scene.add(this.collisionEffects);
    
    // Create dodgeball court
    const courtGeometry = new THREE.PlaneGeometry(50, 30);
    const courtMaterial = new THREE.MeshBasicMaterial({
      color: 0x222266,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide
    });
    
    this.court = new THREE.Mesh(courtGeometry, courtMaterial);
    this.court.rotation.x = Math.PI / 2;
    this.court.position.y = -0.5;
    this.scene.add(this.court);
    
    // Create center line
    const centerLineGeometry = new THREE.PlaneGeometry(0.5, 30);
    const centerLineMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.5,
      side: THREE.DoubleSide
    });
    
    this.centerLine = new THREE.Mesh(centerLineGeometry, centerLineMaterial);
    this.centerLine.rotation.x = Math.PI / 2;
    this.centerLine.position.y = -0.4;
    this.scene.add(this.centerLine);
    
    // Add subtle visual indicators for team sides
    const redSideMaterial = new THREE.MeshBasicMaterial({
      color: 0xff0000,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide
    });
    
    const greenSideMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide
    });
    
    // Red side indicator (left)
    const redSideGeometry = new THREE.PlaneGeometry(25, 30);
    const redSide = new THREE.Mesh(redSideGeometry, redSideMaterial);
    redSide.rotation.x = Math.PI / 2;
    redSide.position.set(-12.5, -0.45, 0);
    this.scene.add(redSide);
    
    // Green side indicator (right)
    const greenSideGeometry = new THREE.PlaneGeometry(25, 30);
    const greenSide = new THREE.Mesh(greenSideGeometry, greenSideMaterial);
    greenSide.rotation.x = Math.PI / 2;
    greenSide.position.set(12.5, -0.45, 0);
    this.scene.add(greenSide);
    
    // Add team-colored lighting
    this.redLight = new THREE.PointLight(0xff3333, 0.6, 30);
    this.redLight.position.set(-15, 5, 0);
    this.scene.add(this.redLight);
    
    this.greenLight = new THREE.PointLight(0x33ff33, 0.6, 30);
    this.greenLight.position.set(15, 5, 0);
    this.scene.add(this.greenLight);
    
    this.centerLight = new THREE.PointLight(0x4488ff, 0.5, 15);
    this.centerLight.position.set(0, 5, 0);
    this.scene.add(this.centerLight);
    
    // Set up initial positions
    this.setupInitialPositions();
  }
  
  /**
   * Set up initial positions for all particles
   */
  private setupInitialPositions(): void {
    // Initialize matrices - these will be used to update positions
    // during animation
    
    // 1. Set up red team in formation on left side
    for (let i = 0; i < this.particleCount.red; i++) {
      const rowSize = Math.ceil(Math.sqrt(this.particleCount.red));
      const row = Math.floor(i / rowSize);
      const col = i % rowSize;
      
      // Create a grid formation on the left side
      const xSpread = 8; // Width of formation
      const zSpread = 8; // Depth of formation
      const x = -20 + (col / rowSize) * xSpread - xSpread / 2; // Left side
      const z = -zSpread / 2 + (row / rowSize) * zSpread;
      const y = 0;
      
      // Set position
      this.redPositions[i * 3] = x;
      this.redPositions[i * 3 + 1] = y;
      this.redPositions[i * 3 + 2] = z;
      
      // Set initial velocities to zero
      this.redVelocities[i * 3] = 0;
      this.redVelocities[i * 3 + 1] = 0;
      this.redVelocities[i * 3 + 2] = 0;
      
      // Set energy level
      this.redEnergies[i] = 0.7 + Math.random() * 0.3;
      
      // Hide trails initially
      for (let t = 0; t < 3; t++) {
        this.matrix.makeScale(0, 0, 0); // Scale to zero = invisible
        this.redTrails?.setMatrixAt(i * 3 + t, this.matrix);
      }
      
      // Set initial matrix for player
      this.position.set(x, y, z);
      this.quaternion.setFromEuler(this.rotation);
      this.scale.set(1, 1, 1);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.redPlayers?.setMatrixAt(i, this.matrix);
    }
    
    // 2. Set up green team in formation on right side
    for (let i = 0; i < this.particleCount.green; i++) {
      const rowSize = Math.ceil(Math.sqrt(this.particleCount.green));
      const row = Math.floor(i / rowSize);
      const col = i % rowSize;
      
      // Create a grid formation on the right side
      const xSpread = 8; // Width of formation
      const zSpread = 8; // Depth of formation
      const x = 20 - (col / rowSize) * xSpread + xSpread / 2; // Right side
      const z = -zSpread / 2 + (row / rowSize) * zSpread;
      const y = 0;
      
      // Set position
      this.greenPositions[i * 3] = x;
      this.greenPositions[i * 3 + 1] = y;
      this.greenPositions[i * 3 + 2] = z;
      
      // Set initial velocities to zero
      this.greenVelocities[i * 3] = 0;
      this.greenVelocities[i * 3 + 1] = 0;
      this.greenVelocities[i * 3 + 2] = 0;
      
      // Set energy level
      this.greenEnergies[i] = 0.7 + Math.random() * 0.3;
      
      // Hide trails initially
      for (let t = 0; t < 3; t++) {
        this.matrix.makeScale(0, 0, 0); // Scale to zero = invisible
        this.greenTrails?.setMatrixAt(i * 3 + t, this.matrix);
      }
      
      // Set initial matrix for player
      this.position.set(x, y, z);
      this.quaternion.setFromEuler(this.rotation);
      this.scale.set(1, 1, 1);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.greenPlayers?.setMatrixAt(i, this.matrix);
    }
    
    // 3. Set up blue dodgeballs in center court
    for (let i = 0; i < this.particleCount.blueBalls; i++) {
      // Position dodgeballs in a line at center court
      const lineWidth = 10; // Width of the center line
      const segments = Math.ceil(Math.sqrt(this.particleCount.blueBalls));
      const col = i % segments;
      
      // Create a line of balls down center court
      const x = 0; // Center
      const z = -lineWidth / 2 + (col / segments) * lineWidth;
      const y = 0.5; // Slightly elevated
      
      // Add slight random offset
      const jitter = 0.5;
      const randomOffset = Math.random() - 0.5;
      const xJitter = randomOffset * jitter;
      const zJitter = randomOffset * jitter;
      
      // Set position
      this.blueBallsPositions[i * 3] = x + xJitter;
      this.blueBallsPositions[i * 3 + 1] = y;
      this.blueBallsPositions[i * 3 + 2] = z + zJitter;
      
      // Set initial velocities to zero
      this.blueBallsVelocities[i * 3] = 0;
      this.blueBallsVelocities[i * 3 + 1] = 0;
      this.blueBallsVelocities[i * 3 + 2] = 0;
      
      // No owner initially
      this.gameState.ballOwnership[i] = -1;
      
      // Hide trails initially
      for (let t = 0; t < 3; t++) {
        this.matrix.makeScale(0, 0, 0); // Scale to zero = invisible
        this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);
      }
      
      // Set initial matrix for ball
      this.position.set(x + xJitter, y, z + zJitter);
      this.rotation.set(0, 0, 0);
      this.quaternion.setFromEuler(this.rotation);
      this.scale.set(1, 1, 1);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.blueBalls?.setMatrixAt(i, this.matrix);
    }
    
    // 4. Initialize collision effects as invisible
    for (let i = 0; i < this.maxCollisions; i++) {
      this.matrix.makeScale(0, 0, 0); // Scale to zero = invisible
      this.collisionEffects?.setMatrixAt(i, this.matrix);
      this.collisionAge[i] = 0;
    }
    
    // Mark instance matrices as needing updates
    if (this.redPlayers) this.redPlayers.instanceMatrix.needsUpdate = true;
    if (this.greenPlayers) this.greenPlayers.instanceMatrix.needsUpdate = true;
    if (this.blueBalls) this.blueBalls.instanceMatrix.needsUpdate = true;
    if (this.redTrails) this.redTrails.instanceMatrix.needsUpdate = true;
    if (this.greenTrails) this.greenTrails.instanceMatrix.needsUpdate = true;
    if (this.blueTrails) this.blueTrails.instanceMatrix.needsUpdate = true;
    if (this.collisionEffects) this.collisionEffects.instanceMatrix.needsUpdate = true;
    
    // Initialize game state
    this.gameState.redTeamActive = this.particleCount.red;
    this.gameState.greenTeamActive = this.particleCount.green;
  }
  
  /**
   * Main animation function - called by ThreeManager
   */
  private animate(deltaTime: number): void {
    if (this.isPaused) return;
    
    // Update time
    this.time += deltaTime;
    
    // Update camera animation
    this.updateCamera(deltaTime);
    
    // Update game state
    this.updateGameState(deltaTime);
    
    // Update particles
    this.updateRedTeam(deltaTime);
    this.updateGreenTeam(deltaTime);
    this.updateBlueBalls(deltaTime);
    this.updateCollisions(deltaTime);
    
    // Check for collisions
    this.checkCollisions();
    
    // Update lights
    this.updateLights(deltaTime);
  }
  
  /**
   * Update camera animation
   */
  private updateCamera(_deltaTime: number): void {
    // Only run camera animation during initial sequence
    if (!this.initialCameraAnimation) return;
    
    const elapsedTime = this.time - this.cameraStartTime;
    
    // Animation complete
    if (elapsedTime >= this.cameraAnimationDuration) {
      // Set final camera position
      this.camera.position.set(0, 15, 25);
      this.camera.lookAt(0, 0, 0);
      this.initialCameraAnimation = false;
      return;
    }
    
    // Calculate animation progress (0 to 1)
    const progress = elapsedTime / this.cameraAnimationDuration;
    
    // Ensure game doesn't start until camera animation is almost complete
    if (progress > 0.85 && this.gameState.phase === 'ready' && this.time > 2) {
      // Let the game begin
    } else if (progress <= 0.85 && this.gameState.phase !== 'ready') {
      // Keep game in ready state until camera is positioned
      this.gameState.phase = 'ready';
    }
    
    // Orbital descent animation
    const orbital = progress * Math.PI * 2; // Two full orbits during animation
    const heightProgress = Math.pow(1 - progress, 2); // Quadratic ease-out for height

    // Start from top, spiral down and around to final position
    const radius = 25 * (0.2 + 0.8 * progress); // Radius grows as we descend
    const heightDelta = 40 * heightProgress; // Height decreases from 40 to 0
    const targetHeight = 15; // Final height
    
    // Calculate new position
    const newX = Math.sin(orbital) * radius;
    const newY = targetHeight + heightDelta;
    const newZ = Math.cos(orbital) * radius;
    
    // Apply new camera position
    this.camera.position.set(newX, newY, newZ);
    
    // Always look at center
    this.camera.lookAt(0, 0, 0);
  }
  
  /**
   * Update game state based on current phase
   */
  private updateGameState(_deltaTime: number): void {
    // Skip state updates during camera animation
    if (this.initialCameraAnimation && this.time - this.cameraStartTime < this.cameraAnimationDuration * 0.85) {
      return;
    }
    
    // Handle game phases based on elapsed time
    if (this.gameState.phase === 'ready' && this.time > 2) {
      // Start rush phase after 2 seconds
      this.gameState.phase = 'rush';
      this.gameState.phaseStartTime = this.time;
      
      // Give players initial velocity toward center
      for (let i = 0; i < this.particleCount.red; i++) {
        this.redVelocities[i * 3] = 0.1 + Math.random() * 0.05; // Right
        this.redVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Z variation
      }
      
      for (let i = 0; i < this.particleCount.green; i++) {
        this.greenVelocities[i * 3] = -0.1 - Math.random() * 0.05; // Left
        this.greenVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Z variation
      }
      
      // Make balls pick up velocity too
      for (let i = 0; i < this.particleCount.blueBalls; i++) {
        // Random direction initially
        const angle = Math.random() * Math.PI * 2;
        const speed = 0.05 + Math.random() * 0.05;
        this.blueBallsVelocities[i * 3] = Math.cos(angle) * speed;
        this.blueBallsVelocities[i * 3 + 2] = Math.sin(angle) * speed;
        this.blueBallsVelocities[i * 3 + 1] = 0.05 + Math.random() * 0.03; // Small upward velocity
      }
    } 
    else if (this.gameState.phase === 'rush' && 
             this.time - this.gameState.phaseStartTime > 3) {
      // Transition to battle phase
      this.gameState.phase = 'battle';
      this.gameState.phaseStartTime = this.time;
      this.gameState.rushComplete = true;
      
      // Players retreat a bit after rush
      for (let i = 0; i < this.particleCount.red; i++) {
        // Red team moves left
        this.redVelocities[i * 3] = -0.05 - Math.random() * 0.05;
        this.redVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
      }
      
      for (let i = 0; i < this.particleCount.green; i++) {
        // Green team moves right
        this.greenVelocities[i * 3] = 0.05 + Math.random() * 0.05;
        this.greenVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
      }
    }
  }
  
  /**
   * Update red team players
   */
  private updateRedTeam(deltaTime: number): void {
    for (let i = 0; i < this.particleCount.red; i++) {
      if (this.gameState.playerStatus.red[i] === 'eliminated') {
        // Skip eliminated players
        continue;
      }
      
      const idx = i * 3;
      
      // Apply velocity
      this.redPositions[idx] += this.redVelocities[idx] * 60 * deltaTime;
      this.redPositions[idx + 1] += this.redVelocities[idx + 1] * 60 * deltaTime;
      this.redPositions[idx + 2] += this.redVelocities[idx + 2] * 60 * deltaTime;
      
      // Add random movement during battle
      if (this.gameState.phase === 'battle') {
        this.redPositions[idx] += (Math.random() - 0.5) * 0.02;
        this.redPositions[idx + 2] += (Math.random() - 0.5) * 0.02;
      }
      
      // Keep players on the ground
      if (this.redPositions[idx + 1] > 0) {
        this.redPositions[idx + 1] = 0;
        this.redVelocities[idx + 1] = 0;
      }
      
      // Court boundaries with bounce
      const courtWidth = 25;
      const courtDepth = 15;
      
      // Court boundaries with bounce
      if (Math.abs(this.redPositions[idx]) > courtWidth) {
        this.redVelocities[idx] *= -0.5; // Bounce with energy loss
        this.redPositions[idx] = Math.sign(this.redPositions[idx]) * courtWidth;
      }
      
      // Depth boundaries (same for both teams)
      if (Math.abs(this.redPositions[idx + 2]) > courtDepth) {
        this.redVelocities[idx + 2] *= -0.5; // Bounce with energy loss
        this.redPositions[idx + 2] = Math.sign(this.redPositions[idx + 2]) * courtDepth;
      }
      
      // Calculate speed for visual effects
      const speed = Math.sqrt(
        this.redVelocities[idx] * this.redVelocities[idx] +
        this.redVelocities[idx + 1] * this.redVelocities[idx + 1] +
        this.redVelocities[idx + 2] * this.redVelocities[idx + 2]
      );
      
      // Update player rotation based on movement
      this.rotation.x = this.time * 0.5; // Spin effect
      
      // Stretch in direction of movement if moving fast
      if (speed > 0.05) {
        const stretchFactor = Math.min(1 + speed * 5, 2); // Limit stretch
        
        // Direction of movement
        const moveDir = new THREE.Vector3(
          this.redVelocities[idx],
          this.redVelocities[idx + 1],
          this.redVelocities[idx + 2]
        ).normalize();
        
        // Apply stretch in movement direction
        this.scale.copy(new THREE.Vector3(1, 1, 1));
        if (moveDir.length() > 0) {
          this.scale.x += moveDir.x * (stretchFactor - 1);
          this.scale.y += moveDir.y * (stretchFactor - 1);
          this.scale.z += moveDir.z * (stretchFactor - 1);
        }
      } else {
        // Normal scale when stationary or slow
        this.scale.set(1, 1, 1);
        
        // Pulse slightly when in battle phase and active
        if (this.gameState.phase === 'battle') {
          const pulse = 0.1 * Math.sin(this.time * 5 + i);
          this.scale.multiplyScalar(1 + pulse);
        }
      }
      
      // Update player matrix
      this.position.set(
        this.redPositions[idx],
        this.redPositions[idx + 1],
        this.redPositions[idx + 2]
      );
      this.quaternion.setFromEuler(this.rotation);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.redPlayers?.setMatrixAt(i, this.matrix);
      
      // Update trails for fast movement
      if (speed > 0.02) {
        // Shift previous positions
        this.redTrailPositions[i][2].copy(this.redTrailPositions[i][1]);
        this.redTrailPositions[i][1].copy(this.redTrailPositions[i][0]);
        this.redTrailPositions[i][0].copy(this.position).add(
          new THREE.Vector3(
            -this.redVelocities[idx] * 3,
            -this.redVelocities[idx + 1] * 3,
            -this.redVelocities[idx + 2] * 3
          )
        );
        
        // Set trail with decreasing scale
        for (let t = 0; t < 3; t++) {
          const trailScale = 0.7 - t * 0.2;
          const trailOpacity = Math.min(speed * 10, 1) * (0.7 - t * 0.2);
          
          this.scale.set(trailScale, trailScale, trailScale);
          this.matrix.compose(
            this.redTrailPositions[i][t], 
            this.quaternion, 
            this.scale
          );
          this.redTrails?.setMatrixAt(i * 3 + t, this.matrix);
          
          // Update material opacity
          (this.redTrails?.material as THREE.MeshBasicMaterial).opacity = trailOpacity;
        }
      } else {
        // Hide trails for slow movement
        for (let t = 0; t < 3; t++) {
          this.matrix.makeScale(0, 0, 0);
          this.redTrails?.setMatrixAt(i * 3 + t, this.matrix);
        }
      }
    }
    
    // Update instance matrices
    if (this.redPlayers) this.redPlayers.instanceMatrix.needsUpdate = true;
    if (this.redTrails) this.redTrails.instanceMatrix.needsUpdate = true;
  }
  
  /**
   * Update green team players
   */
  private updateGreenTeam(deltaTime: number): void {
    for (let i = 0; i < this.particleCount.green; i++) {
      if (this.gameState.playerStatus.green[i] === 'eliminated') {
        // Skip eliminated players
        continue;
      }
      
      const idx = i * 3;
      
      // Apply velocity
      this.greenPositions[idx] += this.greenVelocities[idx] * 60 * deltaTime;
      this.greenPositions[idx + 1] += this.greenVelocities[idx + 1] * 60 * deltaTime;
      this.greenPositions[idx + 2] += this.greenVelocities[idx + 2] * 60 * deltaTime;
      
      // Add random movement during battle
      if (this.gameState.phase === 'battle') {
        this.greenPositions[idx] += (Math.random() - 0.5) * 0.02;
        this.greenPositions[idx + 2] += (Math.random() - 0.5) * 0.02;
      }
      
      // Keep players on the ground
      if (this.greenPositions[idx + 1] > 0) {
        this.greenPositions[idx + 1] = 0;
        this.greenVelocities[idx + 1] = 0;
      }
      
      // Court boundaries with bounce
      const courtWidth = 25;
      const courtDepth = 15;
      
      // Court boundaries with bounce
      if (Math.abs(this.greenPositions[idx]) > courtWidth) {
        this.greenVelocities[idx] *= -0.5; // Bounce with energy loss
        this.greenPositions[idx] = Math.sign(this.greenPositions[idx]) * courtWidth;
      }
      
      // Depth boundaries (same for both teams)
      if (Math.abs(this.greenPositions[idx + 2]) > courtDepth) {
        this.greenVelocities[idx + 2] *= -0.5; // Bounce with energy loss
        this.greenPositions[idx + 2] = Math.sign(this.greenPositions[idx + 2]) * courtDepth;
      }
      
      // Calculate speed for visual effects
      const speed = Math.sqrt(
        this.greenVelocities[idx] * this.greenVelocities[idx] +
        this.greenVelocities[idx + 1] * this.greenVelocities[idx + 1] +
        this.greenVelocities[idx + 2] * this.greenVelocities[idx + 2]
      );
      
      // Update player rotation based on movement
      this.rotation.x = this.time * 0.5; // Spin effect
      
      // Stretch in direction of movement if moving fast
      if (speed > 0.05) {
        const stretchFactor = Math.min(1 + speed * 5, 2); // Limit stretch
        
        // Direction of movement
        const moveDir = new THREE.Vector3(
          this.greenVelocities[idx],
          this.greenVelocities[idx + 1],
          this.greenVelocities[idx + 2]
        ).normalize();
        
        // Apply stretch in movement direction
        this.scale.copy(new THREE.Vector3(1, 1, 1));
        if (moveDir.length() > 0) {
          this.scale.x += moveDir.x * (stretchFactor - 1);
          this.scale.y += moveDir.y * (stretchFactor - 1);
          this.scale.z += moveDir.z * (stretchFactor - 1);
        }
      } else {
        // Normal scale when stationary or slow
        this.scale.set(1, 1, 1);
        
        // Pulse slightly when in battle phase and active
        if (this.gameState.phase === 'battle') {
          const pulse = 0.1 * Math.sin(this.time * 5 + i);
          this.scale.multiplyScalar(1 + pulse);
        }
      }
      
      // Update player matrix
      this.position.set(
        this.greenPositions[idx],
        this.greenPositions[idx + 1],
        this.greenPositions[idx + 2]
      );
      this.quaternion.setFromEuler(this.rotation);
      this.matrix.compose(this.position, this.quaternion, this.scale);
      this.greenPlayers?.setMatrixAt(i, this.matrix);
      
      // Update trails for fast movement
      if (speed > 0.02) {
        // Shift previous positions
        this.greenTrailPositions[i][2].copy(this.greenTrailPositions[i][1]);
        this.greenTrailPositions[i][1].copy(this.greenTrailPositions[i][0]);
        this.greenTrailPositions[i][0].copy(this.position).add(
          new THREE.Vector3(
            -this.greenVelocities[idx] * 3,
            -this.greenVelocities[idx + 1] * 3,
            -this.greenVelocities[idx + 2] * 3
          )
        );
        
        // Set trail with decreasing scale
        for (let t = 0; t < 3; t++) {
          const trailScale = 0.7 - t * 0.2;
          const trailOpacity = Math.min(speed * 10, 1) * (0.7 - t * 0.2);
          
          this.scale.set(trailScale, trailScale, trailScale);
          this.matrix.compose(
            this.greenTrailPositions[i][t], 
            this.quaternion, 
            this.scale
          );
          this.greenTrails?.setMatrixAt(i * 3 + t, this.matrix);
          
          // Update material opacity
          (this.greenTrails?.material as THREE.MeshBasicMaterial).opacity = trailOpacity;
        }
      } else {
        // Hide trails for slow movement
        for (let t = 0; t < 3; t++) {
          this.matrix.makeScale(0, 0, 0);
          this.greenTrails?.setMatrixAt(i * 3 + t, this.matrix);
        }
      }
    }
    
    // Update instance matrices
    if (this.greenPlayers) this.greenPlayers.instanceMatrix.needsUpdate = true;
    if (this.greenTrails) this.greenTrails.instanceMatrix.needsUpdate = true;
  }
  
  /**
   * Update blue dodgeballs
   */
  private updateBlueBalls(deltaTime: number): void {
    for (let i = 0; i < this.particleCount.blueBalls; i++) {
      const idx = i * 3;
      
      // Update based on game phase
      if (this.gameState.phase === 'ready') {
        // Balls hover at center
        this.blueBallsPositions[idx + 1] = 0.5 + Math.sin(this.time * 5 + i) * 0.2;
        
        // Update with spinning effect
        this.position.set(
          this.blueBallsPositions[idx],
          this.blueBallsPositions[idx + 1],
          this.blueBallsPositions[idx + 2]
        );
        
        // Spin the ball
        this.rotation.x = this.time * 2 + i;
        this.rotation.y = this.time * 3;
        this.quaternion.setFromEuler(this.rotation);
        
        // Apply normal scale
        this.scale.set(1, 1, 1);
        
        // Update matrix
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.blueBalls?.setMatrixAt(i, this.matrix);
        
        // No trails in ready phase
        for (let t = 0; t < 3; t++) {
          this.matrix.makeScale(0, 0, 0);
          this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);
        }
      } 
      else {
        // Rush and battle phases
        
        // Apply velocity
        this.blueBallsPositions[idx] += this.blueBallsVelocities[idx] * 60 * deltaTime;
        this.blueBallsPositions[idx + 1] += this.blueBallsVelocities[idx + 1] * 60 * deltaTime;
        this.blueBallsPositions[idx + 2] += this.blueBallsVelocities[idx + 2] * 60 * deltaTime;
        
        // Apply gravity
        if (this.blueBallsPositions[idx + 1] > 0) {
          this.blueBallsVelocities[idx + 1] -= 0.002;
        } else {
          this.blueBallsPositions[idx + 1] = 0;
          this.blueBallsVelocities[idx + 1] = 0;
          
          // Apply friction when on ground
          this.blueBallsVelocities[idx] *= 0.98;
          this.blueBallsVelocities[idx + 2] *= 0.98;
        }
        
        // Court boundaries with bounce
        const courtWidth = 25;
        const courtDepth = 15;
        
        if (Math.abs(this.blueBallsPositions[idx]) > courtWidth) {
          this.blueBallsVelocities[idx] *= -0.7; // Bouncier than players
          this.blueBallsPositions[idx] = Math.sign(this.blueBallsPositions[idx]) * courtWidth;
        }
        
        if (Math.abs(this.blueBallsPositions[idx + 2]) > courtDepth) {
          this.blueBallsVelocities[idx + 2] *= -0.7; // Bouncier than players
          this.blueBallsPositions[idx + 2] = Math.sign(this.blueBallsPositions[idx + 2]) * courtDepth;
        }
        
        // Calculate speed for visual effects
        const speed = Math.sqrt(
          this.blueBallsVelocities[idx] * this.blueBallsVelocities[idx] +
          this.blueBallsVelocities[idx + 1] * this.blueBallsVelocities[idx + 1] +
          this.blueBallsVelocities[idx + 2] * this.blueBallsVelocities[idx + 2]
        );
        
        // Rotation based on velocity
        this.rotation.x += this.blueBallsVelocities[idx + 2] * 10;
        this.rotation.y += this.blueBallsVelocities[idx] * 10;
        this.rotation.z += 0.05; // Constant spin
        
        this.quaternion.setFromEuler(this.rotation);
        
        // Stretch in direction of movement for fast balls
        if (speed > 0.08) {
          const stretchFactor = Math.min(1 + speed * 8, 3); // More stretch than players
          
          // Direction of movement
          const moveDir = new THREE.Vector3(
            this.blueBallsVelocities[idx],
            this.blueBallsVelocities[idx + 1],
            this.blueBallsVelocities[idx + 2]
          ).normalize();
          
          // Apply stretch in movement direction
          this.scale.copy(new THREE.Vector3(1, 1, 1));
          if (moveDir.length() > 0) {
            this.scale.x += moveDir.x * (stretchFactor - 1);
            this.scale.y += moveDir.y * (stretchFactor - 1);
            this.scale.z += moveDir.z * (stretchFactor - 1);
          }
        } else {
          // Normal scale with slight pulsing
          const pulse = 0.1 * Math.sin(this.time * 10 + i);
          this.scale.set(1 + pulse, 1 + pulse, 1 + pulse);
        }
        
        // Update ball matrix
        this.position.set(
          this.blueBallsPositions[idx],
          this.blueBallsPositions[idx + 1],
          this.blueBallsPositions[idx + 2]
        );
        
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.blueBalls?.setMatrixAt(i, this.matrix);
        
        // Update trails for fast movement
        if (speed > 0.05) {
          // Shift previous positions
          this.blueTrailPositions[i][2].copy(this.blueTrailPositions[i][1]);
          this.blueTrailPositions[i][1].copy(this.blueTrailPositions[i][0]);
          this.blueTrailPositions[i][0].copy(this.position).add(
            new THREE.Vector3(
              -this.blueBallsVelocities[idx] * 4,
              -this.blueBallsVelocities[idx + 1] * 4,
              -this.blueBallsVelocities[idx + 2] * 4
            )
          );
          
          // Set trail with decreasing scale - more prominent than player trails
          for (let t = 0; t < 3; t++) {
            const trailScale = 0.8 - t * 0.2;
            const trailOpacity = Math.min(speed * 15, 1) * (0.8 - t * 0.2);
            
            this.scale.set(trailScale, trailScale, trailScale);
            this.matrix.compose(
              this.blueTrailPositions[i][t], 
              this.quaternion, 
              this.scale
            );
            this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);
            
            // Update material opacity
            (this.blueTrails?.material as THREE.MeshBasicMaterial).opacity = trailOpacity;
          }
        } else {
          // Hide trails for slow movement
          for (let t = 0; t < 3; t++) {
            this.matrix.makeScale(0, 0, 0);
            this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);
          }
        }
      }
    }
    
    // Update instance matrices
    if (this.blueBalls) this.blueBalls.instanceMatrix.needsUpdate = true;
    if (this.blueTrails) this.blueTrails.instanceMatrix.needsUpdate = true;
  }
  
  /**
   * Check for collisions between particles
   */
  private checkCollisions(): void {
    // Skip collision checks in ready phase
    if (this.gameState.phase === 'ready') return;
    
    // Only check some particles each frame for performance
    const checkRatio = 0.2; // Check 20% of particles per frame
    const redCheckCount = Math.floor(this.particleCount.red * checkRatio);
    const redStartIdx = Math.floor(Math.random() * (this.particleCount.red - redCheckCount));
    
    // Check red vs green collisions
    for (let i = redStartIdx; i < redStartIdx + redCheckCount; i++) {
      if (this.gameState.playerStatus.red[i] === 'eliminated') continue;
      
      const redIdx = i * 3;
      const rx = this.redPositions[redIdx];
      const ry = this.redPositions[redIdx + 1];
      const rz = this.redPositions[redIdx + 2];
      
      // Check against a few random green players
      const greenCheck = Math.min(5, Math.floor(this.particleCount.green * 0.1));
      
      for (let j = 0; j < greenCheck; j++) {
        const greenI = Math.floor(Math.random() * this.particleCount.green);
        
        if (this.gameState.playerStatus.green[greenI] === 'eliminated') continue;
        
        const greenIdx = greenI * 3;
        const gx = this.greenPositions[greenIdx];
        const gy = this.greenPositions[greenIdx + 1];
        const gz = this.greenPositions[greenIdx + 2];
        
        // Calculate squared distance (faster than using sqrt)
        const distSquared = 
          (rx - gx) * (rx - gx) + 
          (ry - gy) * (ry - gy) + 
          (rz - gz) * (rz - gz);
        
        // Collision threshold - squared distance for efficiency
        const collisionThreshold = 1.0; // Squared distance
        
        if (distSquared < collisionThreshold) {
          // Create collision effect at midpoint
          this.createCollision(
            (rx + gx) / 2,
            (ry + gy) / 2,
            (rz + gz) / 2,
            Math.random() > 0.5 // Random team color
          );
          
          // Apply repulsion forces
          const repelForce = 0.15;
          const dx = rx - gx;
          const dy = ry - gy;
          const dz = rz - gz;
          
          // Normalize direction
          const dist = Math.sqrt(distSquared);
          const dirX = dx / dist;
          const dirY = dy / dist;
          const dirZ = dz / dist;
          
          // Apply stronger forces for dramatic effect
          this.redVelocities[redIdx] += dirX * repelForce * 1.2;
          this.redVelocities[redIdx + 1] += dirY * repelForce * 1.2;
          this.redVelocities[redIdx + 2] += dirZ * repelForce * 1.2;
          
          this.greenVelocities[greenIdx] -= dirX * repelForce * 1.2;
          this.greenVelocities[greenIdx + 1] -= dirY * repelForce * 1.2;
          this.greenVelocities[greenIdx + 2] -= dirZ * repelForce * 1.2;
          
          // Break after one collision found for this red player
          break;
        }
      }
    }
    
    // Blue balls collisions - check a subset each frame
    const blueCheckCount = Math.floor(this.particleCount.blueBalls * 0.5);
    const blueStartIdx = Math.floor(Math.random() * (this.particleCount.blueBalls - blueCheckCount));
    
    for (let i = blueStartIdx; i < blueStartIdx + blueCheckCount; i++) {
      const blueIdx = i * 3;
      const bx = this.blueBallsPositions[blueIdx];
      const by = this.blueBallsPositions[blueIdx + 1];
      const bz = this.blueBallsPositions[blueIdx + 2];
      
      // Skip if ball is not moving enough
      const ballSpeed = Math.sqrt(
        this.blueBallsVelocities[blueIdx] * this.blueBallsVelocities[blueIdx] +
        this.blueBallsVelocities[blueIdx + 1] * this.blueBallsVelocities[blueIdx + 1] +
        this.blueBallsVelocities[blueIdx + 2] * this.blueBallsVelocities[blueIdx + 2]
      );
      
      if (ballSpeed < 0.03) continue;
      
      // Check against red players
      for (let j = 0; j < Math.min(3, this.particleCount.red); j++) {
        const redI = Math.floor(Math.random() * this.particleCount.red);
        if (this.gameState.playerStatus.red[redI] === 'eliminated') continue;
        
        const redIdx = redI * 3;
        const rx = this.redPositions[redIdx];
        const ry = this.redPositions[redIdx + 1];
        const rz = this.redPositions[redIdx + 2];
        
        const distSquared = 
          (bx - rx) * (bx - rx) + 
          (by - ry) * (by - ry) + 
          (bz - rz) * (bz - rz);
        
        if (distSquared < 1.2) {
          // Ball hit red player!
          this.createCollision(
            (bx + rx) / 2,
            (by + ry) / 2,
            (bz + rz) / 2,
            false // Green team effect (red player hit)
          );
          
          // Eliminate player with dramatic effect
          if (Math.random() < 0.3 && this.gameState.phase === 'battle') {
            this.gameState.playerStatus.red[redI] = 'eliminated';
            this.gameState.redTeamActive--;
            this.gameState.lastHitTime = this.time; // Record hit time for light effects
            
            // Hide the player
            this.matrix.makeScale(0, 0, 0);
            this.redPlayers?.setMatrixAt(redI, this.matrix);
            
            // Create extra collision particles for elimination explosion
            const particleCount = 4 + Math.floor(Math.random() * 3); // 4-6 particles
            for (let k = 0; k < particleCount; k++) {
              // Create particles in a more dramatic pattern
              const angle = (k / particleCount) * Math.PI * 2;
              const radius = 0.2 + Math.random() * 0.4;
              
              this.createCollision(
                rx + Math.cos(angle) * radius,
                ry + Math.random() * 0.7,  // Higher vertical spread
                rz + Math.sin(angle) * radius,
                false // Green team color (red player hit)
              );
            }
          }
          
          // Ball rebounds
          this.blueBallsVelocities[blueIdx] *= -0.8;
          this.blueBallsVelocities[blueIdx + 1] *= 0.5;
          this.blueBallsVelocities[blueIdx + 2] *= -0.8;
          
          break;
        }
      }
      
      // Check against green players
      for (let j = 0; j < Math.min(3, this.particleCount.green); j++) {
        const greenI = Math.floor(Math.random() * this.particleCount.green);
        if (this.gameState.playerStatus.green[greenI] === 'eliminated') continue;
        
        const greenIdx = greenI * 3;
        const gx = this.greenPositions[greenIdx];
        const gy = this.greenPositions[greenIdx + 1];
        const gz = this.greenPositions[greenIdx + 2];
        
        const distSquared = 
          (bx - gx) * (bx - gx) + 
          (by - gy) * (by - gy) + 
          (bz - gz) * (bz - gz);
        
        if (distSquared < 1.2) {
          // Ball hit green player!
          this.createCollision(
            (bx + gx) / 2,
            (by + gy) / 2,
            (bz + gz) / 2,
            true // Red team effect (green player hit)
          );
          
          // Eliminate player with dramatic effect
          if (Math.random() < 0.3 && this.gameState.phase === 'battle') {
            this.gameState.playerStatus.green[greenI] = 'eliminated';
            this.gameState.greenTeamActive--;
            this.gameState.lastHitTime = this.time; // Record hit time for light effects
            
            // Hide the player
            this.matrix.makeScale(0, 0, 0);
            this.greenPlayers?.setMatrixAt(greenI, this.matrix);
            
            // Create extra collision particles for elimination explosion
            const particleCount = 4 + Math.floor(Math.random() * 3); // 4-6 particles
            for (let k = 0; k < particleCount; k++) {
              // Create particles in a more dramatic pattern
              const angle = (k / particleCount) * Math.PI * 2;
              const radius = 0.2 + Math.random() * 0.4;
              
              this.createCollision(
                gx + Math.cos(angle) * radius,
                gy + Math.random() * 0.7,  // Higher vertical spread
                gz + Math.sin(angle) * radius,
                true // Red team color (green player hit)
              );
            }
          }
          
          // Ball rebounds
          this.blueBallsVelocities[blueIdx] *= -0.8;
          this.blueBallsVelocities[blueIdx + 1] *= 0.5;
          this.blueBallsVelocities[blueIdx + 2] *= -0.8;
          
          break;
        }
      }
    }
  }
  
  /**
   * Create a collision effect at a specific position
   */
  private createCollision(x: number, y: number, z: number, isRed: boolean): void {
    if (this.activeCollisions >= this.maxCollisions) return;
    
    const idx = this.activeCollisions;
    this.activeCollisions++;
    
    // Position the collision
    this.position.set(x, y, z);
    
    // Set appropriate scale
    const baseSize = 1.5 + Math.random() * 0.5;
    this.scale.set(baseSize, baseSize, baseSize);
    
    // Use redish or greenish color for the collision
    if (isRed) {
      (this.collisionEffects?.material as THREE.MeshBasicMaterial).color.set(0xff5555);
    } else {
      (this.collisionEffects?.material as THREE.MeshBasicMaterial).color.set(0x55ff55);
    }
    
    // Add slight random rotation
    this.rotation.set(
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2,
      Math.random() * Math.PI * 2
    );
    this.quaternion.setFromEuler(this.rotation);
    
    // Set matrix
    this.matrix.compose(this.position, this.quaternion, this.scale);
    this.collisionEffects?.setMatrixAt(idx, this.matrix);
    
    // Initialize age
    this.collisionAge[idx] = 0;
    
    // Record the time of the collision for lighting effects
    this.gameState.lastHitTime = this.time;
  }
  
  /**
   * Update collision effects
   */
  private updateCollisions(deltaTime: number): void {
    // Use deltaTime to ensure collision animations scale with framerate
    let remainingCollisions = 0;
    
    for (let i = 0; i < this.activeCollisions; i++) {
      this.collisionAge[i] += deltaTime * 2; // Age faster
      
      if (this.collisionAge[i] < 1.0) {
        // Collision is still active
        const expandPhase = Math.min(this.collisionAge[i] * 2, 1);
        const fadePhase = Math.max(0, 1 - (this.collisionAge[i] - 0.5) * 2);
        
        // Get current position from matrix
        this.collisionEffects?.getMatrixAt(i, this.matrix);
        this.position.setFromMatrixPosition(this.matrix);
        
        // Add slight upward drift
        this.position.y += deltaTime * 0.5;
        
        // Expand and fade
        const scaleMultiplier = 1 + expandPhase * 2;
        this.scale.set(
          scaleMultiplier,
          scaleMultiplier,
          scaleMultiplier
        );
        
        // Set opacity
        (this.collisionEffects?.material as THREE.MeshBasicMaterial).opacity = fadePhase;
        
        // Update matrix
        this.matrix.compose(this.position, this.quaternion, this.scale);
        
        // Keep this collision
        if (i !== remainingCollisions) {
          // Move collision data to the active slot
          this.collisionEffects?.setMatrixAt(remainingCollisions, this.matrix);
          this.collisionAge[remainingCollisions] = this.collisionAge[i];
        } else {
          this.collisionEffects?.setMatrixAt(i, this.matrix);
        }
        
        remainingCollisions++;
      }
    }
    
    // Hide any remaining collision slots
    for (let i = remainingCollisions; i < this.activeCollisions; i++) {
      this.matrix.makeScale(0, 0, 0);
      this.collisionEffects?.setMatrixAt(i, this.matrix);
    }
    
    this.activeCollisions = remainingCollisions;
    
    // Update instance matrix
    if (this.collisionEffects) {
      this.collisionEffects.instanceMatrix.needsUpdate = true;
    }
  }
  
  /**
   * Update light colors and intensities
   */
  private updateLights(_deltaTime: number): void {
    if (!this.redLight || !this.greenLight || !this.centerLight) return;
    
    // Subtle pulsing light intensity
    this.redLight.intensity = 0.5 + 0.1 * Math.sin(this.time * 2);
    this.greenLight.intensity = 0.5 + 0.1 * Math.sin(this.time * 2 + Math.PI);
    this.centerLight.intensity = 0.4 + 0.05 * Math.sin(this.time * 3);
    
    // Make team light subtly brighter when team is winning
    const redAdvantage = this.gameState.redTeamActive - this.gameState.greenTeamActive;
    
    if (redAdvantage > 0) {
      // Red team winning
      this.redLight.intensity += 0.1;
    } else if (redAdvantage < 0) {
      // Green team winning
      this.greenLight.intensity += 0.1;
    }
    
    // Very subtle position movement
    if (this.gameState.phase === 'battle') {
      // Move lights in small circles
      this.redLight.position.x = -15 + Math.sin(this.time * 0.3) * 1;
      this.redLight.position.z = Math.cos(this.time * 0.4) * 1;
      
      this.greenLight.position.x = 15 + Math.sin(this.time * 0.3 + Math.PI) * 1;
      this.greenLight.position.z = Math.cos(this.time * 0.4 + Math.PI) * 1;
    }
    
    // Subtle flash effect on hits - much more restrained
    if (this.activeCollisions > 0 && this.time - this.gameState.lastHitTime < 0.3) {
      // Flash on recent hit
      const hitIntensity = 0.2 * (1 - (this.time - this.gameState.lastHitTime) * 3);
      this.centerLight.intensity += hitIntensity;
    }
  }
  
  /**
   * Get the current game state
   */
  public getGameState(): any {
    return {
      phase: this.gameState.phase,
      redTeamActive: this.gameState.redTeamActive,
      greenTeamActive: this.gameState.greenTeamActive,
      time: this.time
    };
  }
  
  /**
   * Reset the game
   */
  public resetGame(): void {
    // Reset game state
    this.gameState.phase = 'ready';
    this.gameState.phaseStartTime = 0;
    this.gameState.rushComplete = false;
    
    // Reset player status
    this.gameState.playerStatus.red = new Array(this.particleCount.red).fill('active');
    this.gameState.playerStatus.green = new Array(this.particleCount.green).fill('active');
    this.gameState.redTeamActive = this.particleCount.red;
    this.gameState.greenTeamActive = this.particleCount.green;
    
    // Reset positions to initial state
    this.setupInitialPositions();
  }
  
  /**
   * Pause animation
   */
  public pause(): void {
    this.isPaused = true;
  }
  
  /**
   * Resume animation
   */
  public resume(): void {
    this.isPaused = false;
  }
  
  /**
   * Cleanup resources when component unmounts
   */
  public dispose(): void {
    // Unregister from ThreeManager
    ThreeManager.getInstance().unregisterScene(this.COMPONENT_ID);
    
    // No need to dispose geometries or materials as they're managed by ThreeManager
    console.log('[DodgeballScene] Disposed');
  }
}

export default DodgeballScene;