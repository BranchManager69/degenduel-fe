export const FONT_PRESETS = {
  pixelPerfect: {
    heading: "Silkscreen",
    body: "Pixelify Sans",
    mono: "Source Code Pro",
  },
  neonLights: {
    heading: "Tilt Neon",
    body: "Quicksand",
    mono: "DM Mono",
  },
  cyberTech: {
    heading: "Chakra Petch",
    body: "Inter",
    mono: "Fira Code",
  },
} as const;

export const FONT_PRESET_NAMES = {
  pixelPerfect: "Pixel Perfect (Default Gaming)",
  neonLights: "Neon Lights (Alt Gaming)",
  cyberTech: "Cyber Tech (Sci-Fi)",
} as const;

export type FontPreset = keyof typeof FONT_PRESETS;
