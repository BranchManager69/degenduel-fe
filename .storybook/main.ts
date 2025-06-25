import type { StorybookConfig } from "@storybook/react-vite";
import { resolve } from "path";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(js|jsx|ts|tsx|mdx)"],
  addons: [
    "@storybook/addon-links",
    "@storybook/addon-essentials",
    "@storybook/addon-onboarding",
    "@storybook/addon-interactions",
  ],
  framework: {
    name: "@storybook/react-vite",
    options: {},
  },
  docs: {
    autodocs: "tag",
  },
  viteFinal: async (config) => {
    // Add alias to mock auth modules in Storybook
    config.resolve = config.resolve || {};
    config.resolve.alias = {
      ...config.resolve.alias,
      // Mock the auth context and hooks for Storybook
      '../contexts/UnifiedAuthContext': resolve(__dirname, '../src/stories/mocks/UnifiedAuthContext.mock.ts'),
      '../../contexts/UnifiedAuthContext': resolve(__dirname, '../src/stories/mocks/UnifiedAuthContext.mock.ts'),
      '../hooks/auth/useMigratedAuth': resolve(__dirname, '../src/stories/mocks/useMigratedAuth.mock.ts'),
      '../../hooks/auth/useMigratedAuth': resolve(__dirname, '../src/stories/mocks/useMigratedAuth.mock.ts'),
    };

    return config;
  },
};

export default config; 