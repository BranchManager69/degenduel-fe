/**
 * Node.js script to check for multiple instances of @solana/wallet-adapter-react
 * Uses CommonJS format (.cjs) to work with require()
 */

const path = require('path');
const fs = require('fs');

console.log("\n=== CHECKING FOR MULTIPLE WALLET ADAPTER INSTANCES ===\n");

// Function to get module path
function getModulePath(moduleName, basePath) {
  try {
    return require.resolve(moduleName, { paths: [basePath] });
  } catch (e) {
    return null;
  }
}

// Check paths from different entry points
const appPath = path.resolve(__dirname);
const jupiterPath = path.resolve(__dirname, 'node_modules/@jup-ag/wallet-adapter');
const jupiversePath = path.resolve(__dirname, 'node_modules/jupiverse-kit');
const reactUIPath = path.resolve(__dirname, 'node_modules/@solana/wallet-adapter-react-ui');

// Get resolved paths
const paths = {
  app: getModulePath('@solana/wallet-adapter-react', appPath),
  jupiter: getModulePath('@solana/wallet-adapter-react', jupiterPath),
  jupiverse: getModulePath('@solana/wallet-adapter-react', jupiversePath),
  reactUI: getModulePath('@solana/wallet-adapter-react', reactUIPath)
};

console.log("Module paths:");
console.log("- App:", paths.app);
console.log("- Jupiter adapter:", paths.jupiter);
console.log("- Jupiverse kit:", paths.jupiverse);
console.log("- Wallet adapter UI:", paths.reactUI);

// Check if they're the same physical file
console.log("\nPATH COMPARISON:");
console.log("App path === Jupiter path:", paths.app === paths.jupiter);
console.log("App path === Jupiverse path:", paths.app === paths.jupiverse);
console.log("App path === React UI path:", paths.app === paths.reactUI);

// Check versions
console.log("\nVERSION COMPARISON:");

function getPackageVersion(modulePath) {
  if (!modulePath) return "Not found";
  
  try {
    // For @solana packages
    if (modulePath.includes('@solana/wallet-adapter-react')) {
      const packageJsonPath = path.join(__dirname, 'node_modules/@solana/wallet-adapter-react/package.json');
      if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        return packageJson.version;
      }
    }
    
    return "Could not locate package.json";
  } catch (e) {
    return `Error: ${e.message}`;
  }
}

const versions = {
  app: getPackageVersion(paths.app),
  jupiter: getPackageVersion(paths.jupiter),
  jupiverse: getPackageVersion(paths.jupiverse),
  reactUI: getPackageVersion(paths.reactUI)
};

console.log("- App version:", versions.app);
console.log("- Jupiter adapter version:", versions.jupiter);
console.log("- Jupiverse kit version:", versions.jupiverse);
console.log("- Wallet adapter UI version:", versions.reactUI);

// Check for nested copies and version differences
console.log("\nLOOKING FOR MULTIPLE VERSIONS:");

const { execSync } = require('child_process');
try {
  const output = execSync('find ./node_modules -path "*/@solana/wallet-adapter-react/package.json" -type f', 
    { cwd: __dirname }).toString();
  
  console.log("Found wallet-adapter-react package.json files:");
  if (output) {
    const files = output.trim().split('\n');
    console.log(`Found ${files.length} files:`);
    
    files.forEach(filePath => {
      try {
        const packageJson = JSON.parse(fs.readFileSync(path.join(__dirname, filePath), 'utf8'));
        console.log(`- ${filePath}: version ${packageJson.version}`);
      } catch (e) {
        console.log(`- ${filePath}: Error reading file`);
      }
    });
  } else {
    console.log("None found");
  }
} catch (e) {
  console.log("Error searching for files:", e.message);
}

// Check for the nested UI version that might be causing issues
console.log("\nCHECKING REACT-UI NESTED DEPENDENCY:");
try {
  const nestedPath = path.join(
    __dirname, 
    'node_modules/@solana/wallet-adapter-react-ui/node_modules/@solana/wallet-adapter-react/package.json'
  );
  
  if (fs.existsSync(nestedPath)) {
    const packageJson = JSON.parse(fs.readFileSync(nestedPath, 'utf8'));
    console.log("Nested version in react-ui:", packageJson.version);
    console.log("This differs from the main app version!");
  } else {
    console.log("No nested version found (good)");
  }
} catch (e) {
  console.log("Error checking nested version:", e.message);
}

// Check npm ls output for mismatched versions
console.log("\nNPM DEPENDENCY TREE:");
try {
  const output = execSync('npm ls @solana/wallet-adapter-react', { 
    cwd: __dirname,
    stdio: ['pipe', 'pipe', 'pipe']
  }).toString();
  
  console.log(output);
} catch (e) {
  // npm ls often exits with non-zero code when showing deduped packages
  if (e.stdout) {
    console.log(e.stdout.toString());
  } else {
    console.log("Error running npm ls:", e.message);
  }
}