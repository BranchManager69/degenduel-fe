import React, { useState } from 'react';
import DoubleDLogo from '../../../components/logo/DoubleDLogo';
import DoubleDLogoClean from '../../../components/logo/DoubleDLogoClean';
import EnhancedIntroLogo from '../../../components/logo/EnhancedIntroLogo';
import EnhancedIntroLogoClean from '../../../components/logo/EnhancedIntroLogoClean';

type AnimationMode = 'standard' | 'epic' | 'extreme';
type BackgroundMode = 'black' | 'white' | 'gradient' | 'transparent' | 'green';
type LogoType = 'full' | 'dd' | 'dd-clean' | 'full-clean';

export const LogoAnimationShowcase: React.FC = () => {
  const [mode, setMode] = useState<AnimationMode>('epic');
  const [background, setBackground] = useState<BackgroundMode>('black');
  const [showControls, setShowControls] = useState(true);
  const [key, setKey] = useState(0);
  const [logoType, setLogoType] = useState<LogoType>('full');

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
          {logoType === 'full' ? (
            <EnhancedIntroLogo key={key} mode={mode} />
          ) : logoType === 'full-clean' ? (
            <EnhancedIntroLogoClean key={key} mode={mode} />
          ) : logoType === 'dd' ? (
            <DoubleDLogo key={key} mode={mode} />
          ) : (
            <DoubleDLogoClean key={key} mode={mode} />
          )}
        </div>
      </div>

      {/* Controls Panel */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-4 space-y-4 z-50">
          
          {/* Logo Type Selection */}
          <div>
            <div className="space-x-2">
              <button
                onClick={() => {
                  setLogoType('full');
                  restartAnimation();
                }}
                className={`px-3 py-1 rounded text-sm ${
                  logoType === 'full'
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Full Logo
              </button>
              <button
                onClick={() => {
                  setLogoType('dd');
                  restartAnimation();
                }}
                className={`px-3 py-1 rounded text-sm ${
                  logoType === 'dd'
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                DD Only
              </button>
              <button
                onClick={() => {
                  setLogoType('dd-clean');
                  restartAnimation();
                }}
                className={`px-3 py-1 rounded text-sm ${
                  logoType === 'dd-clean'
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                DD Clean
              </button>
              <button
                onClick={() => {
                  setLogoType('full-clean');
                  restartAnimation();
                }}
                className={`px-3 py-1 rounded text-sm ${
                  logoType === 'full-clean'
                    ? 'bg-purple-600 text-white' 
                    : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                Full Clean
              </button>
            </div>
          </div>
          
          {/* Mode Selection */}
          <div>
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