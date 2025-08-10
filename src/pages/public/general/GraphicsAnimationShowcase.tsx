import React, { useState, useRef } from 'react';
import html2canvas from 'html2canvas';
import SpriteAnimation from '../../../components/animated-guys/SpriteAnimation';
import { TradingCompetitionsAnimation } from '../../../components/landing/features-list/animations/TradingCompetitionsAnimation';
import { RealTimeMarketDataAnimation } from '../../../components/landing/features-list/animations/RealTimeMarketDataAnimation';
import { AdvancedAnalyticsAnimation } from '../../../components/landing/features-list/animations/AdvancedAnalyticsAnimation';
import { InstantSettlementAnimation } from '../../../components/landing/features-list/animations/InstantSettlementAnimation';
import { DegenReputationAnimation } from '../../../components/landing/features-list/animations/DegenReputationAnimation';
import { DuelDripAnimation } from '../../../components/landing/features-list/animations/DuelDripAnimation';
import { ReflectionSystemAnimation } from '../../../components/landing/features-list/animations/ReflectionSystemAnimation';
import EnhancedIntroLogo from '../../../components/logo/EnhancedIntroLogo';

type AnimationSpeed = 'slow' | 'normal' | 'fast';
type BackgroundMode = 'black' | 'white' | 'gradient' | 'transparent' | 'purple' | 'blue';
type GraphicType = 'sprite-red' | 'sprite-green' | 'trading-competitions' | 'market-data' | 'analytics' | 'settlement' | 'reputation' | 'duel-drip' | 'reflection' | 'custom-upload';
type TextPosition = 'top' | 'center' | 'bottom';
type TextAnimation = 'none' | 'fade' | 'slide' | 'typewriter' | 'glow' | 'bounce';
type TextStyle = 'brand-russo' | 'brand-orbitron' | 'brand-mixed' | 'outline' | 'shadow' | 'neon' | 'gradient';

