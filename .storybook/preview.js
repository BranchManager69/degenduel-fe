/** @type { import('@storybook/react').Preview } */
import '../src/index.css';

const preview = {
  parameters: {
    actions: { argTypesRegex: '^on[A-Z].*' },
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/,
      },
    },
    backgrounds: {
      default: 'dark',
      values: [
        {
          name: 'dark',
          value: '#13111c',
        },
        {
          name: 'light',
          value: '#f8f8f8',
        },
      ],
    },
  },
};

export default preview;
