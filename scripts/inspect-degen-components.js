/**
 * This script inspects the degen-components package to help understand its structure
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name correctly in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Package directory
const packageDir = path.resolve(__dirname, '../node_modules/degen-components');
const distDir = path.resolve(packageDir, 'dist');

// Check if the package exists
if (!fs.existsSync(packageDir)) {
  console.error('degen-components package directory not found!');
  process.exit(1);
}

// Read package.json
const packageJsonPath = path.resolve(packageDir, 'package.json');
if (fs.existsSync(packageJsonPath)) {
  try {
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    console.log('Package.json details:');
    console.log('- name:', packageJson.name);
    console.log('- version:', packageJson.version);
    console.log('- main:', packageJson.main);
    console.log('- module:', packageJson.module);
    console.log('- types:', packageJson.types || 'Not specified');
    console.log('- dependencies:', packageJson.dependencies ? Object.keys(packageJson.dependencies).join(', ') : 'None');
    console.log('- peerDependencies:', packageJson.peerDependencies ? Object.keys(packageJson.peerDependencies).join(', ') : 'None');
  } catch (error) {
    console.error('Error reading package.json:', error);
  }
}

// List files in dist directory
if (fs.existsSync(distDir)) {
  console.log('\nFiles in dist directory:');
  const files = fs.readdirSync(distDir);
  files.forEach(file => {
    const filePath = path.resolve(distDir, file);
    const stats = fs.statSync(filePath);
    if (stats.isDirectory()) {
      console.log(`- ${file}/ (directory)`);
      // List files in subdirectory
      const subFiles = fs.readdirSync(filePath);
      subFiles.forEach(subFile => {
        console.log(`  - ${subFile}`);
      });
    } else {
      console.log(`- ${file} (${stats.size} bytes)`);
    }
  });
} else {
  console.log('\nNo dist directory found!');
}

// Check for type definitions
const typesFile = path.resolve(distDir, 'index.d.ts');
if (fs.existsSync(typesFile)) {
  console.log('\nTypes file exists:');
  const typesContent = fs.readFileSync(typesFile, 'utf8');
  const exportLines = typesContent.split('\n').filter(line => line.startsWith('export '));
  console.log('Exported types:');
  exportLines.forEach(line => {
    console.log(`- ${line.trim()}`);
  });
}