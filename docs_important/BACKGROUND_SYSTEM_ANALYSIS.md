# DegenDuel Background System Analysis

## Component Hierarchy & Visual Stack

### 1. TokenVerse (`TokenVerse.tsx`)

The deepest 3D visualization layer representing the token ecosystem.

#### Visual Expectations

- **Primary Scene Elements**:

  - Token Nodes: Glowing icosahedrons (20-sided 3D shapes)

    - Size range: 0.5 to 4 units based on log10(marketCap) \* 0.4
    - Green glow for positive price change (0x00ff88 with 0x00aa44 emissive)
    - Red glow for negative price change (0xff4444 with 0xaa2222 emissive)
    - 90% opacity for slight transparency
    - Should rotate based on price change direction

  - Connection Lines:

    - Mint green (0x00ff88) at 20% opacity
    - Dynamic, flowing between connected nodes
    - 2-4 connections per node
    - Should bend and flow based on node movement

  - Background Stars:

    - Light blue (0x88ccff) particles
    - Size: 0.1 units
    - Quantity: Controlled by debug panel (default: several hundred)
    - Constant upward drift motion
    - Should create depth perception behind nodes

  - Lighting System:

    - Ambient base light (0x404040 at 2x intensity)
    - Directional key light (white, 2x intensity)
    - Three point lights:
      - Blue (0x0088ff) at (50, 50, 50)
      - Orange (0xff8800) at (-50, -50, -50)
      - Green (0x00ff88) at (-50, 50, -50)
    - Range: 200 units
    - Intensity: Controlled by debug panel

  - Post-Processing:
    - Bloom effect on all glowing elements
    - Strength controlled by debug panel
    - Should create soft, ethereal glow

#### Camera & Viewport

- Camera Position: z=50 (default)
- Field of View: 75 degrees
- Viewport: Full screen with black background at 90% opacity
- Should allow orbital camera movement

### 2. MarketVerse (`MarketVerse.tsx`)

Market visualization using spherical representations.

#### Visual Expectations

- **Scene Elements**:

  - Token Spheres:

    - Arranged in circular pattern
    - Radius: 200 units from center
    - Size: Based on market cap (20-50 units)
    - Color: HSL based on 24h change
      - Green hue (0.3) for positive
      - Red hue (0.0) for negative
      - Saturation based on change magnitude
    - Should rotate individually

  - Lighting:
    - Ambient light (0x404040)
    - Point light at (100, 100, 100)
    - Should create dramatic shadows

#### Camera & Scene

- Camera: z=400, y=100
- Should allow smooth orbital controls
- Background should be transparent

### 3. MarketBrain (`MarketBrain.tsx`)

Neural network-style market activity visualization.

#### Visual Expectations

- **Canvas Elements**:

  - Market Nodes:

    - Position: Dynamic based on forces
    - Connected by gradient lines
    - Should pulse with market activity

  - Connection Lines:

    - Gradient from blue (0x3B82F6) to purple (0x8B5CF6)
    - Opacity varies with connection strength
    - Should curve based on nearby particle influence
    - Animated data pulses along connections

  - Particles:

    - Price Change Particles:

      - Green/Red based on direction
      - Size: 1-3 units
      - Should follow force-based paths

    - Volume Particles:

      - Purple color
      - Larger size for volume spikes
      - Should emit from active nodes

    - Correlation Particles:
      - Blue color
      - Should flow between correlated pairs

#### Interaction

- Mouse influence on particle movement
- Radius: 200 units from cursor
- Should create dynamic flow patterns

### 4. AmbientMarketData (`AmbientMarketData.tsx`)

Floating market update notifications.

#### Visual Expectations

- **Update Cards**:

  - Size: Dynamic based on content
  - Background: Dark with 80% opacity and blur
  - Border Types:

    - Price Updates: brand-400/20 border
    - Volume Spikes: purple-400/20 border
    - Volatility: red-400/20 border
    - Milestones: cyan-400/20 border

  - Content Layout:
    - Token icon with pulse animation
    - Symbol text in gray-200
    - Update message in color based on type
    - Should float across screen smoothly

- **Animation Behavior**:
  - Entry: Fade in from edges
  - Movement: Smooth cross-screen transit
  - Exit: Fade out with rotation
  - Duration: 8 seconds per card
  - Maximum: 5 cards visible simultaneously

### 5. ParticlesEffect (`ParticlesEffect.tsx`)

Ambient particle system for atmospheric effect.

#### Visual Expectations

- **Particle System**:
  - Quantity: 1000 particles
  - Size: 0.05 units
  - Color: White with 60% opacity
  - Distribution: Random within (-5, 5) on all axes
  - Movement: Smoke-like drift pattern
  - Should reset when reaching boundaries

## Layer Interaction Rules

### Z-Index Stack (Back to Front):

1. TokenVerse (z-index: 0)

   - Full 3D scene with bloom
   - Should be visible through all other layers

2. MarketVerse (z-index: 0)

   - Shares space with TokenVerse
   - Should blend seamlessly

3. MarketBrain (z-index: 0)

   - Overlays 3D scenes
   - Should add network effect without blocking

4. ParticlesEffect

   - Integrated into Three.js scenes
   - Should provide atmospheric depth

5. AmbientMarketData
   - Floats above all backgrounds
   - Should not interfere with UI

### Transparency Handling

- Each layer should contribute to depth
- Cumulative opacity should not block lower layers
- Bloom effects should penetrate through layers

## Debug Panel Integration

### TokenVerse Controls:

- Intensity: 0-100 (affects light strength)
- Star Intensity: 0-100 (affects particle opacity)
- Bloom Strength: 0-3 (affects glow intensity)
- Particle Count: 100-2000
- Update Frequency: 0-200

### MarketBrain Controls:

- Intensity: 0-100 (affects connection visibility)
- Particle Count: Affects system density
- Energy Level: Affects movement speed

### AmbientMarketData Controls:

- Intensity: 0-100 (affects update frequency)
- Update Frequency: Controls data refresh rate

## Current Issues & Investigation Points

1. **Layer Visibility**

   - TokenVerse momentarily visible then obscured
   - Potential z-index conflicts
   - Background opacity stacking issues

2. **Performance Concerns**

   - Multiple animation loops
   - WebGL context sharing
   - Particle system optimization

3. **Visual Coherence**
   - Layer blending
   - Opacity calculations
   - Color scheme coordination

## Required Investigation Steps

1. **Layer Audit**

   - Test each component in isolation
   - Document actual render order
   - Verify opacity calculations

2. **Performance Analysis**

   - Profile animation frames
   - Monitor memory usage
   - Measure GPU utilization

3. **Visual Documentation**
   - Capture expected states
   - Document layer interactions
   - Create visual test cases
