import { addons } from '@storybook/manager-api';
import degenTheme from './degenTheme';

addons.setConfig({
  theme: degenTheme,
  sidebar: {
    showRoots: true,
  },
});