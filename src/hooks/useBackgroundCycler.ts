import { useEffect } from 'react';
import { SYSTEM_SETTINGS } from '../config/config';

// Custom event for background changes
const BACKGROUND_CHANGE_EVENT = 'backgroundChange';

export function useBackgroundCycler() {
  useEffect(() => {
    const backgrounds = ['CyberGrid', 'Dodgeball', 'TokenVerse', 'MarketVerse', 'MarketBrain', 'AmbientMarketData'];
    
    const handleKeyPress = (e: KeyboardEvent) => {
      // Press Ctrl+Shift+B to cycle backgrounds
      if (e.ctrlKey && e.shiftKey && (e.key === 'b' || e.key === 'B')) {
        e.preventDefault();
        e.stopPropagation();
        
        // Find currently enabled background
        const currentIndex = backgrounds.findIndex(bg => 
          SYSTEM_SETTINGS.BACKGROUND_SCENE.SCENES.find(s => s.name === bg)?.enabled
        );
        
        // Disable all backgrounds
        SYSTEM_SETTINGS.BACKGROUND_SCENE.SCENES.forEach(scene => {
          scene.enabled = false;
        });
        
        // Enable next background
        const nextIndex = (currentIndex + 1) % backgrounds.length;
        const nextScene = SYSTEM_SETTINGS.BACKGROUND_SCENE.SCENES.find(s => s.name === backgrounds[nextIndex]);
        if (nextScene) {
          nextScene.enabled = true;
          
          // Save to localStorage for persistence
          localStorage.setItem('selectedBackground', backgrounds[nextIndex]);
          
          // Dispatch custom event to trigger re-render
          window.dispatchEvent(new CustomEvent(BACKGROUND_CHANGE_EVENT, { 
            detail: { background: backgrounds[nextIndex] } 
          }));
          
          console.log(`🎨 Switched to ${backgrounds[nextIndex]} background (Ctrl+Shift+B to cycle)`);
        }
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);
}

// Hook to listen for background changes
export function useBackgroundChangeListener(callback: () => void) {
  useEffect(() => {
    const handleChange = () => callback();
    window.addEventListener(BACKGROUND_CHANGE_EVENT, handleChange);
    return () => window.removeEventListener(BACKGROUND_CHANGE_EVENT, handleChange);
  }, [callback]);
}