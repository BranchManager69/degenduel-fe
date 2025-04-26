# Particle Effects Mods

Source: src/components/animated-background/ParticlesEffect.tsx

## Key Parameters to Tweak

### Particle Counts (Line 32-36)

const particleCount = {
red: 800, // Red particles (sellers)
green: 800, // Green particles (buyers)
market: 200 // Special "market forces" particles
};

### Particle Appearance (Lines 80-89, 133-142, 173-182)

- Size: size: 0.7 (line 81, 134, 174)
- Opacity: opacity: 0.4 (line 88, 141, 181)
- Color: redMaterial.color.set(0xff2200) (line 91)
- Color: greenMaterial.color.set(0x00ff44) (line 144)
- Color: marketMaterial.color.set(0x44ccff) (line 184)

### Particle Movement (Lines 69-71, 122-124, 165-167)

- Red velocities: Lines 69-71
- Green velocities: Lines 122-124
- Market velocities: Lines 165-167

### Collision and Interaction (Lines 621-664)

- Collision detection radius: distance < 1.2 (line 623)
- Repulsion force: const repelForce = 0.15 (line 634)

### Visual Effects

- Battle plane: opacity: 0.05 (line 196)
- Light intensity: intensity: 0.3 (line 204, 208)
- Fade effect: opacity: isMounted ? 0.3 : 0.7 (line 852)
- Fade transition: transition: 'opacity 3s ease-out' (line 853)

### User Interaction

- Mouse pulse frequency: Math.random() > 0.07 (line 817)
- Pulse strength: strength: 0.5 + Math.random() \* 0.5 (line 828)
