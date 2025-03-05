# DegenDuel Background Scene System

## Overview

The DegenDuel Background Scene System is a multi-layered, configurable animation system that renders dynamic visual effects behind the application's UI. The system supports multiple concurrent scenes with configurable properties, allowing for rich visual experiences without compromising performance.

> **Latest Update**: All background scenes now use the ThreeManager singleton pattern for improved performance. The MarketVerse and TokenVerse components have been refactored to use this pattern, resulting in a single shared WebGL context across the entire application.

## Architecture

### Core Components

1. **ThreeManager** (`/src/utils/three/ThreeManager.ts`)
   - Singleton class that manages the WebGL context
   - Provides a shared Three.js renderer to optimize performance
   - Handles resize events and animation loops
   - Manages shared geometries, materials, and textures for memory efficiency
   - Centralizes animation timing to improve consistency

2. **BackgroundEffects** (`/src/components/animated-background/BackgroundEffects.tsx`)
   - React component that orchestrates multiple background scenes
   - Handles scene layering based on zIndex
   - Manages the mounting and unmounting of scenes

3. **Scene Implementations**
   - `DodgeballScene.ts`: Efficient 3D particle system using instanced meshes
   - `MarketVerseScene.ts`: Market data visualization
   - `TokenVerseScene.ts`: Token network visualization
   - `ParticlesEffect.tsx`: Particle-based animation with configurable parameters

4. **Configuration** (`/src/config/config.ts`)
   - Defines which scenes are active
   - Specifies per-scene parameters

### Data Flow

```
Config → BackgroundEffects → Individual Scene Components → ThreeManager → WebGL Rendering
```

## Configuration

The background system is configured in `/src/config/config.ts` using a `SCENES` array:

```typescript
export const SCENES: BackgroundSceneConfig[] = [
  {
    name: "dodgeball",  // Scene identifier
    enabled: true,      // Whether scene is active
    zIndex: 1,          // Layering order (lower = further back)
    blendMode: "normal" // CSS blend mode
  },
  // Additional scenes...
];
```

### Scene Configuration Options

| Property   | Type                | Description                                |
|------------|---------------------|--------------------------------------------|
| name       | string              | Unique identifier for the scene            |
| enabled    | boolean             | Whether the scene is rendered              |
| zIndex     | number              | Stacking order (lower = further back)      |
| blendMode  | CSSBlendMode        | CSS blend mode for layer compositing       |
| parameters | Record<string, any> | Scene-specific configuration parameters    |

## Scenes

### ParticlesEffect

A lightweight, configurable particle system ideal for ambient backgrounds.

**Configuration Parameters:**
- `particleCount`: Number of particles (default: based on performance setting)
- `speed`: Movement speed multiplier
- `size`: Particle size
- `colorScheme`: Array of colors for particles

### DodgeballScene

An optimized 3D particle system that uses instanced meshes for better performance.

**Configuration Parameters:**
- `sphereCount`: Number of spheres
- `speed`: Movement speed multiplier
- `sphereSize`: Size of spheres
- `colorScheme`: Array of colors for spheres

### TokenVerse (Legacy)

A visualization that represents tokens as floating 3D objects.

### MarketVerse (Legacy)

A visualization that represents market data as an interactive landscape.

## Performance Considerations

The system automatically adjusts based on device capabilities:

- **High Performance Mode**: All scenes enabled with maximum particle counts
- **Medium Performance Mode**: Reduced particle counts and simplified effects
- **Low Performance Mode**: Minimal scenes with very low particle counts

Performance monitoring is handled through the `useEnhancedDiagnostics` hook, which tracks frame rates and warns when performance drops below thresholds.

## Extending the System

### Adding a New Scene

1. Create a new scene component in `/src/components/animated-background/`
2. Implement the `BackgroundScene` interface:
   ```typescript
   interface BackgroundScene {
     name: string;
     mount: (container: HTMLElement) => void;
     unmount: () => void;
     update?: (time: number) => void;
   }
   ```
