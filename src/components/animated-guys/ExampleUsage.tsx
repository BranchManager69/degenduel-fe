import React, { useState } from 'react';
import SpriteAnimation from './SpriteAnimation';

const ExampleUsage: React.FC = () => {
  const [fps, setFps] = useState(10);
  
  const handleSpeedChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFps(Number(e.target.value));
  };

  return (
    <div className="flex flex-col items-center gap-8 p-8">
      <h1 className="text-2xl font-bold mb-4">Animated Degen Characters</h1>
      
      <div className="flex gap-16 items-center justify-center">
        <div className="flex flex-col items-center">
          <SpriteAnimation 
            type="green" 
            width={150} 
            height={150} 
            fps={fps}
          />
          <p className="mt-4 font-semibold">Green Degen</p>
        </div>
        
        <div className="text-4xl font-bold">VS</div>
        
        <div className="flex flex-col items-center" style={{ transform: 'scaleX(-1)' }}>
          <SpriteAnimation 
            type="red" 
            width={150} 
            height={150} 
            fps={fps}
          />
          <p className="mt-4 font-semibold">Red Degen</p>
        </div>
      </div>
      
      <div className="mt-8 p-4 border rounded-lg bg-gray-50 dark:bg-gray-800 w-full max-w-lg">
        <h2 className="text-xl font-semibold mb-4">Animation Controls</h2>
        
        <div className="mb-4">
          <label className="block mb-2">Animation Speed: {fps} FPS</label>
          <input 
            type="range" 
            min="1" 
            max="24" 
            value={fps} 
            onChange={handleSpeedChange}
            className="w-full"
          />
        </div>
        
        <div className="grid grid-cols-2 gap-4 mt-6">
          <div className="flex flex-col items-center border p-3 rounded">
            <SpriteAnimation type="green" width={100} height={100} fps={fps} />
            <p className="mt-2 text-sm">Green Character</p>
          </div>
          
          <div className="flex flex-col items-center border p-3 rounded">
            <SpriteAnimation type="red" width={100} height={100} fps={fps} />
            <p className="mt-2 text-sm">Red Character</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExampleUsage;