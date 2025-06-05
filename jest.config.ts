import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
  extensionsToTreatAsEsm: ['.ts', '.tsx'],
  moduleNameMapper: {
    "^@/(.*)$": "<rootDir>/src/$1",
    "\\.(css|less|scss|sass)$": "identity-obj-proxy",
    "^hooks/(.*)$": "<rootDir>/src/hooks/$1",
  },
  transform: {
    "^.+\\.tsx?$": [
      "ts-jest",
      {
        useESM: true,
        isolatedModules: true,
      },
    ],
    "^.+\\.(js|jsx|mjs)$": ["babel-jest", { presets: [["@babel/preset-env", { "modules": "commonjs" }]] }],
  },
  transformIgnorePatterns: [
    // Nuclear option: Transform ALL node_modules to handle ES modules
    "^$"
  ],
  testRegex: "(/__tests__/.*|(\\.|/)(test|spec))\\.[jt]sx?$",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
  testPathIgnorePatterns: ["/node_modules/", "/dist/"],
  verbose: true,
  testTimeout: 10000,
  collectCoverage: true,
  collectCoverageFrom: [
    "src/services/api/*.{ts,tsx}",
    "src/services/dd-api.ts",
    "src/components/admin/**/*.{ts,tsx}",
    "src/hooks/*.ts",
    "!src/**/*.d.ts",
    "!**/*.test.{ts,tsx}",
    "!**/*.mock.{ts,tsx}"
  ],
  // Start with realistic coverage thresholds that will grow over time
  coverageThreshold: {
    "./src/services/api/admin.ts": {
      branches: 10,
      functions: 40,
      lines: 40,
      statements: 40
    },
    global: {
      branches: 5,
      functions: 5,
      lines: 5,
      statements: 5
    }
  },
  globals: {
    "import.meta": {
      env: {
        // Auth/API related
        VITE_SUPERADMIN_SECRET: "test-secret",
        VITE_API_URL: "http://localhost:3000",

        // Prelaunch settings
        VITE_PRELAUNCH_MODE: "false",
        VITE_PRELAUNCH_BYPASS_KEY: "test-bypass-key",

        // Wallet/Contract addresses
        VITE_TREASURY_WALLET: "test-treasury-wallet",
        VITE_CONTRACT_ADDRESS_REAL: "test-contract-address-real",
        VITE_CONTRACT_ADDRESS_FAKE: "test-contract-address-fake",

        // Release date configuration
        VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME: "2025-12-31T23:59:59-05:00",
        VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL: "December 31, 2025",
        VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT: "Dec 31, 2025",
        VITE_RELEASE_DATE_DISPLAY_LAUNCH_TIME: "23:59:59",
        VITE_RELEASE_DATE_PRE_LAUNCH_COUNTDOWN_HOURS: "6",
        VITE_RELEASE_DATE_END_OF_LAUNCH_PARTY_FESTIVITIES_HOURS: "1",
      },
    },
  },
};

export default config;
