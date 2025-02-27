import { motion } from "framer-motion";
import React, { useState } from "react";
import { FiMaximize2, FiMinimize2, FiX } from "react-icons/fi";
import { useStore } from "../../../store/useStore";
import { Label } from "../../ui/Label";
import { Slider } from "../../ui/Slider";
import { Switch } from "../../ui/Switch";

export const UiDebugPanel: React.FC = () => {
  const { uiDebug, toggleBackground, updateBackgroundSetting } = useStore();
  const [isVisible, setIsVisible] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  const handleToggleBackground = (name: keyof typeof uiDebug.backgrounds) => {
    toggleBackground(name);
  };

  const handleUpdateSetting = (
    background: keyof typeof uiDebug.backgrounds,
    setting: string,
    value: number
  ) => {
    updateBackgroundSetting(background, setting, value);
  };

  const handleSliderChange =
    (background: keyof typeof uiDebug.backgrounds, setting: string) =>
    (values: number[]) => {
      handleUpdateSetting(background, setting, values[0]);
    };

  if (!isVisible) {
    return (
      <motion.button
        className="fixed bottom-4 right-32 bg-gray-800 text-white px-4 py-2 rounded-md shadow-lg hover:bg-gray-700 z-50"
        onClick={() => setIsVisible(true)}
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
      >
        Show UI Debug
      </motion.button>
    );
  }

  return (
    <motion.div
      className={`fixed right-4 bg-gray-900 text-white rounded-lg shadow-xl overflow-hidden z-50 ${
        isExpanded ? "top-4 bottom-4 w-[600px]" : "bottom-4 w-[400px] h-[300px]"
      }`}
      initial={{ opacity: 0, y: 50 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <div className="flex items-center justify-between p-2 bg-gray-800 border-b border-gray-700">
        <h3 className="font-semibold">UI Debug Panel</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-1 hover:bg-gray-700 rounded"
            title={isExpanded ? "Minimize" : "Maximize"}
          >
            {isExpanded ? <FiMinimize2 /> : <FiMaximize2 />}
          </button>
          <button
            onClick={() => setIsVisible(false)}
            className="p-1 hover:bg-gray-700 rounded"
            title="Close"
          >
            <FiX />
          </button>
        </div>
      </div>

      <div className="overflow-y-auto h-[calc(100%-40px)] p-4 space-y-6">
        {/* Moving Background */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white/70">Moving Background</Label>
            <Switch
              checked={uiDebug.backgrounds.movingBackground.enabled}
              onCheckedChange={() => handleToggleBackground("movingBackground")}
            />
          </div>
          {uiDebug.backgrounds.movingBackground.enabled && (
            <div className="space-y-4 pl-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Intensity</Label>
                <Slider
                  value={[uiDebug.backgrounds.movingBackground.intensity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange(
                    "movingBackground",
                    "intensity"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* TokenVerse */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white/70">TokenVerse</Label>
            <Switch
              checked={uiDebug.backgrounds.tokenVerse.enabled}
              onCheckedChange={() => handleToggleBackground("tokenVerse")}
            />
          </div>
          {uiDebug.backgrounds.tokenVerse.enabled && (
            <div className="space-y-4 pl-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Intensity</Label>
                <Slider
                  value={[uiDebug.backgrounds.tokenVerse.intensity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange("tokenVerse", "intensity")}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Star Intensity</Label>
                <Slider
                  value={[uiDebug.backgrounds.tokenVerse.starIntensity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange(
                    "tokenVerse",
                    "starIntensity"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Bloom Strength</Label>
                <Slider
                  value={[uiDebug.backgrounds.tokenVerse.bloomStrength]}
                  min={0}
                  max={3}
                  step={0.1}
                  onValueChange={handleSliderChange(
                    "tokenVerse",
                    "bloomStrength"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Particle Count</Label>
                <Slider
                  value={[uiDebug.backgrounds.tokenVerse.particleCount]}
                  min={100}
                  max={2000}
                  step={100}
                  onValueChange={handleSliderChange(
                    "tokenVerse",
                    "particleCount"
                  )}
                />
              </div>
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Update Speed</Label>
                <Slider
                  value={[uiDebug.backgrounds.tokenVerse.updateFrequency]}
                  min={0}
                  max={200}
                  step={10}
                  onValueChange={handleSliderChange(
                    "tokenVerse",
                    "updateFrequency"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* Market Brain */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white/70">Market Brain</Label>
            <Switch
              checked={uiDebug.backgrounds.marketBrain.enabled}
              onCheckedChange={() => handleToggleBackground("marketBrain")}
            />
          </div>
          {uiDebug.backgrounds.marketBrain.enabled && (
            <div className="space-y-4 pl-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Intensity</Label>
                <Slider
                  value={[uiDebug.backgrounds.marketBrain.intensity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange("marketBrain", "intensity")}
                />
              </div>
            </div>
          )}
        </div>

        {/* Ambient Market Data */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label className="text-white/70">Ambient Market Data</Label>
            <Switch
              checked={uiDebug.backgrounds.ambientMarketData.enabled}
              onCheckedChange={() =>
                handleToggleBackground("ambientMarketData")
              }
            />
          </div>
          {uiDebug.backgrounds.ambientMarketData.enabled && (
            <div className="space-y-4 pl-4 pt-2">
              <div className="space-y-2">
                <Label className="text-sm text-white/50">Intensity</Label>
                <Slider
                  value={[uiDebug.backgrounds.ambientMarketData.intensity]}
                  min={0}
                  max={100}
                  step={1}
                  onValueChange={handleSliderChange(
                    "ambientMarketData",
                    "intensity"
                  )}
                />
              </div>
            </div>
          )}
        </div>

        {/* EXPERIMENTAL ANIMATIONS SECTION */}
        <div className="pt-4 border-t border-gray-700">
          <h4 className="text-white/70 font-semibold mb-4">
            Experimental Animations
          </h4>

          {/* Gradient Waves */}
          {uiDebug.backgrounds.gradientWaves && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Gradient Waves</Label>
                <Switch
                  checked={uiDebug.backgrounds.gradientWaves.enabled}
                  onCheckedChange={() =>
                    handleToggleBackground("gradientWaves")
                  }
                />
              </div>
              {uiDebug.backgrounds.gradientWaves.enabled && (
                <div className="space-y-4 pl-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-white/50">Intensity</Label>
                    <Slider
                      value={[uiDebug.backgrounds.gradientWaves.intensity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleSliderChange(
                        "gradientWaves",
                        "intensity"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Fluid Tokens */}
          {uiDebug.backgrounds.fluidTokens && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Fluid Tokens</Label>
                <Switch
                  checked={uiDebug.backgrounds.fluidTokens.enabled}
                  onCheckedChange={() => handleToggleBackground("fluidTokens")}
                />
              </div>
              {uiDebug.backgrounds.fluidTokens.enabled && (
                <div className="space-y-4 pl-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-white/50">Intensity</Label>
                    <Slider
                      value={[uiDebug.backgrounds.fluidTokens.intensity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleSliderChange(
                        "fluidTokens",
                        "intensity"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Abstract Patterns */}
          {uiDebug.backgrounds.abstractPatterns && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Abstract Patterns</Label>
                <Switch
                  checked={uiDebug.backgrounds.abstractPatterns.enabled}
                  onCheckedChange={() =>
                    handleToggleBackground("abstractPatterns")
                  }
                />
              </div>
              {uiDebug.backgrounds.abstractPatterns.enabled && (
                <div className="space-y-4 pl-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-white/50">Intensity</Label>
                    <Slider
                      value={[uiDebug.backgrounds.abstractPatterns.intensity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleSliderChange(
                        "abstractPatterns",
                        "intensity"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Neon Grid */}
          {uiDebug.backgrounds.neonGrid && (
            <div className="space-y-4 mb-6">
              <div className="flex items-center justify-between">
                <Label className="text-white/70">Neon Grid</Label>
                <Switch
                  checked={uiDebug.backgrounds.neonGrid.enabled}
                  onCheckedChange={() => handleToggleBackground("neonGrid")}
                />
              </div>
              {uiDebug.backgrounds.neonGrid.enabled && (
                <div className="space-y-4 pl-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-sm text-white/50">Intensity</Label>
                    <Slider
                      value={[uiDebug.backgrounds.neonGrid.intensity]}
                      min={0}
                      max={100}
                      step={1}
                      onValueChange={handleSliderChange(
                        "neonGrid",
                        "intensity"
                      )}
                    />
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </motion.div>
  );
};
