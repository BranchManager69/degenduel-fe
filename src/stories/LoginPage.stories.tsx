import type { Meta, StoryObj } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';
import { motion } from 'framer-motion';
import * as React from 'react';

// Import mock login options component
import { MockLoginOptions } from '../../.storybook/authComponents';

// Import Logo component
import Logo from '../components/ui/Logo';

// Define a simpler element type for the stories to avoid JSX issues
interface LoginPageTemplateProps {}

// Simplified version of LoginPage component - using our mock components
const LoginPageTemplate = (_props: LoginPageTemplateProps) => {
  return React.createElement('div', 
    { 
      className: "min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" 
    },
    [
      // Background effects
      React.createElement('div', { 
        key: 'bg1',
        className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,52,221,0.1),transparent_70%)]" 
      }),
      React.createElement('div', { 
        key: 'bg2',
        className: "absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(114,9,183,0.1),transparent_70%)]" 
      }),
      React.createElement('div', { 
        key: 'bg3',
        className: "absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[120px] rounded-full" 
      }),
      React.createElement('div', { 
        key: 'bg4',
        className: "absolute bottom-0 left-0 w-1/3 h-1/3 bg-brand-500/5 blur-[120px] rounded-full" 
      }),
      
      // Decorative lines
      React.createElement('div', { 
        key: 'lines',
        className: "absolute inset-0 overflow-hidden opacity-10" 
      }, [
        React.createElement('div', { 
          key: 'line1',
          className: "absolute top-[10%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line2',
          className: "absolute top-[90%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line3',
          className: "absolute bottom-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-200/50 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line4',
          className: "absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line5',
          className: "absolute right-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500 to-transparent" 
        })
      ]),
      
      // Content
      React.createElement(motion.div, { 
        key: 'content',
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        className: "max-w-md w-full space-y-10 z-10" 
      }, [
        // Logo
        React.createElement(motion.div, { 
          key: 'logo',
          className: "flex justify-center",
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2 
          } 
        }, [
          React.createElement(Logo, { 
            key: 'logo-component',
            size: "lg", 
            animated: true 
          })
        ]),
        
        // Login options
        React.createElement(motion.div, { 
          key: 'login-options',
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            duration: 0.7, 
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1]
          } 
        }, [
          React.createElement(MockLoginOptions, { 
            key: 'login-component',
            showLinkView: false
          })
        ]),
        
        // Note text
        React.createElement(motion.p, { 
          key: 'note',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.7, duration: 0.7 },
          className: "text-center text-sm text-gray-400 mt-4" 
        }, "New to DegenDuel? Simply connect your wallet to create an account!")
      ])
    ]
  );
};

