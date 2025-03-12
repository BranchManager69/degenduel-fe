import { create } from '@storybook/theming/create';

export default create({
  base: 'dark',
  
  // Brand
  brandTitle: 'DegenDuel UI Components',
  brandUrl: 'https://degenduel.me',
  brandTarget: '_self',
  
  // UI
  appBg: '#1a1c24',
  appContentBg: '#12141c',
  appBorderColor: '#2e3035',
  appBorderRadius: 6,
  
  // Typography
  fontBase: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  fontCode: 'monospace',
  
  // Text colors
  textColor: '#ffffff',
  textInverseColor: '#0f1116',
  
  // Toolbar default and active colors
  barTextColor: '#999999',
  barSelectedColor: '#6875f5',
  barBg: '#12141c',
  
  // Form colors
  inputBg: '#0f1116',
  inputBorder: '#2e3035',
  inputTextColor: '#ffffff',
  inputBorderRadius: 4,
});