import * as SliderPrimitive from "@radix-ui/react-slider";
import React from "react";

interface SliderProps {
  value: number[];
  min: number;
  max: number;
  step: number;
  onValueChange: (value: number[]) => void;
  className?: string;
}

export const Slider: React.FC<SliderProps> = ({
  value,
  min,
  max,
  step,
  onValueChange,
  className = "",
}) => {
  return (
    <SliderPrimitive.Root
      className={`relative flex h-5 w-full touch-none select-none items-center ${className}`}
      value={value}
      onValueChange={onValueChange}
      max={max}
      min={min}
      step={step}
    >
      <SliderPrimitive.Track className="relative h-1 w-full grow rounded-full bg-dark-400">
        <SliderPrimitive.Range className="absolute h-full rounded-full bg-primary" />
      </SliderPrimitive.Track>
      <SliderPrimitive.Thumb className="block h-4 w-4 rounded-full bg-white shadow-lg ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50" />
    </SliderPrimitive.Root>
  );
};