3. Add your scene to the configuration in `config.ts`

### Best Practices

- Use the shared `ThreeManager` for rendering
- Implement proper cleanup in the `unmount` method
- Consider using instanced meshes for particle systems
- Add performance-based configuration options
- Follow the existing pattern for scene mounting/unmounting

## Integration with UI

Background scenes are rendered behind the application UI through a stacking context established by the `BackgroundEffects` component. Each scene is positioned absolutely with appropriate z-index values.

The scenes automatically adjust to window size changes and maintain aspect ratio.

## Future Enhancements

1. **Dynamic Configuration**
   - WebSocket-based configuration updates
   - User preferences for background settings

2. **Admin Controls**
   - UI for enabling/disabling scenes
   - Real-time parameter adjustments

3. **Theme Integration**
   - Scene color schemes based on application theme
   - Contest-specific background variations

4. **Interactive Elements**
   - Click or hover interactions with background elements
   - Data-driven visual effects

## Troubleshooting

### Common Issues

1. **High CPU/GPU Usage**
   - Reduce the number of active scenes
   - Lower particle counts in configuration
   - Disable complex scenes on low-performance devices

2. **Visual Glitches**
   - Check for z-index conflicts
   - Verify blend modes are appropriate
   - Ensure ThreeManager is properly initialized

3. **Memory Leaks**
   - Verify all scenes properly unmount and dispose resources
   - Check for retained event listeners

### Debugging

Enable debug mode in the configuration to see performance metrics and scene boundaries:

```typescript
export const DEBUG = {
  BACKGROUND_SCENES: true
};
```

## API Reference

### BackgroundScene Interface

```typescript
interface BackgroundScene {
  name: string;                             // Unique identifier
  mount: (container: HTMLElement) => void;  // Setup and attach to DOM
  unmount: () => void;                      // Cleanup and detach
  update?: (time: number) => void;          // Animation frame update
}
```

### Three.js Scene Classes

Scene classes follow a common pattern:

```typescript
class ExampleScene {
  // Component ID for ThreeManager
  private readonly COMPONENT_ID = 'example-scene';
  
  // Three.js objects
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  
  constructor(container: HTMLElement) {
    // Get ThreeManager instance
    const threeManager = ThreeManager.getInstance();
    
    // Create scene with camera
    const { scene, camera } = threeManager.createScene(
      this.COMPONENT_ID,
      {
        fov: 60,
        near: 0.1,
        far: 1000,
        position: new THREE.Vector3(0, 0, 50),
        lookAt: new THREE.Vector3(0, 0, 0)
      }
    );
    
    this.scene = scene;
    this.camera = camera as THREE.PerspectiveCamera;
    
    // Setup scene contents
    this.setupScene();
    
    // Register for animation updates
    threeManager.registerScene(this.COMPONENT_ID, this.update.bind(this));
    
    // Attach to container DOM element
    threeManager.attachToContainer(this.COMPONENT_ID, container);
  }
  
  // Animation update callback
  private update(deltaTime: number): void {
    // Update scene animations
  }
  
  // Clean up resources
  public dispose(): void {
    // Unregister from ThreeManager
    ThreeManager.getInstance().removeScene(this.COMPONENT_ID);
  }
}
```

### BackgroundSceneConfig Interface

```typescript
interface BackgroundSceneConfig {
  name: string;                             // Scene identifier
  enabled: boolean;                         // Active state
  zIndex: number;                           // Layer order
  blendMode: CSSBlendMode;                  // Layer compositing mode
  parameters?: Record<string, any>;         // Scene-specific options
}
```

### ThreeManager Methods

```typescript
// Get singleton instance
ThreeManager.getInstance(): ThreeManager

// Get shared renderer
getRenderer(): THREE.WebGLRenderer

// Register a scene for animation updates
registerScene(scene: { update: (time: number) => void }): void

// Unregister a scene from animation updates
unregisterScene(scene: { update: (time: number) => void }): void
```