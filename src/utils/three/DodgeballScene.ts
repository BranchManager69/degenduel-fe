import * as THREE from "three";
import ThreeManager from "./ThreeManager";

/**
 * DodgeballScene - Manages the 3D scene for the dodgeball particle effect
 *
 * This class uses InstancedMesh for efficient rendering of large numbers
 * of particles, dramatically improving performance over individual meshes.
 */
export class DodgeballScene {
  // Component ID for ThreeManager
  private readonly COMPONENT_ID = "dodgeball-scene";

  // Three.js objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private container: HTMLElement | null = null;

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

  // Special effects
  private mysticalBallGlow: THREE.Mesh | null = null;
  private eliminationWave: THREE.Mesh | null = null;
  private victoryGlow: THREE.Mesh | null = null;

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
    blueBalls: 0,
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
    phase: "ready" as
      | "ready"
      | "rush"
      | "battle"
      | "endgame"
      | "mystical-catch",
    phaseStartTime: 0,
    redTeamActive: 0,
    greenTeamActive: 0,
    redTeamBalls: 0,
    greenTeamBalls: 0,
    ballOwnership: [] as (-1 | 0 | 1 | 2)[], // -1: no owner, 0: red team, 1: green team, 2: user
    ballState: [] as (
      | "center"
      | "carried"
      | "thrown"
      | "ground"
      | "user-held"
      | "user-thrown"
    )[], // Current ball status
    ballTargets: [] as (number | null)[], // Target player index when thrown
    throwCooldown: [] as number[], // Cooldown timers for each player
    playerStatus: {
      red: [] as (
        | "active"
        | "eliminated"
        | "carrying"
        | "aiming"
        | "throwing"
        | "dodging"
      )[],
      green: [] as (
        | "active"
        | "eliminated"
        | "carrying"
        | "aiming"
        | "throwing"
        | "dodging"
      )[],
    },
    lastHitTime: 0,
    rushComplete: false,
    // Game pace control
    tensionFactor: 0.5, // 0-1 value controlling how intense the match is
    nextThrowTime: 0, // Time when next throw should happen
    lastActionTime: 0, // Time when last significant action happened
    throwFrequency: {
      // Throws per second based on tension
      min: 0.2, // One throw every 5 seconds when slow
      max: 1.0, // Up to one throw per second when intense
    },
    // User interaction state
    userInteraction: {
      isHolding: false, // User is currently holding a ball
      heldBallIndex: -1, // Index of ball user is holding
      dragStartPosition: new THREE.Vector2(), // Screen position where drag started
      currentPosition: new THREE.Vector2(), // Current mouse/touch position
      dragStartTime: 0, // When drag started
      throwVelocity: new THREE.Vector3(), // Calculated throw velocity
      lastThrowTime: 0, // Time of last user throw (for cooldown)
      mysticalCatchTeam: null as "red" | "green" | null, // Team that made mystical catch
      mysticalCatchTime: 0, // When the mystical catch happened
      mysticalCatchPlayer: -1, // Index of player who made catch
      raycaster: new THREE.Raycaster(), // For hit detection
      mouse: new THREE.Vector2(), // Normalized mouse coordinates
    },
    // Special effects state
    specialEffects: {
      mysticalGlowIntensity: 1, // Intensity of mystical ball glow (0-1)
      victoryGlowIntensity: 1, // Intensity of victory team glow (0-1)
      eliminationWaveRadius: 1, // Radius of elimination wave effect (0-1)
      eliminationWaveOpacity: 1, // Opacity of elimination wave (0-1)
    },
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
    particleCountRed: number = 300,
    particleCountGreen: number = 300,
    particleCountBlueBalls: number = 75
  ) {
    // Get ThreeManager instance
    const threeManager = ThreeManager.getInstance();

    // Store container reference
    this.container = container;

    // Set particle counts
    this.particleCount = {
      red: particleCountRed,
      green: particleCountGreen,
      blueBalls: particleCountBlueBalls,
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
        lookAt: new THREE.Vector3(0, 0, 0),
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

    // Setup user interaction events
    this.setupUserInteraction();
  }

  /**
   * Setup user interaction events
   */
  private setupUserInteraction(): void {
    if (!this.container) return;

    // Mouse/touch down event - start ball grab
    this.container.addEventListener("mousedown", this.onMouseDown.bind(this));
    this.container.addEventListener(
      "touchstart",
      this.onTouchStart.bind(this),
      { passive: false }
    );

    // Mouse/touch move event - update drag position
    window.addEventListener("mousemove", this.onMouseMove.bind(this));
    window.addEventListener("touchmove", this.onTouchMove.bind(this), {
      passive: false,
    });

    // Mouse/touch up event - throw ball
    window.addEventListener("mouseup", this.onMouseUp.bind(this));
    window.addEventListener("touchend", this.onTouchEnd.bind(this));
  }

  /**
   * Handle mouse down - attempt to grab a ball
   */
  private onMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.updateMousePosition(event.clientX, event.clientY);
    this.attemptBallGrab();
  }

  /**
   * Handle touch start - attempt to grab a ball
   */
  private onTouchStart(event: TouchEvent): void {
    if (event.touches.length === 0) return;

    event.preventDefault();
    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
    this.attemptBallGrab();
  }

  /**
   * Handle mouse move - update drag position
   */
  private onMouseMove(event: MouseEvent): void {
    if (!this.gameState.userInteraction.isHolding) return;

    this.updateMousePosition(event.clientX, event.clientY);
    this.updateHeldBallPosition();
  }

  /**
   * Handle touch move - update drag position
   */
  private onTouchMove(event: TouchEvent): void {
    if (!this.gameState.userInteraction.isHolding || event.touches.length === 0)
      return;

    const touch = event.touches[0];
    this.updateMousePosition(touch.clientX, touch.clientY);
    this.updateHeldBallPosition();
  }

  /**
   * Handle mouse up - throw ball if holding
   */
  private onMouseUp(event: MouseEvent): void {
    if (!this.gameState.userInteraction.isHolding) return;

    this.updateMousePosition(event.clientX, event.clientY);
    this.throwHeldBall();
  }

  /**
   * Handle touch end - throw ball if holding
   */
  private onTouchEnd(_event: TouchEvent): void {
    if (!this.gameState.userInteraction.isHolding) return;

    // Use last known position since touch has ended
    this.throwHeldBall();
  }

  /**
   * Update normalized mouse position for raycasting
   */
  private updateMousePosition(clientX: number, clientY: number): void {
    if (!this.container) return;

    // Get container bounds
    const rect = this.container.getBoundingClientRect();

    // Store actual screen coordinates for velocity calculation
    this.gameState.userInteraction.currentPosition.x = clientX;
    this.gameState.userInteraction.currentPosition.y = clientY;

    // Calculate normalized coordinates (-1 to 1)
    const x = ((clientX - rect.left) / rect.width) * 2 - 1;
    const y = -((clientY - rect.top) / rect.height) * 2 + 1;

    // Store normalized coordinates for raycasting
    this.gameState.userInteraction.mouse.x = x;
    this.gameState.userInteraction.mouse.y = y;
  }

  /**
   * Attempt to grab a ball from the scene
   */
  private attemptBallGrab(): void {
    // Only allow grab if not already holding and not in mystical catch phase
    if (
      this.gameState.userInteraction.isHolding ||
      this.gameState.phase === "mystical-catch"
    )
      return;

    // Setup raycaster
    const raycaster = this.gameState.userInteraction.raycaster;
    raycaster.setFromCamera(this.gameState.userInteraction.mouse, this.camera);

    // Find all balls in the scene
    const ballObjects: THREE.Object3D[] = [];
    if (this.blueBalls) {
      for (let i = 0; i < this.particleCount.blueBalls; i++) {
        // Extract each ball's position
        const idx = i * 3;
        const position = new THREE.Vector3(
          this.blueBallsPositions[idx],
          this.blueBallsPositions[idx + 1],
          this.blueBallsPositions[idx + 2]
        );

        // Create temporary hit sphere for raycasting (we're not actually adding this to the scene)
        const hitSphere = new THREE.Mesh(
          new THREE.SphereGeometry(1), // Larger hit area for easier grabbing
          new THREE.MeshBasicMaterial()
        );
        hitSphere.position.copy(position);
        hitSphere.userData = { ballIndex: i };

        ballObjects.push(hitSphere);
      }
    }

    // Cast ray against balls
    const intersects = raycaster.intersectObjects(ballObjects, false);

    if (intersects.length > 0) {
      // Grab the first intersected ball
      const ballIndex = intersects[0].object.userData.ballIndex;
      this.grabBall(ballIndex);
    }
  }

  /**
   * Grab a specific ball
   */
  private grabBall(ballIndex: number): void {
    // Don't grab if ball is already user-held
    if (
      this.gameState.ballState[ballIndex] === "user-held" ||
      this.gameState.ballState[ballIndex] === "user-thrown"
    )
      return;

    // Save previous state for possible return if user doesn't throw
    const previousState = this.gameState.ballState[ballIndex];
    const previousOwner = this.gameState.ballOwnership[ballIndex];

    // Update ball state
    this.gameState.userInteraction.isHolding = true;
    this.gameState.userInteraction.heldBallIndex = ballIndex;
    this.gameState.userInteraction.dragStartTime = this.time;
    this.gameState.userInteraction.dragStartPosition.copy(
      this.gameState.userInteraction.currentPosition
    );

    this.gameState.ballState[ballIndex] = "user-held";
    this.gameState.ballOwnership[ballIndex] = 2; // User

    // If ball was carried by a player, update player state
    if (previousState === "carried") {
      if (previousOwner === 0) {
        // Red team
        for (let i = 0; i < this.particleCount.red; i++) {
          if (this.gameState.playerStatus.red[i] === "carrying") {
            this.gameState.playerStatus.red[i] = "active";
            this.gameState.redTeamBalls--;
            break;
          }
        }
      } else if (previousOwner === 1) {
        // Green team
        for (let i = 0; i < this.particleCount.green; i++) {
          if (this.gameState.playerStatus.green[i] === "carrying") {
            this.gameState.playerStatus.green[i] = "active";
            this.gameState.greenTeamBalls--;
            break;
          }
        }
      }
    }

    // Create mystical purple material for user balls if not already created
    const threeManager = ThreeManager.getInstance();
    const mysticalMaterial = threeManager.getOrCreateMaterial(
      "mystical-purple-ball",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x8a2be2, // Bright purple
          emissive: 0x6a0dad, // Dark purple
          emissiveIntensity: 0.7,
          roughness: 0.3,
          metalness: 0.8,
        })
    );

    // Apply mystical material to ball
    if (this.blueBalls) {
      this.blueBalls.material = mysticalMaterial;
    }

    // Update ball position to follow cursor
    this.updateHeldBallPosition();
  }

  /**
   * Update position of ball held by user
   */
  private updateHeldBallPosition(): void {
    if (!this.gameState.userInteraction.isHolding) return;

    const ballIndex = this.gameState.userInteraction.heldBallIndex;
    if (ballIndex < 0 || ballIndex >= this.particleCount.blueBalls) return;

    // Project mouse position into 3D space
    const raycaster = this.gameState.userInteraction.raycaster;
    raycaster.setFromCamera(this.gameState.userInteraction.mouse, this.camera);

    // Find intersection with an invisible plane at y=2
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -2);
    const intersection = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, intersection);

    // Update ball position
    const idx = ballIndex * 3;
    this.blueBallsPositions[idx] = intersection.x;
    this.blueBallsPositions[idx + 1] = intersection.y;
    this.blueBallsPositions[idx + 2] = intersection.z;

    // Calculate velocity for visual feedback
    const dt = this.time - this.gameState.userInteraction.dragStartTime;
    if (dt > 0) {
      const startPos = this.gameState.userInteraction.dragStartPosition;
      const currentPos = this.gameState.userInteraction.currentPosition;

      // Screen space velocity
      const dx = ((currentPos.x - startPos.x) / dt) * 0.01;
      const dy = ((currentPos.y - startPos.y) / dt) * 0.01;

      // Project to 3D space (simplified)
      this.gameState.userInteraction.throwVelocity.set(
        dx,
        -dy * 0.5, // Reverse Y and scale down
        -dy * 0.5 // Forward/backward movement
      );
    }
  }

  /**
   * Throw the ball held by user
   */
  private throwHeldBall(): void {
    if (!this.gameState.userInteraction.isHolding) return;

    const ballIndex = this.gameState.userInteraction.heldBallIndex;
    if (ballIndex < 0) return;

    // Get drag duration and distance
    const dragDuration =
      this.time - this.gameState.userInteraction.dragStartTime;
    const startPos = this.gameState.userInteraction.dragStartPosition;
    const endPos = this.gameState.userInteraction.currentPosition;

    // Calculate drag distance and direction
    const dragDistX = endPos.x - startPos.x;
    const dragDistY = endPos.y - startPos.y;
    const dragDistance = Math.sqrt(
      dragDistX * dragDistX + dragDistY * dragDistY
    );

    // Only throw if drag was long enough
    if (dragDistance < 10 || dragDuration < 0.1) {
      // Too small movement - just drop the ball
      this.gameState.ballState[ballIndex] = "ground";
      this.gameState.ballOwnership[ballIndex] = -1;

      // Reset user state
      this.gameState.userInteraction.isHolding = false;
      this.gameState.userInteraction.heldBallIndex = -1;
      return;
    }

    // Calculate throw velocity based on drag
    const speed = Math.min(0.5, dragDistance * 0.001 * (1 / dragDuration));

    // Direction based on drag vector
    const dirX = dragDistX / dragDistance;
    const dirY = dragDistY / dragDistance;

    // Apply velocity to ball
    const idx = ballIndex * 3;
    this.blueBallsVelocities[idx] = dirX * speed;
    this.blueBallsVelocities[idx + 1] = -dirY * speed * 0.5; // Y is inverted in screen space
    this.blueBallsVelocities[idx + 2] = -dirY * speed * 0.5; // Forward/backward based on Y drag

    // Change state to thrown
    this.gameState.ballState[ballIndex] = "user-thrown";

    // Reset user state
    this.gameState.userInteraction.isHolding = false;
    this.gameState.userInteraction.heldBallIndex = -1;
    this.gameState.userInteraction.lastThrowTime = this.time;

    // Restore normal ball material
    const threeManager = ThreeManager.getInstance();
    const standardBallMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-blue",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x4488ff,
          emissive: 0x0044ff,
          emissiveIntensity: 0.5,
          roughness: 0.2,
          metalness: 0.8,
        })
    ) as THREE.MeshStandardMaterial;

    if (this.blueBalls) {
      this.blueBalls.material = standardBallMaterial;
    }
  }

  /**
   * Create mystical glow effect around a ball
   */
  private createMysticalGlow(ballIndex: number): void {
    const idx = ballIndex * 3;
    const position = new THREE.Vector3(
      this.blueBallsPositions[idx],
      this.blueBallsPositions[idx + 1],
      this.blueBallsPositions[idx + 2]
    );

    // Create glow mesh if not exists
    if (!this.mysticalBallGlow) {
      const glowGeometry = new THREE.SphereGeometry(1.5, 32, 32);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: 0x8a2be2, // Bright purple
        transparent: true,
        opacity: 0.7,
        blending: THREE.AdditiveBlending,
      });
      this.mysticalBallGlow = new THREE.Mesh(glowGeometry, glowMaterial);
      this.scene.add(this.mysticalBallGlow);
    }

    // Position and show glow
    this.mysticalBallGlow.position.copy(position);
    this.mysticalBallGlow.scale.set(1, 1, 1);
    this.mysticalBallGlow.visible = true;
  }

  /**
   * Create team victory glow effect
   */
  private createVictoryGlow(team: "red" | "green"): void {
    const color = team === "red" ? 0xff3333 : 0x33ff33;

    // Create victory glow plane if not exists
    if (!this.victoryGlow) {
      const glowGeometry = new THREE.PlaneGeometry(50, 30);
      const glowMaterial = new THREE.MeshBasicMaterial({
        color: color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        side: THREE.DoubleSide,
      });
      this.victoryGlow = new THREE.Mesh(glowGeometry, glowMaterial);
      this.victoryGlow.rotation.x = Math.PI / 2;
      this.victoryGlow.position.y = -0.3;
      this.scene.add(this.victoryGlow);
    } else {
      // Update existing glow color
      (this.victoryGlow.material as THREE.MeshBasicMaterial).color.setHex(
        color
      );
    }

    // Reset opacity
    (this.victoryGlow.material as THREE.MeshBasicMaterial).opacity = 0;
    this.gameState.specialEffects.victoryGlowIntensity = 0;
  }

  /**
   * Initialize position and velocity arrays
   */
  private initializeArrays(): void {
    // Red team
    this.redPositions = new Float32Array(this.particleCount.red * 3);
    this.redVelocities = new Float32Array(this.particleCount.red * 3);
    this.redEnergies = new Float32Array(this.particleCount.red);
    this.gameState.playerStatus.red = new Array(this.particleCount.red).fill(
      "active"
    );

    // Green team
    this.greenPositions = new Float32Array(this.particleCount.green * 3);
    this.greenVelocities = new Float32Array(this.particleCount.green * 3);
    this.greenEnergies = new Float32Array(this.particleCount.green);
    this.gameState.playerStatus.green = new Array(
      this.particleCount.green
    ).fill("active");

    // Blue balls
    this.blueBallsPositions = new Float32Array(
      this.particleCount.blueBalls * 3
    );
    this.blueBallsVelocities = new Float32Array(
      this.particleCount.blueBalls * 3
    );
    this.gameState.ballOwnership = new Array(this.particleCount.blueBalls).fill(
      -1
    );
    this.gameState.ballState = new Array(this.particleCount.blueBalls).fill(
      "center"
    );
    this.gameState.ballTargets = new Array(this.particleCount.blueBalls).fill(
      null
    );

    // Player throw cooldown timers (prevents constant throwing)
    this.gameState.throwCooldown = new Array(
      this.particleCount.red + this.particleCount.green
    ).fill(0);

    // Game pacing
    this.gameState.nextThrowTime = this.time + this.getRandomThrowDelay();
    this.gameState.lastActionTime = this.time;

    // Collision effects
    this.collisionAge = new Float32Array(this.maxCollisions);

    // Initialize trail positions
    for (let i = 0; i < this.particleCount.red; i++) {
      this.redTrailPositions.push([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
    }

    for (let i = 0; i < this.particleCount.green; i++) {
      this.greenTrailPositions.push([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
    }

    for (let i = 0; i < this.particleCount.blueBalls; i++) {
      this.blueTrailPositions.push([
        new THREE.Vector3(),
        new THREE.Vector3(),
        new THREE.Vector3(),
      ]);
    }
  }

  /**
   * Get a random delay between throws based on current tension factor
   */
  private getRandomThrowDelay(): number {
    // Calculate throw frequency based on tension
    const frequency =
      this.gameState.throwFrequency.min +
      (this.gameState.throwFrequency.max - this.gameState.throwFrequency.min) *
        this.gameState.tensionFactor;

    // Add randomness to throw timing
    const baseDelay = 1 / frequency;
    const randomFactor = 0.5 + Math.random(); // 0.5 to 1.5 randomness

    return baseDelay * randomFactor;
  }

  /**
   * Set up the 3D scene
   */
  private setupScene(): void {
    const threeManager = ThreeManager.getInstance();

    // Create shared geometries
    const playerGeometry = threeManager.getOrCreateGeometry(
      "dodgeball-player",
      () => new THREE.IcosahedronGeometry(0.3, 1) // Low-poly sphere for players
    );

    const ballGeometry = threeManager.getOrCreateGeometry(
      "dodgeball-ball",
      () => new THREE.IcosahedronGeometry(0.4, 2) // Higher-detail sphere for balls
    );

    const trailGeometry = threeManager.getOrCreateGeometry(
      "dodgeball-trail",
      () => new THREE.IcosahedronGeometry(0.3, 1) // Low-poly sphere for trails
    );

    const collisionGeometry = threeManager.getOrCreateGeometry(
      "dodgeball-collision",
      () => new THREE.IcosahedronGeometry(0.1, 1) // Small sphere for collision particles
    );

    // Create shared materials
    const redMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-red",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0xff3333,
          emissive: 0xff0000,
          emissiveIntensity: 0.3,
          roughness: 0.4,
          metalness: 0.7,
        })
    ) as THREE.MeshStandardMaterial;

    const greenMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-green",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x33ff33,
          emissive: 0x00ff00,
          emissiveIntensity: 0.3,
          roughness: 0.4,
          metalness: 0.7,
        })
    ) as THREE.MeshStandardMaterial;

    const blueMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-blue",
      () =>
        new THREE.MeshStandardMaterial({
          color: 0x4488ff,
          emissive: 0x0044ff,
          emissiveIntensity: 0.5,
          roughness: 0.2,
          metalness: 0.8,
        })
    ) as THREE.MeshStandardMaterial;

    const redTrailMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-red-trail",
      () =>
        new THREE.MeshBasicMaterial({
          color: 0xff3333,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
        })
    ) as THREE.MeshBasicMaterial;

    const greenTrailMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-green-trail",
      () =>
        new THREE.MeshBasicMaterial({
          color: 0x33ff33,
          transparent: true,
          opacity: 0.3,
          blending: THREE.AdditiveBlending,
        })
    ) as THREE.MeshBasicMaterial;

    const blueTrailMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-blue-trail",
      () =>
        new THREE.MeshBasicMaterial({
          color: 0x4488ff,
          transparent: true,
          opacity: 0.5,
          blending: THREE.AdditiveBlending,
        })
    ) as THREE.MeshBasicMaterial;

    const collisionMaterial = threeManager.getOrCreateMaterial(
      "dodgeball-collision",
      () =>
        new THREE.MeshBasicMaterial({
          color: 0xffffff,
          transparent: true,
          opacity: 0.7,
          blending: THREE.AdditiveBlending,
        })
    ) as THREE.MeshBasicMaterial;

    // Create instanced meshes
    this.redPlayers = new THREE.InstancedMesh(
      playerGeometry,
      redMaterial,
      this.particleCount.red
    );
    this.redPlayers.name = "redPlayers";
    this.scene.add(this.redPlayers);

    this.greenPlayers = new THREE.InstancedMesh(
      playerGeometry,
      greenMaterial,
      this.particleCount.green
    );
    this.greenPlayers.name = "greenPlayers";
    this.scene.add(this.greenPlayers);

    this.blueBalls = new THREE.InstancedMesh(
      ballGeometry,
      blueMaterial,
      this.particleCount.blueBalls
    );
    this.blueBalls.name = "blueBalls";
    this.scene.add(this.blueBalls);

    // Create trail meshes - 3 segments per particle
    this.redTrails = new THREE.InstancedMesh(
      trailGeometry,
      redTrailMaterial,
      this.particleCount.red * 3
    );
    this.redTrails.name = "redTrails";
    this.scene.add(this.redTrails);

    this.greenTrails = new THREE.InstancedMesh(
      trailGeometry,
      greenTrailMaterial,
      this.particleCount.green * 3
    );
    this.greenTrails.name = "greenTrails";
    this.scene.add(this.greenTrails);

    this.blueTrails = new THREE.InstancedMesh(
      trailGeometry,
      blueTrailMaterial,
      this.particleCount.blueBalls * 3
    );
    this.blueTrails.name = "blueTrails";
    this.scene.add(this.blueTrails);

    // Create collision effects mesh
    this.collisionEffects = new THREE.InstancedMesh(
      collisionGeometry,
      collisionMaterial,
      this.maxCollisions
    );
    this.collisionEffects.name = "collisionEffects";
    this.scene.add(this.collisionEffects);

    // Create dodgeball court
    const courtGeometry = new THREE.PlaneGeometry(50, 30);
    const courtMaterial = new THREE.MeshBasicMaterial({
      color: 0x222266,
      transparent: true,
      opacity: 0.2,
      side: THREE.DoubleSide,
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
      side: THREE.DoubleSide,
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
      side: THREE.DoubleSide,
    });

    const greenSideMaterial = new THREE.MeshBasicMaterial({
      color: 0x00ff00,
      transparent: true,
      opacity: 0.05,
      side: THREE.DoubleSide,
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
    if (this.collisionEffects)
      this.collisionEffects.instanceMatrix.needsUpdate = true;

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
    if (progress > 0.85 && this.gameState.phase === "ready" && this.time > 2) {
      // Let the game begin
    } else if (progress <= 0.85 && this.gameState.phase !== "ready") {
      // Keep game in ready state until camera is positioned
      this.gameState.phase = "ready";
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
  private updateGameState(deltaTime: number): void {
    // Skip state updates during camera animation
    if (
      this.initialCameraAnimation &&
      this.time - this.cameraStartTime < this.cameraAnimationDuration * 0.85
    ) {
      return;
    }

    // Update player throw cooldowns
    this.updateThrowCooldowns(deltaTime);

    // Update tension factor based on game state
    this.updateTensionFactor();

    // Update mystical catch effects if active
    if (this.gameState.phase === "mystical-catch") {
      this.updateMysticalCatchEffects(deltaTime);
      return; // Skip other game state updates during mystical catch
    }

    // Handle game phases based on elapsed time
    if (this.gameState.phase === "ready" && this.time > 2) {
      // Start rush phase after 2 seconds
      this.gameState.phase = "rush";
      this.gameState.phaseStartTime = this.time;
      this.gameState.lastActionTime = this.time;

      // Give players initial velocity toward center
      for (let i = 0; i < this.particleCount.red; i++) {
        this.redVelocities[i * 3] = 0.1 + Math.random() * 0.05; // Right
        this.redVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Z variation
      }

      for (let i = 0; i < this.particleCount.green; i++) {
        this.greenVelocities[i * 3] = -0.1 - Math.random() * 0.05; // Left
        this.greenVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.02; // Z variation
      }
    } else if (
      this.gameState.phase === "rush" &&
      this.time - this.gameState.phaseStartTime > 2
    ) {
      // Check if players should pick up balls
      this.checkBallPickup();

      // Check if rush phase is complete (all balls picked up or enough time elapsed)
      const allBallsPickedUp = !this.gameState.ballState.includes("center");
      const rushTimeout = this.time - this.gameState.phaseStartTime > 5;

      if (allBallsPickedUp || rushTimeout) {
        // Transition to battle phase
        this.gameState.phase = "battle";
        this.gameState.phaseStartTime = this.time;
        this.gameState.rushComplete = true;
        this.gameState.nextThrowTime = this.time + this.getRandomThrowDelay();

        // Players retreat to their sides
        for (let i = 0; i < this.particleCount.red; i++) {
          if (this.gameState.playerStatus.red[i] !== "eliminated") {
            // Red team moves left
            this.redVelocities[i * 3] = -0.05 - Math.random() * 0.05;
            this.redVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
          }
        }

        for (let i = 0; i < this.particleCount.green; i++) {
          if (this.gameState.playerStatus.green[i] !== "eliminated") {
            // Green team moves right
            this.greenVelocities[i * 3] = 0.05 + Math.random() * 0.05;
            this.greenVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.03;
          }
        }
      }
    } else if (this.gameState.phase === "battle") {
      // Handle battle phase - throwing and dodging
      this.manageBattlePhase();

      // Check if game is over
      if (
        this.gameState.redTeamActive === 0 ||
        this.gameState.greenTeamActive === 0
      ) {
        this.gameState.phase = "endgame";
        this.gameState.phaseStartTime = this.time;
      }
    } else if (this.gameState.phase === "endgame") {
      // Victory animations for winning team
      if (this.gameState.redTeamActive > 0) {
        this.celebrateVictory("red");
      } else {
        this.celebrateVictory("green");
      }

      // Reset after 5 seconds
      if (this.time - this.gameState.phaseStartTime > 5) {
        this.resetGame();
      }
    }
  }

  /**
   * Update player throw cooldowns
   */
  private updateThrowCooldowns(deltaTime: number): void {
    for (let i = 0; i < this.gameState.throwCooldown.length; i++) {
      if (this.gameState.throwCooldown[i] > 0) {
        this.gameState.throwCooldown[i] -= deltaTime;
        if (this.gameState.throwCooldown[i] < 0) {
          this.gameState.throwCooldown[i] = 0;
        }
      }
    }
  }

  /**
   * Update tension factor based on game state
   */
  private updateTensionFactor(): void {
    if (this.gameState.phase !== "battle") {
      // High tension during rush, full tension during endgame
      this.gameState.tensionFactor =
        this.gameState.phase === "endgame" ? 1.0 : 0.7;
      return;
    }

    // Base tension starts moderate
    let tension = 0.5;

    // Time since last action affects tension (decreases over time)
    const timeSinceAction = this.time - this.gameState.lastActionTime;
    tension -= Math.min(0.3, timeSinceAction * 0.1); // Decrease tension the longer nothing happens

    // Team imbalance affects tension
    const teamDifference = Math.abs(
      this.gameState.redTeamActive - this.gameState.greenTeamActive
    );
    const totalPlayers =
      this.gameState.redTeamActive + this.gameState.greenTeamActive;
    const imbalanceRatio = teamDifference / totalPlayers;

    // More tension when teams are evenly matched
    tension += 0.3 * (1 - imbalanceRatio);

    // Few players left = more tension
    if (totalPlayers < this.particleCount.red + this.particleCount.green) {
      const eliminationFactor =
        1 - totalPlayers / (this.particleCount.red + this.particleCount.green);
      tension += 0.3 * eliminationFactor;
    }

    // Balls in play increase tension
    const ballsInMotion = this.gameState.ballState.filter(
      (state) => state === "thrown"
    ).length;
    tension += 0.2 * (ballsInMotion / this.particleCount.blueBalls);

    // Clamp tension between 0.1 and 1.0
    this.gameState.tensionFactor = Math.max(0.1, Math.min(1.0, tension));
  }

  /**
   * Check if players should pick up balls during rush phase
   */
  private checkBallPickup(): void {
    // Skip if not in rush phase
    if (this.gameState.phase !== "rush") return;

    // Check for red team pickups
    for (let i = 0; i < this.particleCount.red; i++) {
      // Skip eliminated players
      if (this.gameState.playerStatus.red[i] === "eliminated") continue;

      // Skip players already carrying
      if (this.gameState.playerStatus.red[i] === "carrying") continue;

      const playerIdx = i * 3;
      const rx = this.redPositions[playerIdx];
      const ry = this.redPositions[playerIdx + 1];
      const rz = this.redPositions[playerIdx + 2];

      // Check against all balls
      for (let j = 0; j < this.particleCount.blueBalls; j++) {
        // Skip balls that aren't in center
        if (this.gameState.ballState[j] !== "center") continue;

        const ballIdx = j * 3;
        const bx = this.blueBallsPositions[ballIdx];
        const by = this.blueBallsPositions[ballIdx + 1];
        const bz = this.blueBallsPositions[ballIdx + 2];

        // Calculate squared distance
        const distSquared =
          (rx - bx) * (rx - bx) + (ry - by) * (ry - by) + (rz - bz) * (rz - bz);

        // Check if close enough to pick up (2.0 units)
        if (distSquared < 2.0) {
          // Red player picks up ball
          this.gameState.ballOwnership[j] = 0; // Red team
          this.gameState.ballState[j] = "carried";
          this.gameState.playerStatus.red[i] = "carrying";
          this.gameState.redTeamBalls++;
          this.gameState.lastActionTime = this.time;

          // Stop player's forward movement
          this.redVelocities[playerIdx] *= 0.5;

          // Make player retreat to their side
          this.redVelocities[playerIdx] = -0.08 - Math.random() * 0.04; // Move left
          break;
        }
      }
    }

    // Check for green team pickups (similar logic)
    for (let i = 0; i < this.particleCount.green; i++) {
      if (
        this.gameState.playerStatus.green[i] === "eliminated" ||
        this.gameState.playerStatus.green[i] === "carrying"
      )
        continue;

      const playerIdx = i * 3;
      const gx = this.greenPositions[playerIdx];
      const gy = this.greenPositions[playerIdx + 1];
      const gz = this.greenPositions[playerIdx + 2];

      for (let j = 0; j < this.particleCount.blueBalls; j++) {
        if (this.gameState.ballState[j] !== "center") continue;

        const ballIdx = j * 3;
        const bx = this.blueBallsPositions[ballIdx];
        const by = this.blueBallsPositions[ballIdx + 1];
        const bz = this.blueBallsPositions[ballIdx + 2];

        const distSquared =
          (gx - bx) * (gx - bx) + (gy - by) * (gy - by) + (gz - bz) * (gz - bz);

        if (distSquared < 2.0) {
          // Green player picks up ball
          this.gameState.ballOwnership[j] = 1; // Green team
          this.gameState.ballState[j] = "carried";
          this.gameState.playerStatus.green[i] = "carrying";
          this.gameState.greenTeamBalls++;
          this.gameState.lastActionTime = this.time;

          // Stop player's forward movement
          this.greenVelocities[playerIdx] *= 0.5;

          // Make player retreat to their side
          this.greenVelocities[playerIdx] = 0.08 + Math.random() * 0.04; // Move right
          break;
        }
      }
    }
  }

  /**
   * Manage battle phase - throwing and dodging
   */
  private manageBattlePhase(): void {
    // Skip if not in battle phase
    if (this.gameState.phase !== "battle") return;

    // Check if it's time for someone to throw
    if (this.time >= this.gameState.nextThrowTime) {
      // Decide which team throws
      const redCanThrow = this.canTeamThrow("red");
      const greenCanThrow = this.canTeamThrow("green");

      // If both teams can throw, pick randomly with slight advantage to team with fewer players
      let throwingTeam: "red" | "green" | null = null;

      if (redCanThrow && greenCanThrow) {
        // Calculate throw probability based on team balance
        const redAdvantage =
          (this.gameState.greenTeamActive - this.gameState.redTeamActive) /
          (this.gameState.redTeamActive + this.gameState.greenTeamActive);
        const redProb = 0.5 + redAdvantage * 0.3; // +/- 30% based on team difference

        throwingTeam = Math.random() < redProb ? "red" : "green";
      } else if (redCanThrow) {
        throwingTeam = "red";
      } else if (greenCanThrow) {
        throwingTeam = "green";
      }

      // Execute a throw if possible
      if (throwingTeam) {
        this.executeThrow(throwingTeam);

        // Set next throw time
        this.gameState.nextThrowTime = this.time + this.getRandomThrowDelay();
      }
    }

    // Update ball positions and check for hits
    this.updateThrownBalls();
  }

  /**
   * Check if a team can throw (has balls and not on cooldown)
   */
  private canTeamThrow(team: "red" | "green"): boolean {
    const teamBalls =
      team === "red"
        ? this.gameState.redTeamBalls
        : this.gameState.greenTeamBalls;
    if (teamBalls === 0) return false;

    // Check if any player is carrying and not on cooldown
    const playerStatuses =
      team === "red"
        ? this.gameState.playerStatus.red
        : this.gameState.playerStatus.green;
    const startIdx = team === "green" ? this.particleCount.red : 0;

    for (let i = 0; i < playerStatuses.length; i++) {
      if (
        playerStatuses[i] === "carrying" &&
        this.gameState.throwCooldown[startIdx + i] <= 0
      ) {
        return true;
      }
    }

    return false;
  }

  /**
   * Execute a throw from a random player on the team
   */
  private executeThrow(team: "red" | "green"): void {
    // Find players who can throw
    const candidates: number[] = [];
    const playerStatuses =
      team === "red"
        ? this.gameState.playerStatus.red
        : this.gameState.playerStatus.green;
    const startIdx = team === "green" ? this.particleCount.red : 0;

    for (let i = 0; i < playerStatuses.length; i++) {
      if (
        playerStatuses[i] === "carrying" &&
        this.gameState.throwCooldown[startIdx + i] <= 0
      ) {
        candidates.push(i);
      }
    }

    if (candidates.length === 0) return;

    // Pick a random thrower
    const throwerIdx =
      candidates[Math.floor(Math.random() * candidates.length)];

    // Find which ball they're carrying
    let ballIdx = -1;
    for (let i = 0; i < this.gameState.ballOwnership.length; i++) {
      const ownership = this.gameState.ballOwnership[i];
      if (
        (team === "red" && ownership === 0) ||
        (team === "green" && ownership === 1)
      ) {
        if (this.gameState.ballState[i] === "carried") {
          ballIdx = i;
          break;
        }
      }
    }

    if (ballIdx === -1) return;

    // Find a target on the opposite team
    const targetTeam = team === "red" ? "green" : "red";
    const targetStatuses =
      targetTeam === "red"
        ? this.gameState.playerStatus.red
        : this.gameState.playerStatus.green;
    const targetCandidates: number[] = [];

    for (let i = 0; i < targetStatuses.length; i++) {
      if (targetStatuses[i] !== "eliminated") {
        targetCandidates.push(i);
      }
    }

    if (targetCandidates.length === 0) return;

    // Pick a random target
    const targetIdx =
      targetCandidates[Math.floor(Math.random() * targetCandidates.length)];

    // Set up the throw
    this.gameState.ballState[ballIdx] = "thrown";
    this.gameState.ballTargets[ballIdx] = targetIdx;

    // Update player statuses
    if (team === "red") {
      this.gameState.playerStatus.red[throwerIdx] = "throwing";
      this.gameState.redTeamBalls--;

      // Set throw position
      const playerIdx = throwerIdx * 3;
      const throwX = this.redPositions[playerIdx];
      const throwY = this.redPositions[playerIdx + 1];
      const throwZ = this.redPositions[playerIdx + 2];

      this.blueBallsPositions[ballIdx * 3] = throwX;
      this.blueBallsPositions[ballIdx * 3 + 1] = throwY;
      this.blueBallsPositions[ballIdx * 3 + 2] = throwZ;

      // Target position
      const targetPlayerIdx = targetIdx * 3;
      const targetX = this.greenPositions[targetPlayerIdx];
      const targetY = this.greenPositions[targetPlayerIdx + 1];
      const targetZ = this.greenPositions[targetPlayerIdx + 2];

      // Calculate velocity vector
      const distance = Math.sqrt(
        (targetX - throwX) * (targetX - throwX) +
          (targetY - throwY) * (targetY - throwY) +
          (targetZ - throwZ) * (targetZ - throwZ)
      );

      // Normalize and scale by throw speed
      const throwSpeed = 0.3 + Math.random() * 0.2; // Fast!
      this.blueBallsVelocities[ballIdx * 3] =
        ((targetX - throwX) / distance) * throwSpeed;
      this.blueBallsVelocities[ballIdx * 3 + 1] =
        ((targetY - throwY) / distance) * throwSpeed + 0.05; // Slight arc
      this.blueBallsVelocities[ballIdx * 3 + 2] =
        ((targetZ - throwZ) / distance) * throwSpeed;

      // Set cooldown
      this.gameState.throwCooldown[throwerIdx] = 2.0; // 2 second cooldown

      // Make target dodge sometimes
      if (Math.random() < 0.6) {
        // 60% chance to dodge
        this.gameState.playerStatus.green[targetIdx] = "dodging";

        // Apply dodge velocity
        const dodgeAngle = Math.random() * Math.PI * 2;
        const dodgeSpeed = 0.15 + Math.random() * 0.1;
        this.greenVelocities[targetPlayerIdx] +=
          Math.cos(dodgeAngle) * dodgeSpeed;
        this.greenVelocities[targetPlayerIdx + 2] +=
          Math.sin(dodgeAngle) * dodgeSpeed;
      }
    } else {
      // Same logic for green team throwing
      this.gameState.playerStatus.green[throwerIdx] = "throwing";
      this.gameState.greenTeamBalls--;

      // Set throw position
      const playerIdx = throwerIdx * 3;
      const throwX = this.greenPositions[playerIdx];
      const throwY = this.greenPositions[playerIdx + 1];
      const throwZ = this.greenPositions[playerIdx + 2];

      this.blueBallsPositions[ballIdx * 3] = throwX;
      this.blueBallsPositions[ballIdx * 3 + 1] = throwY;
      this.blueBallsPositions[ballIdx * 3 + 2] = throwZ;

      // Target position
      const targetPlayerIdx = targetIdx * 3;
      const targetX = this.redPositions[targetPlayerIdx];
      const targetY = this.redPositions[targetPlayerIdx + 1];
      const targetZ = this.redPositions[targetPlayerIdx + 2];

      // Calculate velocity vector
      const distance = Math.sqrt(
        (targetX - throwX) * (targetX - throwX) +
          (targetY - throwY) * (targetY - throwY) +
          (targetZ - throwZ) * (targetZ - throwZ)
      );

      // Normalize and scale by throw speed
      const throwSpeed = 0.3 + Math.random() * 0.2; // Fast!
      this.blueBallsVelocities[ballIdx * 3] =
        ((targetX - throwX) / distance) * throwSpeed;
      this.blueBallsVelocities[ballIdx * 3 + 1] =
        ((targetY - throwY) / distance) * throwSpeed + 0.05; // Slight arc
      this.blueBallsVelocities[ballIdx * 3 + 2] =
        ((targetZ - throwZ) / distance) * throwSpeed;

      // Set cooldown
      this.gameState.throwCooldown[this.particleCount.red + throwerIdx] = 2.0; // 2 second cooldown

      // Make target dodge sometimes
      if (Math.random() < 0.6) {
        // 60% chance to dodge
        this.gameState.playerStatus.red[targetIdx] = "dodging";

        // Apply dodge velocity
        const dodgeAngle = Math.random() * Math.PI * 2;
        const dodgeSpeed = 0.15 + Math.random() * 0.1;
        this.redVelocities[targetPlayerIdx] +=
          Math.cos(dodgeAngle) * dodgeSpeed;
        this.redVelocities[targetPlayerIdx + 2] +=
          Math.sin(dodgeAngle) * dodgeSpeed;
      }
    }

    // Reset to active status after a delay
    setTimeout(() => {
      if (
        team === "red" &&
        this.gameState.playerStatus.red[throwerIdx] === "throwing"
      ) {
        this.gameState.playerStatus.red[throwerIdx] = "active";
      } else if (
        team === "green" &&
        this.gameState.playerStatus.green[throwerIdx] === "throwing"
      ) {
        this.gameState.playerStatus.green[throwerIdx] = "active";
      }
    }, 500);

    // Record action time
    this.gameState.lastActionTime = this.time;
  }

  /**
   * Update thrown balls and check for hits
   */
  private updateThrownBalls(): void {
    for (let i = 0; i < this.particleCount.blueBalls; i++) {
      // Process both AI-thrown and user-thrown balls
      if (
        this.gameState.ballState[i] !== "thrown" &&
        this.gameState.ballState[i] !== "user-thrown"
      )
        continue;

      const isUserThrown = this.gameState.ballState[i] === "user-thrown";

      const ballIdx = i * 3;
      const bx = this.blueBallsPositions[ballIdx];
      const by = this.blueBallsPositions[ballIdx + 1];
      const bz = this.blueBallsPositions[ballIdx + 2];

      // Check if ball hit the ground
      if (by <= 0) {
        // Ball hits ground
        this.gameState.ballState[i] = "ground";
        this.gameState.ballOwnership[i] = -1;
        this.gameState.ballTargets[i] = null;

        // Bounce effect
        this.blueBallsVelocities[ballIdx] *= 0.5;
        this.blueBallsVelocities[ballIdx + 1] = 0;
        this.blueBallsVelocities[ballIdx + 2] *= 0.5;
        continue;
      }

      // User balls can hit both teams, AI balls only hit the opposing team
      let teamsToCheck: ("red" | "green")[] = [];

      if (isUserThrown) {
        // User-thrown balls can hit both teams
        teamsToCheck = ["red", "green"];
      } else {
        // AI-thrown balls only hit the opposing team
        const ballOwner = this.gameState.ballOwnership[i];
        teamsToCheck = [ballOwner === 0 ? "green" : "red"];
      }

      // Check for hits against each relevant team
      let hitDetected = false;

      for (const targetTeam of teamsToCheck) {
        if (hitDetected) break; // Skip second team if already hit someone

        const targetPositions =
          targetTeam === "red" ? this.redPositions : this.greenPositions;
        const targetStatuses =
          targetTeam === "red"
            ? this.gameState.playerStatus.red
            : this.gameState.playerStatus.green;

        const teamSize =
          targetTeam === "red"
            ? this.particleCount.red
            : this.particleCount.green;
        for (let j = 0; j < teamSize; j++) {
          if (targetStatuses[j] === "eliminated") continue;

          const playerIdx = j * 3;
          const px = targetPositions[playerIdx];
          const py = targetPositions[playerIdx + 1];
          const pz = targetPositions[playerIdx + 2];

          // Calculate squared distance
          const distSquared =
            (bx - px) * (bx - px) +
            (by - py) * (by - py) +
            (bz - pz) * (bz - pz);

          // Check if hit (1.0 unit distance)
          if (distSquared < 1.0) {
            hitDetected = true;

            // Different logic for user-thrown vs AI-thrown balls
            if (isUserThrown) {
              // User-thrown balls can be caught very rarely (1/100 chance)
              // This triggers the "golden snitch" effect
              const catchChance =
                targetStatuses[j] === "dodging" ? 0.004 : 0.001;
              const isMysticalCatch = Math.random() < catchChance;

              if (isMysticalCatch) {
                // Mystical catch! This is a special event
                this.processMysticalCatch(targetTeam, j, i);
              } else {
                // Normal hit - eliminate player
                this.eliminatePlayer(targetTeam, j);

                // Ball continues but loses some momentum
                this.blueBallsVelocities[ballIdx] *= 0.8;

                // Create hit effect
                this.createCollision(px, py, pz, targetTeam !== "red");

                // Record action
                this.gameState.lastActionTime = this.time;
              }
            } else {
              // AI-thrown ball - normal dodgeball rules
              const catchChance = targetStatuses[j] === "dodging" ? 0.4 : 0.1;
              const isCatching = Math.random() < catchChance;

              if (isCatching) {
                // Player catches the ball!
                if (targetTeam === "red") {
                  this.gameState.playerStatus.red[j] = "carrying";
                  this.gameState.redTeamBalls++;

                  // The thrower is eliminated
                  const throwerTeam = "green";
                  for (let k = 0; k < this.particleCount.green; k++) {
                    if (this.gameState.playerStatus.green[k] === "throwing") {
                      this.eliminatePlayer(throwerTeam, k);
                      break;
                    }
                  }
                } else {
                  this.gameState.playerStatus.green[j] = "carrying";
                  this.gameState.greenTeamBalls++;

                  // The thrower is eliminated
                  const throwerTeam = "red";
                  for (let k = 0; k < this.particleCount.red; k++) {
                    if (this.gameState.playerStatus.red[k] === "throwing") {
                      this.eliminatePlayer(throwerTeam, k);
                      break;
                    }
                  }
                }

                // Update ball state
                this.gameState.ballState[i] = "carried";
                this.gameState.ballOwnership[i] = targetTeam === "red" ? 0 : 1;
                this.gameState.ballTargets[i] = null;

                // Create catch effect
                this.createCollision(px, py, pz, targetTeam === "red");

                // Record action
                this.gameState.lastActionTime = this.time;

                // Increase tension
                this.gameState.tensionFactor = Math.min(
                  1.0,
                  this.gameState.tensionFactor + 0.2
                );
              } else {
                // Player gets hit!
                this.eliminatePlayer(targetTeam, j);

                // Ball drops to ground
                this.gameState.ballState[i] = "ground";
                this.gameState.ballOwnership[i] = -1;
                this.gameState.ballTargets[i] = null;

                // Ball loses momentum
                this.blueBallsVelocities[ballIdx] *= 0.2;
                this.blueBallsVelocities[ballIdx + 1] = 0;
                this.blueBallsVelocities[ballIdx + 2] *= 0.2;

                // Create hit effect
                this.createCollision(px, py, pz, targetTeam !== "red");

                // Record action
                this.gameState.lastActionTime = this.time;

                // Increase tension
                this.gameState.tensionFactor = Math.min(
                  1.0,
                  this.gameState.tensionFactor + 0.3
                );
              }
            }

            break;
          }
        }
      } // End of team loop
    }
  }

  /**
   * Eliminate a player
   */
  private eliminatePlayer(team: "red" | "green", playerIdx: number): void {
    if (team === "red") {
      if (this.gameState.playerStatus.red[playerIdx] === "eliminated") return;

      this.gameState.playerStatus.red[playerIdx] = "eliminated";
      this.gameState.redTeamActive--;

      // Drop any carried ball
      for (let i = 0; i < this.particleCount.blueBalls; i++) {
        if (
          this.gameState.ballOwnership[i] === 0 &&
          this.gameState.ballState[i] === "carried"
        ) {
          const pIdx = playerIdx * 3;

          // Position ball at player's position
          this.blueBallsPositions[i * 3] = this.redPositions[pIdx];
          this.blueBallsPositions[i * 3 + 1] = this.redPositions[pIdx + 1];
          this.blueBallsPositions[i * 3 + 2] = this.redPositions[pIdx + 2];

          // Ball drops to ground
          this.gameState.ballState[i] = "ground";
          this.gameState.ballOwnership[i] = -1;
          this.blueBallsVelocities[i * 3] = (Math.random() - 0.5) * 0.05;
          this.blueBallsVelocities[i * 3 + 1] = 0;
          this.blueBallsVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

          this.gameState.redTeamBalls--;
          break;
        }
      }

      // Hide player
      this.matrix.makeScale(0, 0, 0);
      this.redPlayers?.setMatrixAt(playerIdx, this.matrix);
      this.redPlayers!.instanceMatrix.needsUpdate = true;
    } else {
      if (this.gameState.playerStatus.green[playerIdx] === "eliminated") return;

      this.gameState.playerStatus.green[playerIdx] = "eliminated";
      this.gameState.greenTeamActive--;

      // Drop any carried ball
      for (let i = 0; i < this.particleCount.blueBalls; i++) {
        if (
          this.gameState.ballOwnership[i] === 1 &&
          this.gameState.ballState[i] === "carried"
        ) {
          const pIdx = playerIdx * 3;

          // Position ball at player's position
          this.blueBallsPositions[i * 3] = this.greenPositions[pIdx];
          this.blueBallsPositions[i * 3 + 1] = this.greenPositions[pIdx + 1];
          this.blueBallsPositions[i * 3 + 2] = this.greenPositions[pIdx + 2];

          // Ball drops to ground
          this.gameState.ballState[i] = "ground";
          this.gameState.ballOwnership[i] = -1;
          this.blueBallsVelocities[i * 3] = (Math.random() - 0.5) * 0.05;
          this.blueBallsVelocities[i * 3 + 1] = 0;
          this.blueBallsVelocities[i * 3 + 2] = (Math.random() - 0.5) * 0.05;

          this.gameState.greenTeamBalls--;
          break;
        }
      }

      // Hide player
      this.matrix.makeScale(0, 0, 0);
      this.greenPlayers?.setMatrixAt(playerIdx, this.matrix);
      this.greenPlayers!.instanceMatrix.needsUpdate = true;
    }
  }

  /**
   * Celebration animations for the winning team
   */
  private celebrateVictory(team: "red" | "green"): void {
    // Players do victory dance
    const playerStatuses =
      team === "red"
        ? this.gameState.playerStatus.red
        : this.gameState.playerStatus.green;
    const positions = team === "red" ? this.redPositions : this.greenPositions;

    for (let i = 0; i < playerStatuses.length; i++) {
      if (playerStatuses[i] !== "eliminated") {
        const idx = i * 3;

        // Make players bounce
        positions[idx + 1] = Math.abs(Math.sin(this.time * 5 + i)) * 0.5;

        // Create celebratory particles at random intervals
        if (Math.random() < 0.1) {
          this.createCollision(
            positions[idx],
            positions[idx + 1] + 0.5,
            positions[idx + 2],
            team === "red"
          );
        }
      }
    }
  }

  /**
   * Update red team players
   */
  private updateRedTeam(deltaTime: number): void {
    for (let i = 0; i < this.particleCount.red; i++) {
      if (this.gameState.playerStatus.red[i] === "eliminated") {
        // Skip eliminated players
        continue;
      }

      const idx = i * 3;

      // Apply velocity
      this.redPositions[idx] += this.redVelocities[idx] * 60 * deltaTime;
      this.redPositions[idx + 1] +=
        this.redVelocities[idx + 1] * 60 * deltaTime;
      this.redPositions[idx + 2] +=
        this.redVelocities[idx + 2] * 60 * deltaTime;

      // Add random movement during battle
      if (this.gameState.phase === "battle") {
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
        this.redPositions[idx + 2] =
          Math.sign(this.redPositions[idx + 2]) * courtDepth;
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
        if (this.gameState.phase === "battle") {
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
        this.redTrailPositions[i][0]
          .copy(this.position)
          .add(
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
          (this.redTrails?.material as THREE.MeshBasicMaterial).opacity =
            trailOpacity;
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
      if (this.gameState.playerStatus.green[i] === "eliminated") {
        // Skip eliminated players
        continue;
      }

      const idx = i * 3;

      // Apply velocity
      this.greenPositions[idx] += this.greenVelocities[idx] * 60 * deltaTime;
      this.greenPositions[idx + 1] +=
        this.greenVelocities[idx + 1] * 60 * deltaTime;
      this.greenPositions[idx + 2] +=
        this.greenVelocities[idx + 2] * 60 * deltaTime;

      // Add random movement during battle
      if (this.gameState.phase === "battle") {
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
        this.greenPositions[idx] =
          Math.sign(this.greenPositions[idx]) * courtWidth;
      }

      // Depth boundaries (same for both teams)
      if (Math.abs(this.greenPositions[idx + 2]) > courtDepth) {
        this.greenVelocities[idx + 2] *= -0.5; // Bounce with energy loss
        this.greenPositions[idx + 2] =
          Math.sign(this.greenPositions[idx + 2]) * courtDepth;
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
        if (this.gameState.phase === "battle") {
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
        this.greenTrailPositions[i][0]
          .copy(this.position)
          .add(
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
          (this.greenTrails?.material as THREE.MeshBasicMaterial).opacity =
            trailOpacity;
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

      // Update based on ball state
      const ballState = this.gameState.ballState[i];

      // Update based on game phase and ball state
      if (this.gameState.phase === "ready") {
        // Balls hover at center
        this.blueBallsPositions[idx + 1] =
          0.5 + Math.sin(this.time * 5 + i) * 0.2;

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
      } else if (ballState === "carried") {
        // Ball is being carried by a player
        const team = this.gameState.ballOwnership[i] === 0 ? "red" : "green";

        // Find which player is carrying the ball
        const playerStatuses =
          team === "red"
            ? this.gameState.playerStatus.red
            : this.gameState.playerStatus.green;
        const positions =
          team === "red" ? this.redPositions : this.greenPositions;

        for (let j = 0; j < playerStatuses.length; j++) {
          if (playerStatuses[j] === "carrying") {
            const playerIdx = j * 3;

            // Position ball slightly offset from player
            const offsetX = team === "red" ? 0.7 : -0.7; // Offset in direction based on team

            this.blueBallsPositions[idx] = positions[playerIdx] + offsetX;
            this.blueBallsPositions[idx + 1] = positions[playerIdx + 1] + 0.5; // Slightly above player
            this.blueBallsPositions[idx + 2] = positions[playerIdx + 2];

            // Update position for rendering
            this.position.set(
              this.blueBallsPositions[idx],
              this.blueBallsPositions[idx + 1],
              this.blueBallsPositions[idx + 2]
            );

            // Spin the ball slower when carried
            this.rotation.x = this.time * 1 + i;
            this.rotation.y = this.time * 1.5;
            this.quaternion.setFromEuler(this.rotation);

            // Apply normal scale
            this.scale.set(1, 1, 1);

            // Update matrix
            this.matrix.compose(this.position, this.quaternion, this.scale);
            this.blueBalls?.setMatrixAt(i, this.matrix);

            // No trails when carried
            for (let t = 0; t < 3; t++) {
              this.matrix.makeScale(0, 0, 0);
              this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);
            }

            break;
          }
        }
      } else if (ballState === "thrown") {
        // Ball is in flight - apply velocity and check for collisions
        // Update position based on velocity
        this.blueBallsPositions[idx] +=
          this.blueBallsVelocities[idx] * 60 * deltaTime;
        this.blueBallsPositions[idx + 1] +=
          this.blueBallsVelocities[idx + 1] * 60 * deltaTime;
        this.blueBallsPositions[idx + 2] +=
          this.blueBallsVelocities[idx + 2] * 60 * deltaTime;

        // Apply gravity
        this.blueBallsVelocities[idx + 1] -= 0.003; // Lower gravity for longer arcs

        // Calculate speed for visual effects
        const speed = Math.sqrt(
          this.blueBallsVelocities[idx] * this.blueBallsVelocities[idx] +
            this.blueBallsVelocities[idx + 1] *
              this.blueBallsVelocities[idx + 1] +
            this.blueBallsVelocities[idx + 2] *
              this.blueBallsVelocities[idx + 2]
        );

        // Update position
        this.position.set(
          this.blueBallsPositions[idx],
          this.blueBallsPositions[idx + 1],
          this.blueBallsPositions[idx + 2]
        );

        // Fast spin when thrown
        this.rotation.x += this.blueBallsVelocities[idx + 2] * 10;
        this.rotation.y += this.blueBallsVelocities[idx] * 10;
        this.quaternion.setFromEuler(this.rotation);

        // Stretch in direction of movement
        const stretchFactor = Math.min(1 + speed * 8, 2.5);

        // Direction of movement
        const moveDir = new THREE.Vector3(
          this.blueBallsVelocities[idx],
          this.blueBallsVelocities[idx + 1],
          this.blueBallsVelocities[idx + 2]
        ).normalize();

        // Apply stretch
        this.scale.copy(new THREE.Vector3(1, 1, 1));
        if (moveDir.length() > 0) {
          this.scale.x += moveDir.x * (stretchFactor - 1);
          this.scale.y += moveDir.y * (stretchFactor - 1);
          this.scale.z += moveDir.z * (stretchFactor - 1);
        }

        // Update matrix
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.blueBalls?.setMatrixAt(i, this.matrix);

        // Update trails for thrown balls
        if (speed > 0.1) {
          // Shift previous positions
          this.blueTrailPositions[i][2].copy(this.blueTrailPositions[i][1]);
          this.blueTrailPositions[i][1].copy(this.blueTrailPositions[i][0]);
          this.blueTrailPositions[i][0]
            .copy(this.position)
            .add(
              new THREE.Vector3(
                -this.blueBallsVelocities[idx] * 4,
                -this.blueBallsVelocities[idx + 1] * 4,
                -this.blueBallsVelocities[idx + 2] * 4
              )
            );

          // Set trail with decreasing scale - more prominent for thrown balls
          for (let t = 0; t < 3; t++) {
            const trailScale = 0.6 - t * 0.15;
            const trailOpacity = Math.min(speed * 15, 1) * (0.7 - t * 0.2);

            this.scale.set(trailScale, trailScale, trailScale);
            this.matrix.compose(
              this.blueTrailPositions[i][t],
              this.quaternion,
              this.scale
            );
            this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);

            // Update material opacity
            (this.blueTrails?.material as THREE.MeshBasicMaterial).opacity =
              trailOpacity;
          }
        }
      } else if (ballState === "ground") {
        // Ball is on the ground - slowly roll to a stop
        if (this.blueBallsPositions[idx + 1] > 0) {
          // Still falling
          this.blueBallsPositions[idx] +=
            this.blueBallsVelocities[idx] * 60 * deltaTime;
          this.blueBallsPositions[idx + 1] +=
            this.blueBallsVelocities[idx + 1] * 60 * deltaTime;
          this.blueBallsPositions[idx + 2] +=
            this.blueBallsVelocities[idx + 2] * 60 * deltaTime;

          // Apply gravity
          this.blueBallsVelocities[idx + 1] -= 0.002;
        } else {
          // On ground
          this.blueBallsPositions[idx + 1] = 0;
          this.blueBallsVelocities[idx + 1] = 0;

          // Apply friction
          this.blueBallsVelocities[idx] *= 0.95;
          this.blueBallsVelocities[idx + 2] *= 0.95;

          // Update position based on remaining velocity
          this.blueBallsPositions[idx] +=
            this.blueBallsVelocities[idx] * 60 * deltaTime;
          this.blueBallsPositions[idx + 2] +=
            this.blueBallsVelocities[idx + 2] * 60 * deltaTime;

          // Check if ball has stopped - let players pick it up
          const speed = Math.sqrt(
            this.blueBallsVelocities[idx] * this.blueBallsVelocities[idx] +
              this.blueBallsVelocities[idx + 2] *
                this.blueBallsVelocities[idx + 2]
          );

          if (speed < 0.001) {
            this.blueBallsVelocities[idx] = 0;
            this.blueBallsVelocities[idx + 2] = 0;

            // Ball can be picked up again
            this.gameState.ballState[i] = "center";
          }
        }

        // Update position
        this.position.set(
          this.blueBallsPositions[idx],
          this.blueBallsPositions[idx + 1],
          this.blueBallsPositions[idx + 2]
        );

        // Roll the ball
        if (
          this.blueBallsVelocities[idx] !== 0 ||
          this.blueBallsVelocities[idx + 2] !== 0
        ) {
          // Roll based on velocity direction
          const rollAxis = new THREE.Vector3(
            -this.blueBallsVelocities[idx + 2],
            0,
            this.blueBallsVelocities[idx]
          ).normalize();

          const rollSpeed = Math.sqrt(
            this.blueBallsVelocities[idx] * this.blueBallsVelocities[idx] +
              this.blueBallsVelocities[idx + 2] *
                this.blueBallsVelocities[idx + 2]
          );

          this.rotation.x += rollAxis.x * rollSpeed * 20 * deltaTime;
          this.rotation.z += rollAxis.z * rollSpeed * 20 * deltaTime;
        } else {
          // Still spin slowly when stopped
          this.rotation.y = this.time * 0.5 + i;
        }

        this.quaternion.setFromEuler(this.rotation);

        // Normal scale for grounded balls
        this.scale.set(1, 1, 1);

        // Update matrix
        this.matrix.compose(this.position, this.quaternion, this.scale);
        this.blueBalls?.setMatrixAt(i, this.matrix);

        // Minimal trails for rolling balls
        for (let t = 0; t < 3; t++) {
          this.matrix.makeScale(0, 0, 0);
          this.blueTrails?.setMatrixAt(i * 3 + t, this.matrix);
        }
      } else {
        // 'center' state or default
        // Rush and battle phases

        // Apply velocity
        this.blueBallsPositions[idx] +=
          this.blueBallsVelocities[idx] * 60 * deltaTime;
        this.blueBallsPositions[idx + 1] +=
          this.blueBallsVelocities[idx + 1] * 60 * deltaTime;
        this.blueBallsPositions[idx + 2] +=
          this.blueBallsVelocities[idx + 2] * 60 * deltaTime;

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
          this.blueBallsPositions[idx] =
            Math.sign(this.blueBallsPositions[idx]) * courtWidth;
        }

        if (Math.abs(this.blueBallsPositions[idx + 2]) > courtDepth) {
          this.blueBallsVelocities[idx + 2] *= -0.7; // Bouncier than players
          this.blueBallsPositions[idx + 2] =
            Math.sign(this.blueBallsPositions[idx + 2]) * courtDepth;
        }

        // Calculate speed for visual effects
        const speed = Math.sqrt(
          this.blueBallsVelocities[idx] * this.blueBallsVelocities[idx] +
            this.blueBallsVelocities[idx + 1] *
              this.blueBallsVelocities[idx + 1] +
            this.blueBallsVelocities[idx + 2] *
              this.blueBallsVelocities[idx + 2]
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
          this.blueTrailPositions[i][0]
            .copy(this.position)
            .add(
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
            (this.blueTrails?.material as THREE.MeshBasicMaterial).opacity =
              trailOpacity;
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
    if (this.gameState.phase === "ready") return;

    // Only check some particles each frame for performance
    const checkRatio = 0.2; // Check 20% of particles per frame
    const redCheckCount = Math.floor(this.particleCount.red * checkRatio);
    const redStartIdx = Math.floor(
      Math.random() * (this.particleCount.red - redCheckCount)
    );

    // Check red vs green collisions
    for (let i = redStartIdx; i < redStartIdx + redCheckCount; i++) {
      if (this.gameState.playerStatus.red[i] === "eliminated") continue;

      const redIdx = i * 3;
      const rx = this.redPositions[redIdx];
      const ry = this.redPositions[redIdx + 1];
      const rz = this.redPositions[redIdx + 2];

      // Check against a few random green players
      const greenCheck = Math.min(
        5,
        Math.floor(this.particleCount.green * 0.1)
      );

      for (let j = 0; j < greenCheck; j++) {
        const greenI = Math.floor(Math.random() * this.particleCount.green);

        if (this.gameState.playerStatus.green[greenI] === "eliminated")
          continue;

        const greenIdx = greenI * 3;
        const gx = this.greenPositions[greenIdx];
        const gy = this.greenPositions[greenIdx + 1];
        const gz = this.greenPositions[greenIdx + 2];

        // Calculate squared distance (faster than using sqrt)
        const distSquared =
          (rx - gx) * (rx - gx) + (ry - gy) * (ry - gy) + (rz - gz) * (rz - gz);

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
    const blueStartIdx = Math.floor(
      Math.random() * (this.particleCount.blueBalls - blueCheckCount)
    );

    for (let i = blueStartIdx; i < blueStartIdx + blueCheckCount; i++) {
      const blueIdx = i * 3;
      const bx = this.blueBallsPositions[blueIdx];
      const by = this.blueBallsPositions[blueIdx + 1];
      const bz = this.blueBallsPositions[blueIdx + 2];

      // Skip if ball is not moving enough
      const ballSpeed = Math.sqrt(
        this.blueBallsVelocities[blueIdx] * this.blueBallsVelocities[blueIdx] +
          this.blueBallsVelocities[blueIdx + 1] *
            this.blueBallsVelocities[blueIdx + 1] +
          this.blueBallsVelocities[blueIdx + 2] *
            this.blueBallsVelocities[blueIdx + 2]
      );

      if (ballSpeed < 0.03) continue;

      // Check against red players
      for (let j = 0; j < Math.min(3, this.particleCount.red); j++) {
        const redI = Math.floor(Math.random() * this.particleCount.red);
        if (this.gameState.playerStatus.red[redI] === "eliminated") continue;

        const redIdx = redI * 3;
        const rx = this.redPositions[redIdx];
        const ry = this.redPositions[redIdx + 1];
        const rz = this.redPositions[redIdx + 2];

        const distSquared =
          (bx - rx) * (bx - rx) + (by - ry) * (by - ry) + (bz - rz) * (bz - rz);

        if (distSquared < 1.2) {
          // Ball hit red player!
          this.createCollision(
            (bx + rx) / 2,
            (by + ry) / 2,
            (bz + rz) / 2,
            false // Green team effect (red player hit)
          );

          // Eliminate player with dramatic effect
          if (Math.random() < 0.3 && this.gameState.phase === "battle") {
            this.gameState.playerStatus.red[redI] = "eliminated";
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
                ry + Math.random() * 0.7, // Higher vertical spread
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
        if (this.gameState.playerStatus.green[greenI] === "eliminated")
          continue;

        const greenIdx = greenI * 3;
        const gx = this.greenPositions[greenIdx];
        const gy = this.greenPositions[greenIdx + 1];
        const gz = this.greenPositions[greenIdx + 2];

        const distSquared =
          (bx - gx) * (bx - gx) + (by - gy) * (by - gy) + (bz - gz) * (bz - gz);

        if (distSquared < 1.2) {
          // Ball hit green player!
          this.createCollision(
            (bx + gx) / 2,
            (by + gy) / 2,
            (bz + gz) / 2,
            true // Red team effect (green player hit)
          );

          // Eliminate player with dramatic effect
          if (Math.random() < 0.3 && this.gameState.phase === "battle") {
            this.gameState.playerStatus.green[greenI] = "eliminated";
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
                gy + Math.random() * 0.7, // Higher vertical spread
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
  private createCollision(
    x: number,
    y: number,
    z: number,
    isRed: boolean
  ): void {
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
      (this.collisionEffects?.material as THREE.MeshBasicMaterial).color.set(
        0xff5555
      );
    } else {
      (this.collisionEffects?.material as THREE.MeshBasicMaterial).color.set(
        0x55ff55
      );
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
        this.scale.set(scaleMultiplier, scaleMultiplier, scaleMultiplier);

        // Set opacity
        (this.collisionEffects?.material as THREE.MeshBasicMaterial).opacity =
          fadePhase;

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
    const redAdvantage =
      this.gameState.redTeamActive - this.gameState.greenTeamActive;

    if (redAdvantage > 0) {
      // Red team winning
      this.redLight.intensity += 0.1;
    } else if (redAdvantage < 0) {
      // Green team winning
      this.greenLight.intensity += 0.1;
    }

    // Very subtle position movement
    if (this.gameState.phase === "battle") {
      // Move lights in small circles
      this.redLight.position.x = -15 + Math.sin(this.time * 0.3) * 1;
      this.redLight.position.z = Math.cos(this.time * 0.4) * 1;

      this.greenLight.position.x = 15 + Math.sin(this.time * 0.3 + Math.PI) * 1;
      this.greenLight.position.z = Math.cos(this.time * 0.4 + Math.PI) * 1;
    }

    // Subtle flash effect on hits - much more restrained
    if (
      this.activeCollisions > 0 &&
      this.time - this.gameState.lastHitTime < 0.3
    ) {
      // Flash on recent hit
      const hitIntensity =
        0.2 * (1 - (this.time - this.gameState.lastHitTime) * 3);
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
      time: this.time,
    };
  }

  /**
   * Reset the game
   */
  public resetGame(): void {
    // Reset game state
    this.gameState.phase = "ready";
    this.gameState.phaseStartTime = 0;
    this.gameState.rushComplete = false;

    // Reset player status
    this.gameState.playerStatus.red = new Array(this.particleCount.red).fill(
      "active"
    );
    this.gameState.playerStatus.green = new Array(
      this.particleCount.green
    ).fill("active");
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

    // Remove event listeners
    if (this.container) {
      this.container.removeEventListener(
        "mousedown",
        this.onMouseDown.bind(this)
      );
      this.container.removeEventListener(
        "touchstart",
        this.onTouchStart.bind(this)
      );
    }

    window.removeEventListener("mousemove", this.onMouseMove.bind(this));
    window.removeEventListener("touchmove", this.onTouchMove.bind(this));
    window.removeEventListener("mouseup", this.onMouseUp.bind(this));
    window.removeEventListener("touchend", this.onTouchEnd.bind(this));

    // No need to dispose geometries or materials as they're managed by ThreeManager
    console.log("[DodgeballScene] Disposed");
  }

  /**
   * Process a mystical catch event - like catching the golden snitch!
   */
  private processMysticalCatch(
    catchingTeam: "red" | "green",
    playerIdx: number,
    ballIdx: number
  ): void {
    // Enter mystical catch phase
    this.gameState.phase = "mystical-catch";
    this.gameState.phaseStartTime = this.time;

    // Save catch info
    this.gameState.userInteraction.mysticalCatchTeam = catchingTeam;
    this.gameState.userInteraction.mysticalCatchPlayer = playerIdx;
    this.gameState.userInteraction.mysticalCatchTime = this.time;

    // Ball now controlled by this player
    this.gameState.ballState[ballIdx] = "carried";
    this.gameState.ballOwnership[ballIdx] = catchingTeam === "red" ? 0 : 1;

    // Create mystical ball glow
    this.createMysticalGlow(ballIdx);

    // Create victory glow for the catching team
    this.createVictoryGlow(catchingTeam);

    // Prepare for elimination wave effect
    this.gameState.specialEffects.eliminationWaveRadius = 0;
    this.gameState.specialEffects.eliminationWaveOpacity = 1.0;

    // Set camera to look at the catching player
    const playerPos =
      catchingTeam === "red"
        ? new THREE.Vector3(
            this.redPositions[playerIdx * 3],
            this.redPositions[playerIdx * 3 + 1],
            this.redPositions[playerIdx * 3 + 2]
          )
        : new THREE.Vector3(
            this.greenPositions[playerIdx * 3],
            this.greenPositions[playerIdx * 3 + 1],
            this.greenPositions[playerIdx * 3 + 2]
          );

    // Create elimination wave if needed
    if (!this.eliminationWave) {
      const waveGeometry = new THREE.RingGeometry(0, 1, 32);
      const waveColor = catchingTeam === "red" ? 0xff3333 : 0x33ff33;

      const waveMaterial = new THREE.MeshBasicMaterial({
        color: waveColor,
        transparent: true,
        opacity: 1.0,
        side: THREE.DoubleSide,
      });

      this.eliminationWave = new THREE.Mesh(waveGeometry, waveMaterial);
      this.eliminationWave.rotation.x = Math.PI / 2; // Flat along ground
      this.eliminationWave.position.y = -0.4;
      this.scene.add(this.eliminationWave);
    } else {
      // Update color for catching team
      const waveColor = catchingTeam === "red" ? 0xff3333 : 0x33ff33;
      (this.eliminationWave.material as THREE.MeshBasicMaterial).color.setHex(
        waveColor
      );
    }

    // Position wave at player
    this.eliminationWave.position.x = playerPos.x;
    this.eliminationWave.position.z = playerPos.z;
    this.eliminationWave.scale.set(0, 0, 0); // Start small
    this.eliminationWave.visible = true;
  }

  /**
   * Update mystical catch effects
   */
  private updateMysticalCatchEffects(_deltaTime: number): void {
    if (this.gameState.phase !== "mystical-catch") return;

    const catchingTeam = this.gameState.userInteraction.mysticalCatchTeam;
    if (!catchingTeam) return;

    const eliminationTeam = catchingTeam === "red" ? "green" : "red";
    const elapsedTime =
      this.time - this.gameState.userInteraction.mysticalCatchTime;

    // First phase (0-1.5s): Ball glow grows
    if (elapsedTime < 1.5) {
      // Grow mystical glow intensity
      this.gameState.specialEffects.mysticalGlowIntensity = Math.min(
        1.0,
        elapsedTime / 1.0
      );

      if (this.mysticalBallGlow) {
        const glowScale = 1.0 + elapsedTime * 2;
        this.mysticalBallGlow.scale.set(glowScale, glowScale, glowScale);
        (this.mysticalBallGlow.material as THREE.MeshBasicMaterial).opacity =
          0.7 * this.gameState.specialEffects.mysticalGlowIntensity;
      }
    }
    // Second phase (1.5-3.0s): Elimination wave spreads
    else if (elapsedTime < 3.0) {
      const wavePhase = (elapsedTime - 1.5) / 1.5; // 0 to 1 during wave phase

      // Grow elimination wave
      this.gameState.specialEffects.eliminationWaveRadius = 30 * wavePhase;
      this.gameState.specialEffects.eliminationWaveOpacity =
        1.0 - wavePhase * 0.3;

      if (this.eliminationWave) {
        const waveScale = this.gameState.specialEffects.eliminationWaveRadius;
        this.eliminationWave.scale.set(waveScale, waveScale, waveScale);
        (this.eliminationWave.material as THREE.MeshBasicMaterial).opacity =
          this.gameState.specialEffects.eliminationWaveOpacity;
      }

      // Victory glow fades in
      this.gameState.specialEffects.victoryGlowIntensity = wavePhase;
      if (this.victoryGlow) {
        (this.victoryGlow.material as THREE.MeshBasicMaterial).opacity =
          this.gameState.specialEffects.victoryGlowIntensity * 0.5;
      }

      // Eliminate opposing team players as the wave passes them
      const waveRadius = this.gameState.specialEffects.eliminationWaveRadius;
      const waveOrigin = this.eliminationWave?.position || new THREE.Vector3();

      if (eliminationTeam === "red") {
        for (let i = 0; i < this.particleCount.red; i++) {
          if (this.gameState.playerStatus.red[i] === "eliminated") continue;

          const playerIdx = i * 3;
          const px = this.redPositions[playerIdx];
          const pz = this.redPositions[playerIdx + 2];

          // Calculate distance to wave origin
          const distToWave = Math.sqrt(
            (px - waveOrigin.x) * (px - waveOrigin.x) +
              (pz - waveOrigin.z) * (pz - waveOrigin.z)
          );

          // If player is within wave radius but not too close to center
          if (distToWave < waveRadius && distToWave > waveRadius * 0.8) {
            // Eliminate player
            this.eliminatePlayer("red", i);
          }
        }
      } else {
        for (let i = 0; i < this.particleCount.green; i++) {
          if (this.gameState.playerStatus.green[i] === "eliminated") continue;

          const playerIdx = i * 3;
          const px = this.greenPositions[playerIdx];
          const pz = this.greenPositions[playerIdx + 2];

          // Calculate distance to wave origin
          const distToWave = Math.sqrt(
            (px - waveOrigin.x) * (px - waveOrigin.x) +
              (pz - waveOrigin.z) * (pz - waveOrigin.z)
          );

          // If player is within wave radius but not too close to center
          if (distToWave < waveRadius && distToWave > waveRadius * 0.8) {
            // Eliminate player
            this.eliminatePlayer("green", i);
          }
        }
      }
    }
    // Final phase (3.0+): Transition to victory
    else {
      // Transition to normal endgame
      this.gameState.phase = "endgame";
      this.gameState.phaseStartTime = this.time;

      // Hide special effects
      if (this.mysticalBallGlow) this.mysticalBallGlow.visible = false;
      if (this.eliminationWave) this.eliminationWave.visible = false;

      // Keep victory glow
      this.gameState.specialEffects.victoryGlowIntensity = 1.0;
    }
  }
}

export default DodgeballScene;
