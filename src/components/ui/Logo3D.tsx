import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import ThreeManager from '../../utils/three/ThreeManager';

interface Logo3DProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const Logo3D: React.FC<Logo3DProps> = ({ size = 'lg', className = '' }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const componentId = 'logo3d-' + Math.random().toString(36).substr(2, 9);
  
  // Convert size to pixel height
  const getHeight = () => {
    switch (size) {
      case 'sm': return 60;
      case 'md': return 100;
      case 'lg': return 140;
      case 'xl': return 200;
      default: return 140;
    }
  };

  useEffect(() => {
    if (!containerRef.current) return;
    
    const height = getHeight();
    const aspectRatio = 3; // Width is 3x height for the logo
    const width = height * aspectRatio;
    
    // Set container size
    containerRef.current.style.width = `${width}px`;
    containerRef.current.style.height = `${height}px`;
    
    // Get the manager instance
    const manager = ThreeManager.getInstance();
    
    // Create scene with camera positioned to view the logo
    const { scene } = manager.createScene(
      componentId,
      {
        fov: 50,
        near: 0.1,
        far: 2000,
        position: new THREE.Vector3(0, 0, 8),
        lookAt: new THREE.Vector3(0, 0, 0)
      },
      10 // Higher render order to appear on top
    );
    
    // Attach renderer to container
    manager.attachToContainer(componentId, containerRef.current);
    
    // Create materials
    const redMaterial = new THREE.MeshPhongMaterial({
      color: 0xff2266,
      emissive: 0x661133,
      specular: 0xffffff,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    const greenMaterial = new THREE.MeshPhongMaterial({
      color: 0x22ff66,
      emissive: 0x116633,
      specular: 0xffffff,
      shininess: 100,
      transparent: true,
      opacity: 0.9
    });
    
    const baseMaterial = new THREE.MeshPhongMaterial({
      color: 0x2266ff,
      emissive: 0x113366,
      specular: 0xffffff,
      shininess: 80,
      transparent: true,
      opacity: 0.7
    });
    
    // Create the two "D" shapes
    const d1Geometry = new THREE.TorusGeometry(1, 0.4, 16, 32, Math.PI);
    const d1Torus = new THREE.Mesh(d1Geometry, redMaterial);
    d1Torus.position.set(-1.5, 0, 0);
    d1Torus.rotation.y = Math.PI * 0.5;
    
    const d1LineGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    const d1Line = new THREE.Mesh(d1LineGeometry, redMaterial);
    d1Line.position.set(-2.3, 0, 0);
    
    // Group the first D
    const d1Group = new THREE.Group();
    d1Group.add(d1Torus);
    d1Group.add(d1Line);
    d1Group.position.set(-0.5, 0, 0);
    scene.add(d1Group);
    
    // Create second D - rotated to face first one
    const d2Geometry = new THREE.TorusGeometry(1, 0.4, 16, 32, Math.PI);
    const d2Torus = new THREE.Mesh(d2Geometry, greenMaterial);
    d2Torus.position.set(1.5, 0, 0);
    d2Torus.rotation.y = -Math.PI * 0.5;
    
    const d2LineGeometry = new THREE.BoxGeometry(0.4, 2, 0.4);
    const d2Line = new THREE.Mesh(d2LineGeometry, greenMaterial);
    d2Line.position.set(2.3, 0, 0);
    
    // Group the second D
    const d2Group = new THREE.Group();
    d2Group.add(d2Torus);
    d2Group.add(d2Line);
    d2Group.position.set(0.5, 0, 0);
    scene.add(d2Group);
    
    // Add energy beam connecting the two Ds
    const beamGeometry = new THREE.CylinderGeometry(0.1, 0.1, 3, 8);
    const beamMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.7
    });
    const beam = new THREE.Mesh(beamGeometry, beamMaterial);
    beam.rotation.z = Math.PI * 0.5;
    scene.add(beam);
    
    // Add particles for energy effect
    const particleCount = 100;
    const particleGeometry = new THREE.BufferGeometry();
    const particlePositions = new Float32Array(particleCount * 3);
    const particleSizes = new Float32Array(particleCount);
    
    for (let i = 0; i < particleCount; i++) {
      const i3 = i * 3;
      // Random position along the beam
      particlePositions[i3] = (Math.random() - 0.5) * 3;
      particlePositions[i3 + 1] = (Math.random() - 0.5) * 0.5;
      particlePositions[i3 + 2] = (Math.random() - 0.5) * 0.5;
      
      particleSizes[i] = Math.random() * 0.05 + 0.02;
    }
    
    particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
    particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
    
    const particleMaterial = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 0.1,
      transparent: true,
      blending: THREE.AdditiveBlending,
      sizeAttenuation: true
    });
    
    const particles = new THREE.Points(particleGeometry, particleMaterial);
    scene.add(particles);
    
    // Add lighting
    const ambientLight = new THREE.AmbientLight(0x333333);
    scene.add(ambientLight);
    
    const light1 = new THREE.PointLight(0xff0066, 1, 10);
    light1.position.set(-3, 2, 5);
    scene.add(light1);
    
    const light2 = new THREE.PointLight(0x00ff66, 1, 10);
    light2.position.set(3, -2, 5);
    scene.add(light2);
    
    // Stock chart candlestick effects
    const createCandlestick = (color: number, position: THREE.Vector3, height: number, wickHeight: number) => {
      const bodyHeight = height * 0.6;
      const bodyWidth = 0.3;
      
      // Body
      const bodyGeometry = new THREE.BoxGeometry(bodyWidth, bodyHeight, bodyWidth);
      const bodyMaterial = new THREE.MeshPhongMaterial({
        color: color,
        emissive: color,
        emissiveIntensity: 0.3,
        transparent: true,
        opacity: 0.9
      });
      const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
      body.position.copy(position);
      
      // Wick
      const wickGeometry = new THREE.BoxGeometry(0.05, wickHeight, 0.05);
      const wick = new THREE.Mesh(wickGeometry, bodyMaterial);
      wick.position.copy(position);
      
      const candlestick = new THREE.Group();
      candlestick.add(body);
      candlestick.add(wick);
      return candlestick;
    };
    
    // Create small candlesticks that will burst out during animation
    const candlestickGroup = new THREE.Group();
    const redCandle = createCandlestick(0xff2266, new THREE.Vector3(-0.5, -3, 0), 0.5, 1);
    const greenCandle = createCandlestick(0x22ff66, new THREE.Vector3(0.5, -3, 0), 0.5, 1);
    candlestickGroup.add(redCandle);
    candlestickGroup.add(greenCandle);
    candlestickGroup.visible = false;
    scene.add(candlestickGroup);

    // Base platform
    const baseGeometry = new THREE.BoxGeometry(6, 0.5, 2);
    const base = new THREE.Mesh(baseGeometry, baseMaterial);
    base.position.set(0, -1.5, 0);
    scene.add(base);
    
    // Animation state
    let animationTime = 0;
    let pulseTimer = 0;
    let duelMode = false;
    let duelTimer = 0;
    
    // Register animation callback - standard animation for all pages
    manager.registerAnimation(componentId, (deltaTime) => {
      animationTime += deltaTime;
      pulseTimer += deltaTime;
      
      // Rotate the Ds slightly - consistent standard animation
      const rotationAmount = 0.1;
      d1Group.rotation.y = Math.sin(animationTime * 0.7) * rotationAmount;
      d2Group.rotation.y = Math.sin(animationTime * 0.7 + Math.PI) * rotationAmount;
      
      // Standard beam pulse effect
      const pulseScale = 1 + Math.sin(pulseTimer * 5) * 0.2;
      beam.scale.set(pulseScale, 1, pulseScale);
      beamMaterial.opacity = 0.7 + Math.sin(pulseTimer * 7) * 0.3;
      
      // Update particles
      const positions = particleGeometry.attributes.position.array as Float32Array;
      for (let i = 0; i < particleCount; i++) {
        const i3 = i * 3;
        positions[i3] += (Math.random() - 0.5) * 0.1;
        
        // Reset if they go beyond bounds
        if (positions[i3] > 1.5 || positions[i3] < -1.5) {
          positions[i3] = (Math.random() - 0.5) * 3;
          positions[i3 + 1] = (Math.random() - 0.5) * 0.5;
          positions[i3 + 2] = (Math.random() - 0.5) * 0.5;
        }
      }
      particleGeometry.attributes.position.needsUpdate = true;
      
      // Randomly trigger duel mode animation - standard probability
      if (!duelMode && Math.random() < 0.003) {
        duelMode = true;
        duelTimer = 0;
        candlestickGroup.visible = true;
        
        // Reset candlestick positions
        redCandle.position.set(-1, 0, 0.5);
        greenCandle.position.set(1, 0, 0.5);
        
        // Hide the regular Ds during duel
        d1Group.visible = false;
        d2Group.visible = false;
        beam.visible = false;
      }
      
      // Handle duel animation - standard timing
      if (duelMode) {
        duelTimer += deltaTime;
        const duelDuration = 1.5;
        
        if (duelTimer < 1.0) {
          // Candlesticks approach each other
          const moveSpeed = 0.8;
          redCandle.position.x += deltaTime * moveSpeed;
          greenCandle.position.x -= deltaTime * moveSpeed;
          
          // Rotate them like swords
          const rotateSpeed = 5;
          redCandle.rotation.z += deltaTime * rotateSpeed;
          greenCandle.rotation.z -= deltaTime * rotateSpeed;
        } else if (duelTimer < duelDuration) {
          // Flash at collision point
          if (!scene.userData.clashLight) {
            const clashLight = new THREE.PointLight(0xffffff, 2, 5);
            clashLight.position.set(0, 0, 1);
            scene.add(clashLight);
            scene.userData.clashLight = clashLight;
          }
        } else {
          // End duel mode
          duelMode = false;
          candlestickGroup.visible = false;
          d1Group.visible = true;
          d2Group.visible = true;
          beam.visible = true;
          
          // Remove clash light
          if (scene.userData.clashLight) {
            scene.remove(scene.userData.clashLight);
            scene.userData.clashLight = null;
          }
        }
      }
    });
    
    // Cleanup on unmount
    return () => {
      manager.unregisterScene(componentId);
    };
  }, [componentId, size]);
  
  return (
    <div 
      ref={containerRef} 
      className={`relative mx-auto ${className}`}
      style={{ height: getHeight(), position: 'relative' }}
    >
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="text-center font-bold opacity-0">DEGEN×DUEL</div>
      </div>
    </div>
  );
};

export default Logo3D;