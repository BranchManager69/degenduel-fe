// Script to update the degenduel-shared path for CI
const fs = require('fs');
const packageJson = require('../../package.json');

// Save the original for reference
const originalPath = packageJson.dependencies['degenduel-shared'];

// Update the path for CI environment (will only run in GitHub Actions)
if (process.env.CI) {
  packageJson.dependencies['degenduel-shared'] = 'file:./degenduel-shared';
  fs.writeFileSync('package.json', JSON.stringify(packageJson, null, 2));
  console.log(`Updated degenduel-shared path from ${originalPath} to file:./degenduel-shared`);
}