// Link account version of the page
const LoginPageLinkTemplate = (_props: LoginPageTemplateProps) => {
  return React.createElement('div', 
    { 
      className: "min-h-screen flex flex-col items-center justify-center p-4 relative overflow-hidden" 
    },
    [
      // Background effects
      React.createElement('div', { 
        key: 'bg1',
        className: "absolute inset-0 bg-[radial-gradient(ellipse_at_top,rgba(93,52,221,0.1),transparent_70%)]" 
      }),
      React.createElement('div', { 
        key: 'bg2',
        className: "absolute inset-0 bg-[radial-gradient(ellipse_at_bottom,rgba(114,9,183,0.1),transparent_70%)]" 
      }),
      React.createElement('div', { 
        key: 'bg3',
        className: "absolute top-0 right-0 w-1/3 h-1/3 bg-purple-500/5 blur-[120px] rounded-full" 
      }),
      React.createElement('div', { 
        key: 'bg4',
        className: "absolute bottom-0 left-0 w-1/3 h-1/3 bg-brand-500/5 blur-[120px] rounded-full" 
      }),
      
      // Decorative lines
      React.createElement('div', { 
        key: 'lines',
        className: "absolute inset-0 overflow-hidden opacity-10" 
      }, [
        React.createElement('div', { 
          key: 'line1',
          className: "absolute top-[10%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-500 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line2',
          className: "absolute top-[90%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-purple-500 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line3',
          className: "absolute bottom-[40%] left-0 right-0 h-px bg-gradient-to-r from-transparent via-brand-200/50 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line4',
          className: "absolute left-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-purple-500 to-transparent" 
        }),
        React.createElement('div', { 
          key: 'line5',
          className: "absolute right-[10%] top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-brand-500 to-transparent" 
        })
      ]),
      
      // Content
      React.createElement(motion.div, { 
        key: 'content',
        initial: { opacity: 0, y: 20 },
        animate: { opacity: 1, y: 0 },
        transition: { duration: 0.6, ease: [0.22, 1, 0.36, 1] },
        className: "max-w-md w-full space-y-10 z-10" 
      }, [
        // Logo
        React.createElement(motion.div, { 
          key: 'logo',
          className: "flex justify-center",
          initial: { opacity: 0, scale: 0.8 },
          animate: { opacity: 1, scale: 1 },
          transition: { 
            duration: 0.8, 
            ease: [0.22, 1, 0.36, 1],
            delay: 0.2 
          } 
        }, [
          React.createElement(Logo, { 
            key: 'logo-component',
            size: "lg", 
            animated: true 
          })
        ]),
        
        // Login options
        React.createElement(motion.div, { 
          key: 'login-options',
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { 
            duration: 0.7, 
            delay: 0.3,
            ease: [0.22, 1, 0.36, 1]
          } 
        }, [
          React.createElement(MockLoginOptions, { 
            key: 'login-component',
            showLinkView: true
          })
        ]),
        
        // Note text
        React.createElement(motion.p, { 
          key: 'note',
          initial: { opacity: 0 },
          animate: { opacity: 1 },
          transition: { delay: 0.7, duration: 0.7 },
          className: "text-center text-sm text-gray-400 mt-4" 
        }, "Link your Privy account to enable email and social login in the future.")
      ])
    ]
  );
};

// Create a component that shows both login states side by side
const LoginComparison = (_props: LoginPageTemplateProps) => {
  return React.createElement('div', {
    className: "flex flex-wrap w-full justify-center gap-8 p-4"
  }, [
    // Login Panel
    React.createElement('div', {
      key: 'login-panel',
      className: "flex-1 max-w-md"
    }, [
      React.createElement('h2', {
        className: "text-center text-xl mb-4 text-brand-400"
      }, "Login View"),
      React.createElement('div', {
        className: "p-4 rounded-lg bg-dark-300/50"
      }, [
        React.createElement(MockLoginOptions, {
          showLinkView: false
        })
      ])
    ]),
    
    // Link Account Panel
    React.createElement('div', {
      key: 'link-panel',
      className: "flex-1 max-w-md"
    }, [
      React.createElement('h2', {
        className: "text-center text-xl mb-4 text-brand-400"
      }, "Link Account View"),
      React.createElement('div', {
        className: "p-4 rounded-lg bg-dark-300/50"
      }, [
        React.createElement(MockLoginOptions, {
          showLinkView: true
        })
      ])
    ])
  ]);
};

// Story metadata
const meta: Meta<typeof LoginPageTemplate> = {
  title: 'Pages/LoginPage',
  component: LoginPageTemplate,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => React.createElement(
      MemoryRouter, 
      null, 
      React.createElement(Story, null)
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof LoginPageTemplate>;

// Main story
export const Default: Story = {
  args: {},
};

// Mobile view story
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
  },
};

// Tablet view story
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
  },
};

// Link account view story
export const LinkAccount: Story = {
  render: () => React.createElement(LoginPageLinkTemplate, null),
};

// Side by side comparison
export const Comparison: Story = {
  render: () => React.createElement(LoginComparison, null),
  parameters: {
    layout: 'fullscreen'
  }
};