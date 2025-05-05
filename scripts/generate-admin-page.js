#!/usr/bin/env node
// scripts/generate-admin-page.js
// Script to generate a new admin page

import fs from 'fs';
import path from 'path';
import readline from 'readline';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-')
    .replace(/^-+/, '')
    .replace(/-+$/, '');
}

function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

function toCamelCase(text) {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, (word, index) => 
      index === 0 ? word.toLowerCase() : word.toUpperCase()
    )
    .replace(/\s+/g, '');
}

function toPascalCase(text) {
  return text
    .replace(/(?:^\w|[A-Z]|\b\w)/g, word => word.toUpperCase())
    .replace(/\s+/g, '');
}

function askQuestions() {
  return new Promise((resolve) => {
    const answers = {};
    
    rl.question('Page title: ', (title) => {
      answers.title = title;
      
      rl.question('Description: ', (description) => {
        answers.description = description;
        
        rl.question('Icon (emoji): ', (icon) => {
          answers.icon = icon || '📄';
          
          rl.question('Category (default: Admin): ', (category) => {
            answers.category = category || 'Admin';
            
            rl.question('Color (default: brand): ', (color) => {
              answers.color = color || 'brand';
              
              rl.question('Super admin only? (y/n): ', (superAdminOnly) => {
                answers.superAdminOnly = superAdminOnly.toLowerCase() === 'y';
                
                rl.question('Mark as new? (y/n): ', (isNew) => {
                  answers.isNew = isNew.toLowerCase() === 'y';
                  
                  resolve(answers);
                });
              });
            });
          });
        });
      });
    });
  });
}

async function generatePage() {
  console.log('📄 Generate Admin Page');
  console.log('----------------------');
  
  const answers = await askQuestions();
  
  // Generate values
  const slug = slugify(answers.title);
  const componentName = toPascalCase(answers.title) + 'Page';
  const pathName = `/admin/${slug}`;
  const id = toCamelCase(answers.title);
  
  // Create page file
  const pageDir = path.join(__dirname, '..', 'src', 'pages', 'admin');
  const pagePath = path.join(pageDir, `${componentName}.tsx`);
  
  // Ensure directory exists
  if (!fs.existsSync(pageDir)) {
    fs.mkdirSync(pageDir, { recursive: true });
  }
  
  // Page content
  const pageContent = `// src/pages/admin/${componentName}.tsx
import React from "react";
import BasicPage from "../../components/templates/BasicPage";

export const ${componentName}: React.FC = () => {
  return (
    <BasicPage
      title="${answers.title}"
      description="${answers.description}"
    >
      {/* Add your content here */}
    </BasicPage>
  );
};

export default ${componentName};
`;

  fs.writeFileSync(pagePath, pageContent);
  console.log(`✓ Created page at ${pagePath}`);

  // Update registry file
  const registryPath = path.join(__dirname, '..', 'src', 'config', 'adminPages.ts');
  let registry = fs.readFileSync(registryPath, 'utf8');
  
  // Find the end of the array
  const endIndex = registry.lastIndexOf('];');
  
  // Create the new page entry
  const newEntry = `
  {
    id: "${id}",
    title: "${answers.title}",
    description: "${answers.description}",
    icon: "${answers.icon}",
    path: "${pathName}",
    color: "${answers.color}",
    category: "${answers.category}",
    ${answers.isNew ? 'isNew: true,' : ''}
    ${answers.superAdminOnly ? 'superAdminOnly: true,' : ''}
  },`;
  
  // Insert the new entry
  const updatedRegistry = 
    registry.slice(0, endIndex) + 
    newEntry + 
    registry.slice(endIndex);
  
  fs.writeFileSync(registryPath, updatedRegistry);
  console.log(`✓ Updated registry at ${registryPath}`);
  
  // TODO: Update routes
  console.log(`✓ Done! Don't forget to add the route in your router configuration.`);
  
  rl.close();
}

generatePage().catch(console.error);