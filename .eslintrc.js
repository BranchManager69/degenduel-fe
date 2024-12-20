module.exports = {
    // Parser configuration for TypeScript and React
    parser: '@typescript-eslint/parser',
    parserOptions: {
      project: 'tsconfig.json', // Path to TypeScript configuration
      sourceType: 'module',
      ecmaVersion: 2020,
      ecmaFeatures: {
        jsx: true, // Enable JSX parsing
      },
    },
    
    // Plugins to enhance linting capabilities
    plugins: [
      '@typescript-eslint/eslint-plugin', // TypeScript-specific linting
      'react', // React-specific rules
      'react-hooks', // React hooks best practices
      'import', // Import/export management
      'prettier', // Integrate Prettier formatting
    ],
    
    // Extend recommended configurations
    extends: [
      'plugin:@typescript-eslint/recommended', // TypeScript best practices
      'plugin:react/recommended', // React best practices
      'plugin:react-hooks/recommended', // React hooks best practices
      'plugin:import/errors', // Import/export error checking
      'plugin:import/warnings',
      'plugin:import/typescript',
      'prettier', // Ensure Prettier and ESLint work together
    ],
    
    // Customized linting rules
    rules: {
      // React-specific rules
      'react/prop-types': 'off', // TypeScript handles prop types
      'react/react-in-jsx-scope': 'off', // Not needed in modern React
      
      // TypeScript-specific rules
      '@typescript-eslint/explicit-function-return-type': 'off', // Allow implicit return types
      '@typescript-eslint/explicit-module-boundary-types': 'off', // Flexible module exports
      '@typescript-eslint/no-explicit-any': 'warn', // Discourage 'any' type
      
      // Prettier integration
      'prettier/prettier': 'error', // Show Prettier errors as ESLint errors
      
      // Import organization
      'import/order': [
        'error',
        {
          'groups': [
            'builtin', // Node.js built-in modules
            'external', // Third-party modules
            'internal', // Internal modules
            ['parent', 'sibling'], // Parent and sibling modules
            'index', // Index files
          ],
          'newlines-between': 'always', // Add newlines between import groups
          'alphabetize': {
            'order': 'asc', // Alphabetical sorting
            'caseInsensitive': true
          }
        }
      ],
      
      // Additional best practices
      'no-console': 'warn', // Warn about console logs
      'max-len': ['warn', { code: 120 }], // Line length limit
    },
    
    // Additional settings
    settings: {
      react: {
        version: 'detect', // Automatically detect React version
      },
      'import/resolver': {
        typescript: {
          alwaysTryTypes: true, // Always try to resolve types
          project: './tsconfig.json', // TypeScript config path
        },
      },
    },
  };