import React, { useState } from 'react';
import EnhancedIntroLogo from '../../../components/logo/EnhancedIntroLogo';

type AnimationMode = 'standard' | 'epic' | 'extreme';
type BackgroundMode = 'black' | 'white' | 'gradient' | 'transparent' | 'green';

export const LogoAnimationShowcase: React.FC = () => {
  const [mode, setMode] = useState<AnimationMode>('epic');
  const [background, setBackground] = useState<BackgroundMode>('black');
  const [showControls, setShowControls] = useState(true);
  const [key, setKey] = useState(0);

  // Force restart animation
  const restartAnimation = () => {
    setKey(prev => prev + 1);
  };

  // Add keyboard shortcuts
  React.useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      switch (e.key.toLowerCase()) {
        case 'h':
          setShowControls(prev => !prev);
          break;
        case 'r':
          restartAnimation();
          break;
        case '1':
          setMode('standard');
          restartAnimation();
          break;
        case '2':
          setMode('epic');
          restartAnimation();
          break;
        case '3':
          setMode('extreme');
          restartAnimation();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  const getBackgroundStyle = () => {
    switch (background) {
      case 'black':
        return 'bg-black';
      case 'white':
        return 'bg-white';
      case 'gradient':
        return 'bg-gradient-to-br from-purple-900 via-black to-blue-900';
      case 'transparent':
        return 'bg-transparent';
      case 'green':
        return 'bg-green-500';
      default:
        return 'bg-black';
    }
  };

  return (
    <div className={`min-h-screen ${getBackgroundStyle()} relative overflow-hidden`}>
      {/* Centered Logo Container */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="w-full max-w-7xl px-4">
          <EnhancedIntroLogo key={key} mode={mode} />
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 space-y-4 z-50">
          <h3 className="text-white font-bold mb-2">Animation Controls</h3>
          
          {/* Mode Selection */}
          <div>
            <label className="text-gray-300 text-sm block mb-1">Animation Mode</label>
            <div className="space-x-2">
              {(['standard', 'epic', 'extreme'] as AnimationMode[]).map((m) => (
                <button
                  key={m}
                  onClick={() => {
                    setMode(m);
                    restartAnimation();
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    mode === m 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {m.charAt(0).toUpperCase() + m.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Background Selection */}
          <div>
            <label className="text-gray-300 text-sm block mb-1">Background</label>
            <div className="space-x-2">
              {(['black', 'white', 'gradient', 'transparent', 'green'] as BackgroundMode[]).map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBackground(bg)}
                  className={`px-3 py-1 rounded text-sm ${
                    background === bg 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {bg.charAt(0).toUpperCase() + bg.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="space-x-2">
            <button
              onClick={restartAnimation}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Restart Animation
            </button>
            <button
              onClick={() => setShowControls(false)}
              className="px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              Hide Controls
            </button>
          </div>

          {/* Recording Tips */}
          <div className="text-xs text-gray-400 mt-4">
            <p className="font-semibold mb-1">Recording Tips:</p>
            <ul className="space-y-1">
              <li>• Epic mode: ~3s entrance</li>
              <li>• Extreme mode: +glitch effects</li>
              <li>• Standard: No intro, just loops</li>
              <li>• Press H to toggle controls</li>
              <li>• Green screen for compositing</li>
            </ul>
          </div>
        </div>
      )}

      {/* Toggle Controls Button (when hidden) */}
      {!showControls && (
        <button
          onClick={() => setShowControls(true)}
          className="absolute top-4 left-4 px-3 py-1 bg-gray-900/70 text-white rounded text-sm hover:bg-gray-800/70 z-50"
        >
          Show Controls
        </button>
      )}

      {/* Keyboard Shortcuts */}
      <div className="absolute bottom-4 right-4 text-gray-500 text-xs">
        Press H to toggle controls | R to restart | 1-3 for modes
      </div>
    </div>
  );
};

export default LogoAnimationShowcase;