export const GraphicsAnimationShowcase: React.FC = () => {
  const captureRef = useRef<HTMLDivElement>(null);
  const [isCapturing, setIsCapturing] = useState(false);
  const [speed, setSpeed] = useState<AnimationSpeed>('normal');
  const [background, setBackground] = useState<BackgroundMode>('gradient');
  const [showControls, setShowControls] = useState(true);
  const [key, setKey] = useState(0);
  const [graphicType, setGraphicType] = useState<GraphicType>('market-data');
  const [isPaused, setIsPaused] = useState(false);
  
  // Text overlay states
  const [showText, setShowText] = useState(true);
  const [textContent, setTextContent] = useState('PORTFOLIO BATTLES');
  const [textPosition, setTextPosition] = useState<TextPosition>('center');
  const [textSize, setTextSize] = useState(68);
  const [textColor, setTextColor] = useState('#9D4EDD');
  const [textAnimation, setTextAnimation] = useState<TextAnimation>('none');
  const [textStyle, setTextStyle] = useState<TextStyle>('shadow');
  const [textStroke, setTextStroke] = useState(true);
  const [textStrokeWidth, setTextStrokeWidth] = useState(2);
  const [textStrokeColor] = useState('#000000');
  
  // Subtitle states
  const [subtitleContent, setSubtitleContent] = useState('Compete. Conquer. Collect.');
  const [subtitleSize, setSubtitleSize] = useState(26);
  const [subtitleColor, setSubtitleColor] = useState('#FFFFFF');
  const [subtitleOpacity, setSubtitleOpacity] = useState(90);
  const [subtitleStroke] = useState(true);
  
  // Logo states
  const [showLogo, setShowLogo] = useState(true);
  const [logoX, setLogoX] = useState(510);
  const [logoY, setLogoY] = useState(81);
  const [logoSize, setLogoSize] = useState(81);
  const [logoKey, setLogoKey] = useState(0);
  const [logoShadow, setLogoShadow] = useState(true);
  
  // Background effects
  const [backgroundDim, setBackgroundDim] = useState(50);
  const [backgroundBlur, setBackgroundBlur] = useState(3);
  const [backgroundScale, setBackgroundScale] = useState(100);
  
  // Custom upload state
  const [customImage, setCustomImage] = useState<string | null>(null);

  // Force restart animation
  const restartAnimation = () => {
    setKey(prev => prev + 1);
    setIsPaused(false);
  };

  // Handle image upload
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (event) => {
        setCustomImage(event.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Capture screenshot
  const captureScreenshot = async () => {
    if (!captureRef.current) return;
    
    setIsCapturing(true);
    
    // Hide controls temporarily
    const wasShowingControls = showControls;
    setShowControls(false);
    
    // Wait a moment for the UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 2, // Higher quality
        logging: false,
        useCORS: true,
        allowTaint: true
      });
      
      // Convert to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.download = `degenduel-graphic-${Date.now()}.png`;
          link.href = url;
          link.click();
          URL.revokeObjectURL(url);
        }
      });
    } catch (error) {
      console.error('Failed to capture screenshot:', error);
    } finally {
      // Restore controls if they were visible
      if (wasShowingControls) {
        setShowControls(true);
      }
      setIsCapturing(false);
    }
  };

  // Share to Twitter - optimized for Twitter image dimensions
  const shareToTwitter = async () => {
    if (!captureRef.current) return;
    
    setIsCapturing(true);
    
    // Hide controls temporarily
    const wasShowingControls = showControls;
    setShowControls(false);
    
    // Wait a moment for the UI to update
    await new Promise(resolve => setTimeout(resolve, 100));
    
    try {
      // Capture at Twitter-optimized size (1200x675 - 16:9 aspect ratio)
      const canvas = await html2canvas(captureRef.current, {
        backgroundColor: null,
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: 1200,
        height: 675,
        windowWidth: 1200,
        windowHeight: 675
      });
      
      // Resize canvas to exactly 1200x675 if needed
      const twitterCanvas = document.createElement('canvas');
      twitterCanvas.width = 1200;
      twitterCanvas.height = 675;
      const ctx = twitterCanvas.getContext('2d');
      
      if (ctx) {
        // Fill with transparent background
        ctx.clearRect(0, 0, 1200, 675);
        
        // Draw the captured image, scaling to fit Twitter dimensions
        const aspectRatio = canvas.width / canvas.height;
        const targetAspectRatio = 1200 / 675;
        
        let drawWidth = 1200;
        let drawHeight = 675;
        let drawX = 0;
        let drawY = 0;
        
        if (aspectRatio > targetAspectRatio) {
          // Image is wider, fit to height
          drawHeight = 675;
          drawWidth = 675 * aspectRatio;
          drawX = (1200 - drawWidth) / 2;
        } else {
          // Image is taller, fit to width  
          drawWidth = 1200;
          drawHeight = 1200 / aspectRatio;
          drawY = (675 - drawHeight) / 2;
        }
        
        ctx.drawImage(canvas, drawX, drawY, drawWidth, drawHeight);
        
        // Convert to blob and copy to clipboard
        twitterCanvas.toBlob(async (blob) => {
          if (blob) {
            try {
              // Copy image to clipboard
              await navigator.clipboard.write([
                new ClipboardItem({
                  'image/png': blob
                })
              ]);
              
              // Open Twitter with pre-filled text
              const tweetText = encodeURIComponent(
                `Check out our latest DegenDuel features! 🎯 #DegenDuel #Crypto #Trading #DeFi`
              );
              window.open(
                `https://twitter.com/intent/tweet?text=${tweetText}`,
                '_blank'
              );
              
              // Show success feedback
              alert('Image copied to clipboard! Paste it in the Twitter window that just opened.');
              
            } catch (clipboardError) {
              console.error('Failed to copy to clipboard:', clipboardError);
              
              // Fallback: download the Twitter-sized image
              const url = URL.createObjectURL(blob);
              const link = document.createElement('a');
              link.download = `degenduel-twitter-${Date.now()}.png`;
              link.href = url;
              link.click();
              URL.revokeObjectURL(url);
              
              // Still open Twitter
              const tweetText = encodeURIComponent(
                `Check out our latest DegenDuel features! 🎯 #DegenDuel #Crypto #Trading #DeFi`
              );
              window.open(
                `https://twitter.com/intent/tweet?text=${tweetText}`,
                '_blank'
              );
              
              alert('Image downloaded! Upload it to the Twitter window that just opened.');
            }
          }
        }, 'image/png');
      }
    } catch (error) {
      console.error('Failed to share to Twitter:', error);
    } finally {
      // Restore controls if they were visible
      if (wasShowingControls) {
        setShowControls(true);
      }
      setIsCapturing(false);
    }
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
        case ' ':
          e.preventDefault();
          setIsPaused(prev => !prev);
          break;
        case 'c':
          if (!isCapturing) {
            captureScreenshot();
          }
          break;
        case 't':
          if (!isCapturing) {
            shareToTwitter();
          }
          break;
        case '1':
          setSpeed('slow');
          break;
        case '2':
          setSpeed('normal');
          break;
        case '3':
          setSpeed('fast');
          break;
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, [isCapturing]);

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
      case 'purple':
        return 'bg-purple-900';
      case 'blue':
        return 'bg-blue-900';
      default:
        return 'bg-black';
    }
  };

  const getSpeedMultiplier = () => {
    switch (speed) {
      case 'slow':
        return 2;
      case 'normal':
        return 1;
      case 'fast':
        return 0.5;
      default:
        return 1;
    }
  };

  const getTextPositionClasses = () => {
    switch (textPosition) {
      case 'top':
        return 'top-8';
      case 'center':
        return 'top-1/2 -translate-y-1/2';
      case 'bottom':
        return 'bottom-8';
      default:
        return 'top-1/2 -translate-y-1/2';
    }
  };


  const getTextStyleClasses = () => {
    switch (textStyle) {
      case 'brand-russo':
        return 'font-bold tracking-wide';
      case 'brand-orbitron':
        return 'font-black tracking-tighter';
      case 'brand-mixed':
        return 'font-black tracking-tight';
      case 'outline':
        return 'font-black text-transparent bg-clip-text bg-gradient-to-r from-[#9D4EDD] to-[#C77DFF] [text-shadow:0_0_30px_rgba(157,78,221,0.5)]';
      case 'shadow':
        return 'font-black drop-shadow-2xl [text-shadow:2px_2px_4px_rgba(0,0,0,0.8)]';
      case 'neon':
        return 'font-black [text-shadow:0_0_10px_currentColor,0_0_20px_currentColor,0_0_30px_currentColor,0_0_40px_currentColor]';
      case 'gradient':
        return 'font-black bg-gradient-to-r from-[#9D4EDD] via-[#C77DFF] to-white text-transparent bg-clip-text';
      default:
        return 'font-black';
    }
  };

  const getTextFont = () => {
    switch (textStyle) {
      case 'brand-russo':
        return "'Russo One', sans-serif";
      case 'brand-orbitron':
      case 'brand-mixed':
        return "'Orbitron', sans-serif";
      default:
        return "'Orbitron', sans-serif";
    }
  };

  const getTextAnimationClasses = () => {
    switch (textAnimation) {
      case 'fade':
        return 'animate-fade-in';
      case 'slide':
        return 'animate-slide-in';
      case 'typewriter':
        return 'animate-typewriter';
      case 'glow':
        return 'animate-pulse';
      case 'bounce':
        return 'animate-bounce';
      default:
        return '';
    }
  };

  const renderGraphic = () => {
    const speedMultiplier = getSpeedMultiplier();
    
    switch (graphicType) {
      case 'sprite-red':
        return (
          <div className="scale-[3]">
            <SpriteAnimation 
              key={key} 
              imageType="red" 
              isPaused={isPaused}
              animationDuration={speedMultiplier}
            />
          </div>
        );
      case 'sprite-green':
        return (
          <div className="scale-[3]">
            <SpriteAnimation 
              key={key} 
              imageType="green" 
              isPaused={isPaused}
              animationDuration={speedMultiplier}
            />
          </div>
        );
      case 'trading-competitions':
        return (
          <div className="w-full max-w-4xl">
            <TradingCompetitionsAnimation key={key} />
          </div>
        );
      case 'market-data':
        return (
          <div className="w-full max-w-4xl">
            <RealTimeMarketDataAnimation key={key} />
          </div>
        );
      case 'analytics':
        return (
          <div className="w-full max-w-4xl">
            <AdvancedAnalyticsAnimation key={key} />
          </div>
        );
      case 'settlement':
        return (
          <div className="w-full max-w-4xl">
            <InstantSettlementAnimation key={key} />
          </div>
        );
      case 'reputation':
        return (
          <div className="w-full max-w-4xl">
            <DegenReputationAnimation key={key} />
          </div>
        );
      case 'duel-drip':
        return (
          <div className="w-full max-w-4xl">
            <DuelDripAnimation key={key} />
          </div>
        );
      case 'reflection':
        return (
          <div className="w-full max-w-4xl">
            <ReflectionSystemAnimation key={key} />
          </div>
        );
      case 'custom-upload':
        return customImage ? (
          <div className="w-full h-full flex items-center justify-center">
            <img 
              src={customImage} 
              alt="Custom upload" 
              className="max-w-full max-h-full object-contain"
            />
          </div>
        ) : (
          <div className="text-white text-center">
            <div className="text-6xl mb-4">📤</div>
            <div className="text-xl">No image uploaded</div>
            <div className="text-sm opacity-60 mt-2">Select an image using the controls</div>
          </div>
        );
      default:
        return null;
    }
  };

  const graphicOptions = [
    { value: 'sprite-red', label: 'Red Fighter' },
    { value: 'sprite-green', label: 'Green Fighter' },
    { value: 'trading-competitions', label: 'Trading Charts' },
    { value: 'market-data', label: 'Market Data' },
    { value: 'analytics', label: 'Analytics' },
    { value: 'settlement', label: 'Settlement' },
    { value: 'reputation', label: 'Reputation' },
    { value: 'duel-drip', label: 'Duel Drip' },
    { value: 'reflection', label: 'Reflection' },
    { value: 'custom-upload', label: '📤 Custom' }
  ];

  return (
    <div className="min-h-screen bg-black relative">
      {/* Capture Area - This is what gets screenshot */}
      <div ref={captureRef} className={`min-h-screen ${getBackgroundStyle()} relative overflow-hidden`}>
        {/* Centered Graphics Container with dim/blur and scale */}
        <div 
          className="absolute inset-0 flex items-center justify-center"
          style={{
            filter: backgroundBlur > 0 ? `blur(${backgroundBlur}px)` : undefined,
            transform: `scale(${backgroundScale / 100})`,
            transformOrigin: 'center center'
          }}
        >
          <div className="w-full max-w-7xl px-4 flex items-center justify-center">
            {renderGraphic()}
          </div>
        </div>
        
        {/* Dim overlay */}
        {backgroundDim > 0 && (
          <div 
            className="absolute inset-0 bg-black pointer-events-none"
            style={{ opacity: backgroundDim / 100 }}
          />
        )}

        {/* Text Overlay */}
        {showText && textContent && (
          <div 
            className={`absolute left-0 right-0 flex flex-col items-center px-4 z-40 ${getTextPositionClasses()}`}
          >
          <div className="flex flex-col items-center gap-0">
            {/* Main Text */}
            {textStyle === 'brand-mixed' ? (
              // Special handling for mixed style (like DEGENDUEL logo)
              <div className="flex items-center">
                <span 
                  className="font-bold tracking-wide"
                  style={{ 
                    fontSize: `${textSize}px`,
                    color: textColor,
                    fontFamily: "'Russo One', sans-serif",
                    marginRight: '-4px'
                  }}
                >
                  D
                </span>
                <span 
                  className="font-black tracking-tighter"
                  style={{ 
                    fontSize: `${textSize * 0.9}px`,
                    color: textColor,
                    fontFamily: "'Orbitron', sans-serif",
                    fontWeight: 900,
                    letterSpacing: '-0.05em'
                  }}
                >
                  {textContent.slice(1, -1)}
                </span>
                <span 
                  className="font-bold tracking-wide"
                  style={{ 
                    fontSize: `${textSize}px`,
                    color: '#FFFFFF',
                    fontFamily: "'Russo One', sans-serif",
                    marginLeft: '-4px'
                  }}
                >
                  {textContent.slice(-1)}
                </span>
              </div>
            ) : (
              <div 
                className={`text-center ${getTextStyleClasses()} ${getTextAnimationClasses()}`}
                style={{ 
                  fontSize: `${textSize}px`,
                  color: textStyle === 'gradient' || textStyle === 'outline' ? undefined : textColor,
                  fontFamily: getTextFont(),
                  fontWeight: textStyle === 'brand-orbitron' ? 900 : undefined,
                  letterSpacing: textStyle === 'brand-orbitron' ? '-0.05em' : undefined,
                  WebkitTextStroke: textStroke ? `${textStrokeWidth}px ${textStrokeColor}` : undefined
                }}
              >
                {textContent}
              </div>
            )}
            
            {/* Subtitle */}
            {subtitleContent && (
              <div 
                className="text-center font-medium max-w-2xl -mt-2"
                style={{ 
                  fontSize: `${subtitleSize}px`,
                  color: subtitleColor,
                  opacity: subtitleOpacity / 100,
                  fontFamily: "'Inter', system-ui, sans-serif",
                  lineHeight: 1.3,
                  whiteSpace: 'pre-wrap',
                  textShadow: subtitleStroke ? '0 2px 8px rgba(0,0,0,0.8), 0 1px 3px rgba(0,0,0,0.9)' : undefined
                }}
              >
                {subtitleContent}
              </div>
            )}
          </div>
        </div>
      )}

        {/* Logo Overlay - Inside capture area */}
        {showLogo && (
          <div 
            className="absolute z-30"
            style={{ 
              left: `${logoX}px`,
              top: `${logoY}px`,
              width: `${logoSize}px`,
              filter: logoShadow ? 'drop-shadow(0 4px 12px rgba(0,0,0,0.5))' : undefined
            }}
          >
            <EnhancedIntroLogo key={logoKey} mode="epic" />
          </div>
        )}
      </div>
      {/* End of Capture Area */}

      {/* Controls Panel - Outside capture area */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-gray-900/90 backdrop-blur-sm rounded-lg p-3 space-y-2 z-50 max-w-sm max-h-[90vh] overflow-y-auto">
          
          {/* Quick Tip */}
          <div className="bg-purple-600/20 border border-purple-500/30 rounded p-2 text-[10px] text-purple-200">
            💡 Tip: Press C to capture • T for Twitter • H to hide controls
          </div>
          
          {/* Graphic Type Selection */}
          <details open>
            <summary className="text-white text-xs font-semibold cursor-pointer mb-2">Graphic Type</summary>
            <div className="grid grid-cols-2 gap-2">
              {graphicOptions.map((option) => (
                <button
                  key={option.value}
                  onClick={() => {
                    setGraphicType(option.value as GraphicType);
                    restartAnimation();
                  }}
                  className={`px-3 py-1 rounded text-xs ${
                    graphicType === option.value
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
            
            {/* Custom Upload Input */}
            {graphicType === 'custom-upload' && (
              <div className="mt-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="custom-image-upload"
                />
                <label
                  htmlFor="custom-image-upload"
                  className="block w-full px-3 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs text-center rounded cursor-pointer transition-colors"
                >
                  {customImage ? '🖼️ Change Image' : '📤 Upload Image'}
                </label>
                {customImage && (
                  <button
                    onClick={() => setCustomImage(null)}
                    className="w-full mt-1 px-3 py-1 bg-gray-700 hover:bg-gray-600 text-white text-xs rounded"
                  >
                    Clear Image
                  </button>
                )}
              </div>
            )}
          </details>
          
          {/* Speed Selection */}
          <div>
            <label className="text-white text-xs font-semibold mb-2 block">Animation Speed</label>
            <div className="space-x-2">
              {(['slow', 'normal', 'fast'] as AnimationSpeed[]).map((s) => (
                <button
                  key={s}
                  onClick={() => {
                    setSpeed(s);
                    restartAnimation();
                  }}
                  className={`px-3 py-1 rounded text-sm ${
                    speed === s 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </button>
              ))}
            </div>
          </div>

          {/* Background Selection */}
          <div>
            <label className="text-white text-xs font-semibold mb-2 block">Background</label>
            <div className="grid grid-cols-3 gap-2">
              {(['black', 'white', 'gradient', 'transparent', 'purple', 'blue'] as BackgroundMode[]).map((bg) => (
                <button
                  key={bg}
                  onClick={() => setBackground(bg)}
                  className={`px-3 py-1 rounded text-xs ${
                    background === bg 
                      ? 'bg-purple-600 text-white' 
                      : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  }`}
                >
                  {bg.charAt(0).toUpperCase() + bg.slice(1)}
                </button>
              ))}
            </div>
            
            {/* Background Effects */}
            <div className="mt-2 space-y-1">
              <div className="flex items-center gap-1">
                <label className="text-white text-[10px] w-10">Scale:</label>
                <input
                  type="range"
                  min="50"
                  max="200"
                  value={backgroundScale}
                  onChange={(e) => setBackgroundScale(Number(e.target.value))}
                  className="flex-1 h-4"
                />
                <span className="text-white text-[10px] w-8">{backgroundScale}%</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-white text-[10px] w-10">Dim:</label>
                <input
                  type="range"
                  min="0"
                  max="80"
                  value={backgroundDim}
                  onChange={(e) => setBackgroundDim(Number(e.target.value))}
                  className="flex-1 h-4"
                />
                <span className="text-white text-[10px] w-8">{backgroundDim}%</span>
              </div>
              <div className="flex items-center gap-1">
                <label className="text-white text-[10px] w-10">Blur:</label>
                <input
                  type="range"
                  min="0"
                  max="20"
                  value={backgroundBlur}
                  onChange={(e) => setBackgroundBlur(Number(e.target.value))}
                  className="flex-1 h-4"
                />
                <span className="text-white text-[10px] w-8">{backgroundBlur}px</span>
              </div>
            </div>
          </div>

          {/* Logo Controls */}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-xs font-semibold">Brand Logo</label>
              <button
                onClick={() => setShowLogo(!showLogo)}
                className={`px-2 py-0.5 rounded text-xs ${
                  showLogo ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {showLogo ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {showLogo && (
              <div className="space-y-2">
                {/* Fine Position Control */}
                <div className="bg-gray-800 rounded p-2">
                  <div className="text-white text-[10px] text-center mb-1">Logo Position</div>
                  <div className="grid grid-cols-3 gap-1">
                    <div></div>
                    <button
                      onClick={() => setLogoY(Math.max(0, logoY - 10))}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                    >
                      ↑
                    </button>
                    <div></div>
                    <button
                      onClick={() => setLogoX(Math.max(0, logoX - 10))}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                    >
                      ←
                    </button>
                    <div className="text-white text-[10px] text-center">
                      {Math.round(logoX)},{Math.round(logoY)}
                    </div>
                    <button
                      onClick={() => setLogoX(logoX + 10)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                    >
                      →
                    </button>
                    <div></div>
                    <button
                      onClick={() => setLogoY(logoY + 10)}
                      className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-white rounded text-xs"
                    >
                      ↓
                    </button>
                    <div></div>
                  </div>
                  
                  {/* Precise input fields */}
                  <div className="grid grid-cols-2 gap-1 mt-2">
                    <div className="flex items-center gap-1">
                      <label className="text-white text-[9px]">X:</label>
                      <input
                        type="number"
                        value={logoX}
                        onChange={(e) => setLogoX(Number(e.target.value))}
                        className="w-full px-1 py-0.5 bg-gray-700 text-white rounded text-[10px]"
                      />
                    </div>
                    <div className="flex items-center gap-1">
                      <label className="text-white text-[9px]">Y:</label>
                      <input
                        type="number"
                        value={logoY}
                        onChange={(e) => setLogoY(Number(e.target.value))}
                        className="w-full px-1 py-0.5 bg-gray-700 text-white rounded text-[10px]"
                      />
                    </div>
                  </div>
                </div>
                
                {/* Logo Size */}
                <div className="flex items-center gap-1">
                  <label className="text-white text-[10px]">Size:</label>
                  <input
                    type="range"
                    min="50"
                    max="300"
                    value={logoSize}
                    onChange={(e) => setLogoSize(Number(e.target.value))}
                    className="flex-1 h-4"
                  />
                  <span className="text-white text-[10px] w-8">{logoSize}</span>
                </div>
                
                {/* Logo Shadow Toggle */}
                <div className="flex items-center justify-between">
                  <label className="text-white text-[10px]">Shadow:</label>
                  <button
                    onClick={() => setLogoShadow(!logoShadow)}
                    className={`px-2 py-0.5 rounded text-[10px] ${
                      logoShadow ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                    }`}
                  >
                    {logoShadow ? 'ON' : 'OFF'}
                  </button>
                </div>
                
                {/* Restart Logo Animation */}
                <button
                  onClick={() => setLogoKey(prev => prev + 1)}
                  className="w-full px-2 py-0.5 bg-blue-600 text-white rounded text-xs hover:bg-blue-700"
                >
                  Restart Logo Animation
                </button>
              </div>
            )}
          </div>

          {/* Text Overlay Controls */}
          <div className="border-t border-gray-700 pt-3">
            <div className="flex items-center justify-between mb-2">
              <label className="text-white text-xs font-semibold">Text Overlay</label>
              <button
                onClick={() => setShowText(!showText)}
                className={`px-2 py-0.5 rounded text-xs ${
                  showText ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                }`}
              >
                {showText ? 'ON' : 'OFF'}
              </button>
            </div>
            
            {showText && (
              <div className="space-y-2">
                {/* Main Text Input */}
                <input
                  type="text"
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Main text"
                  className="w-full px-2 py-1 bg-gray-800 text-white rounded text-xs"
                />

                {/* Subtitle Input - More compact */}
                <textarea
                  value={subtitleContent}
                  onChange={(e) => setSubtitleContent(e.target.value)}
                  placeholder="Subtitle (optional, multiline)"
                  className="w-full px-2 py-1 bg-gray-800 text-white rounded text-xs resize-none"
                  rows={2}
                />

                {/* Combined Size Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-white text-[10px]">Main:</label>
                    <input
                      type="range"
                      min="12"
                      max="120"
                      value={textSize}
                      onChange={(e) => setTextSize(Number(e.target.value))}
                      className="flex-1 h-4"
                    />
                    <span className="text-white text-[10px] w-6">{textSize}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-white text-[10px]">Sub:</label>
                    <input
                      type="range"
                      min="10"
                      max="40"
                      value={subtitleSize}
                      onChange={(e) => setSubtitleSize(Number(e.target.value))}
                      className="flex-1 h-4"
                    />
                    <span className="text-white text-[10px] w-5">{subtitleSize}</span>
                  </div>
                </div>

                {/* Combined Color Controls */}
                <div className="grid grid-cols-2 gap-2">
                  <div className="flex items-center gap-1">
                    <label className="text-white text-[10px]">Main:</label>
                    <input
                      type="color"
                      value={textColor}
                      onChange={(e) => setTextColor(e.target.value)}
                      className="w-8 h-5 rounded cursor-pointer"
                    />
                  </div>
                  <div className="flex items-center gap-1">
                    <label className="text-white text-[10px]">Sub:</label>
                    <input
                      type="color"
                      value={subtitleColor}
                      onChange={(e) => setSubtitleColor(e.target.value)}
                      className="w-8 h-5 rounded cursor-pointer"
                    />
                    <input
                      type="range"
                      min="0"
                      max="100"
                      value={subtitleOpacity}
                      onChange={(e) => setSubtitleOpacity(Number(e.target.value))}
                      className="flex-1 h-4"
                      title={`Opacity: ${subtitleOpacity}%`}
                    />
                  </div>
                </div>

                {/* Text Position - Compact */}
                <div className="flex items-center gap-1">
                  <label className="text-white text-[10px]">Pos:</label>
                  <div className="flex gap-1 flex-1">
                    {(['top', 'center', 'bottom'] as TextPosition[]).map((pos) => (
                      <button
                        key={pos}
                        onClick={() => setTextPosition(pos)}
                        className={`flex-1 py-0.5 rounded text-[10px] ${
                          textPosition === pos
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {pos.charAt(0).toUpperCase() + pos.slice(1)}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Style - Compact Grid */}
                <div>
                  <label className="text-white text-[10px] block mb-1">Style:</label>
                  <div className="grid grid-cols-4 gap-0.5">
                    {[
                      { value: 'brand-russo', label: 'Russo' },
                      { value: 'brand-orbitron', label: 'Orbit' },
                      { value: 'brand-mixed', label: 'Mix' },
                      { value: 'outline', label: 'Out' },
                      { value: 'shadow', label: 'Shad' },
                      { value: 'neon', label: 'Neon' },
                      { value: 'gradient', label: 'Grad' }
                    ].map((style) => (
                      <button
                        key={style.value}
                        onClick={() => setTextStyle(style.value as TextStyle)}
                        className={`px-1 py-0.5 rounded text-[10px] ${
                          textStyle === style.value
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {style.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Effects Controls */}
                <div className="border-t border-gray-600 pt-2 mt-2">
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-white text-[10px]">Text Effects</label>
                    <button
                      onClick={() => setTextStroke(!textStroke)}
                      className={`px-2 py-0.5 rounded text-[10px] ${
                        textStroke ? 'bg-purple-600 text-white' : 'bg-gray-700 text-gray-300'
                      }`}
                    >
                      {textStroke ? 'ON' : 'OFF'}
                    </button>
                  </div>
                  {textStroke && (
                    <div className="space-y-1">
                      <div className="flex items-center gap-1">
                        <label className="text-white text-[9px]">Main Stroke:</label>
                        <input
                          type="range"
                          min="0"
                          max="5"
                          step="0.5"
                          value={textStrokeWidth}
                          onChange={(e) => setTextStrokeWidth(Number(e.target.value))}
                          className="flex-1 h-3"
                        />
                        <span className="text-white text-[9px] w-4">{textStrokeWidth}</span>
                      </div>
                      <div className="text-white text-[9px] opacity-60">
                        Subtitle uses shadow for better readability
                      </div>
                    </div>
                  )}
                </div>

                {/* Animation - Optional, collapsed by default */}
                <details className="text-white">
                  <summary className="text-[10px] cursor-pointer">Animation Options</summary>
                  <div className="grid grid-cols-3 gap-0.5 mt-1">
                    {(['none', 'fade', 'slide', 'glow', 'bounce'] as TextAnimation[]).map((anim) => (
                      <button
                        key={anim}
                        onClick={() => {
                          setTextAnimation(anim);
                          setKey(prev => prev + 1);
                        }}
                        className={`px-1 py-0.5 rounded text-[10px] ${
                          textAnimation === anim
                            ? 'bg-purple-600 text-white'
                            : 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                        }`}
                      >
                        {anim.charAt(0).toUpperCase() + anim.slice(1)}
                      </button>
                    ))}
                  </div>
                </details>
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="space-y-2">
            <button
              onClick={captureScreenshot}
              disabled={isCapturing}
              className={`w-full px-4 py-2 ${isCapturing ? 'bg-gray-600' : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700'} text-white rounded text-sm font-semibold flex items-center justify-center gap-2`}
            >
              {isCapturing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Capturing...
                </>
              ) : (
                <>
                  📸 Capture Screenshot
                </>
              )}
            </button>
            <button
              onClick={shareToTwitter}
              disabled={isCapturing}
              className={`w-full px-4 py-2 ${isCapturing ? 'bg-gray-600' : 'bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700'} text-white rounded text-sm font-semibold flex items-center justify-center gap-2`}
            >
              {isCapturing ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Preparing...
                </>
              ) : (
                <>
                  🐦 Share to Twitter
                </>
              )}
            </button>
            <button
              onClick={() => setIsPaused(!isPaused)}
              className={`w-full px-4 py-2 ${isPaused ? 'bg-green-600 hover:bg-green-700' : 'bg-yellow-600 hover:bg-yellow-700'} text-white rounded text-sm`}
            >
              {isPaused ? 'Resume' : 'Pause'}
            </button>
            <button
              onClick={restartAnimation}
              className="w-full px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
            >
              Restart Animation
            </button>
            <button
              onClick={() => setShowControls(false)}
              className="w-full px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 text-sm"
            >
              Hide Controls
            </button>
          </div>
        </div>
      )}

      {/* Toggle Controls Button (when hidden) - Outside capture area */}
      {!showControls && (
        <div className="absolute top-4 left-4 flex gap-2 z-50">
          <button
            onClick={() => setShowControls(true)}
            className="px-3 py-1 bg-gray-900/70 text-white rounded text-sm hover:bg-gray-800/70"
          >
            Show Controls
          </button>
          <button
            onClick={captureScreenshot}
            disabled={isCapturing}
            className={`px-3 py-1 ${isCapturing ? 'bg-gray-600/70' : 'bg-purple-600/70 hover:bg-purple-700/70'} text-white rounded text-sm`}
          >
            {isCapturing ? '⏳' : '📸'}
          </button>
        </div>
      )}

      {/* Keyboard Shortcuts - Outside capture area */}
      {showControls && (
        <div className="absolute bottom-4 right-4 text-gray-500 text-xs">
          H: controls | C: capture | R: restart | Space: pause | 1-3: speed
        </div>
      )}
    </div>
  );
};

export default GraphicsAnimationShowcase;