import type { Config } from "@jest/types";

const config: Config.InitialOptions = {
  preset: "ts-jest",
  testEnvironment: "jsdom",
  setupFilesAfterEnv: ["<rootDir>/src/setupTests.ts"],
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
  },
  transformIgnorePatterns: [
    "/node_modules/(?!(@testing-library|@babel|@jest)/)",
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
        VITE_SUPERADMIN_SECRET: "test-secret",
        VITE_API_URL: "http://localhost:3000",
        // Add any other environment variables needed for tests
      },
    },
  },
};

export default config;
