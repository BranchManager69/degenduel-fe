import { execSync } from "child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, resolve } from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log("🔍 Starting build analysis...\n");

// Record start time
const startTime = Date.now();

try {
  // Measure TypeScript compilation
  console.log("Running TypeScript compilation...");
  const tscStart = Date.now();
  execSync("npx tsc --noEmit", { stdio: "inherit" });
  const tscTime = Date.now() - tscStart;
  console.log(`TypeScript compilation took: ${(tscTime / 1000).toFixed(2)}s\n`);

  // Measure Vite build
  console.log("Running Vite build...");
  const viteStart = Date.now();
  execSync("npx vite build", { stdio: "inherit" });
  const viteTime = Date.now() - viteStart;
  console.log(`Vite build took: ${(viteTime / 1000).toFixed(2)}s\n`);

  // Total time
  const totalTime = Date.now() - startTime;
  console.log(`Total build time: ${(totalTime / 1000).toFixed(2)}s`);

  // Save results
  const packageJson = JSON.parse(
    readFileSync(resolve(__dirname, "../package.json"), "utf-8")
  );

  const result = {
    date: new Date().toISOString(),
    typescript: tscTime,
    vite: viteTime,
    total: totalTime,
    nodeVersion: process.version,
    dependencies: packageJson.dependencies,
    devDependencies: packageJson.devDependencies,
  };

  // Ensure build-metrics directory exists
  const metricsDir = resolve(__dirname, "../build-metrics");
  if (!existsSync(metricsDir)) {
    mkdirSync(metricsDir);
  }

  // Save metrics
  writeFileSync(
    resolve(metricsDir, `build-${Date.now()}.json`),
    JSON.stringify(result, null, 2)
  );
} catch (error) {
  console.error("\n❌ Build analysis failed:", error.message);
  process.exit(1);
}
