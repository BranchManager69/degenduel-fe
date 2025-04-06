/** @type { import('@storybook/react-vite').StorybookConfig } */
const config = {
  stories: ['../src/**/*.mdx', '../src/**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: [
    '@storybook/addon-links',
    '@storybook/addon-essentials',
    '@storybook/addon-interactions',
    'storybook-addon-react-router-v6',
  ],
  framework: '@storybook/react-vite',
  docs: {
    autodocs: 'tag',
  },
  core: {
    builder: '@storybook/builder-vite',
  },
  // This enables Storybook to work from a subpath
  staticDirs: [{ from: '../public', to: '/' }],
  managerHead: (head) => `
    ${head}
    <script>
      // Check if we're in a subpath environment
      if (window.location.pathname.includes('/live/')) {
        // Add base tag to handle subpath correctly
        const base = document.createElement('base');
        base.href = '/live/';
        document.head.appendChild(base);
      }
    </script>
  `,
  viteFinal: async (config) => {
    // Add any custom Vite configuration here
    config.define = {
      ...config.define,
      'process.env': {
        VITE_CONTRACT_ADDRESS_REAL: JSON.stringify('0x1111111111111111111111111111111111111111'),
        VITE_CONTRACT_ADDRESS_FAKE: JSON.stringify('0x42069'),
        VITE_RELEASE_DATE_TOKEN_LAUNCH_DATETIME: JSON.stringify('2025-04-01T15:00:00-05:00'),
        VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_FULL: JSON.stringify('April 1, 2025'),
        VITE_RELEASE_DATE_DISPLAY_LAUNCH_DATE_SHORT: JSON.stringify('Apr 1, 2025'),
        VITE_RELEASE_DATE_DISPLAY_LAUNCH_TIME: JSON.stringify('15:00:00'),
        VITE_RELEASE_DATE_PRE_LAUNCH_COUNTDOWN_HOURS: JSON.stringify('6'),
        VITE_RELEASE_DATE_END_OF_LAUNCH_PARTY_FESTIVITIES_HOURS: JSON.stringify('1'),
        VITE_SUPERADMIN_SECRET: JSON.stringify('STORYBOOK_PLACEHOLDER'),
        VITE_TREASURY_WALLET: JSON.stringify('STORYBOOK_PLACEHOLDER'),
        VITE_VIRTUALS_GAME_SDK_API_KEY: JSON.stringify('STORYBOOK_PLACEHOLDER'),
        VITE_OPENAI_API_KEY: JSON.stringify('STORYBOOK_PLACEHOLDER'),
      }
    };
    
    // Server configuration - allow design.degenduel.me
    config.server = {
      ...config.server,
      host: '0.0.0.0',
      cors: true,
      hmr: false,
      // Allow requests from design.degenduel.me domain
      fs: {
        strict: true,
        allow: [process.cwd()]
      }
    };
    
    // Handle subpath in production environment
    if (process.env.NODE_ENV === 'production') {
      // Set the base and public paths for production deployment behind a /live/ subpath
      config.base = '/live/';
      config.build = {
        ...config.build,
        assetsDir: '',
        outDir: 'storybook-static'
      };
    }
    
    return config;
  },
};
export default config;
