import type { Meta, StoryObj } from '@storybook/react';
import SpriteAnimation from '../components/animated-guys/SpriteAnimation';
import { motion } from 'framer-motion';

const meta: Meta<typeof SpriteAnimation> = {
  title: 'Components/SpriteAnimation',
  component: SpriteAnimation,
  parameters: {
    layout: 'centered',
    backgrounds: {
      default: 'dark',
      values: [
        { name: 'dark', value: '#111827' },
        { name: 'light', value: '#F9FAFB' },
      ]
    },
  },
  tags: ['autodocs'],
  argTypes: {
    type: {
      control: 'select',
      options: ['green', 'red'],
      description: 'The sprite type to display',
    },
    width: {
      control: 'number',
      description: 'Width of the sprite in pixels',
    },
    height: {
      control: 'number',
      description: 'Height of the sprite in pixels',
    },
    fps: {
      control: 'number',
      description: 'Animation speed in frames per second',
    },
  },
};

export default meta;
type Story = StoryObj<typeof SpriteAnimation>;

// Basic sprite animations
export const GreenSprite: Story = {
  args: {
    type: 'green',
    width: 150,
    height: 150,
    fps: 10,
  },
};

export const RedSprite: Story = {
  args: {
    type: 'red',
    width: 150,
    height: 150,
    fps: 10,
  },
};

// Different animation speeds
export const SlowAnimation: Story = {
  args: {
    type: 'green',
    width: 150,
    height: 150,
    fps: 5,
  },
  name: 'Slow Animation (5 FPS)',
};

export const FastAnimation: Story = {
  args: {
    type: 'red',
    width: 150,
    height: 150,
    fps: 20,
  },
  name: 'Fast Animation (20 FPS)',
};

// Side by side comparison
export const DuelArrangement: Story = {
  render: () => (
    <div className="flex items-center justify-center gap-8">
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          x: [-3, 3, -3],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatType: "mirror" 
        }}
      >
        <SpriteAnimation
          type="green"
          width={120}
          height={120}
          fps={12}
        />
      </motion.div>
      
      <motion.div 
        className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-500 to-red-500"
        animate={{ 
          textShadow: [
            "0 0 5px rgba(167, 139, 250, 0.5)",
            "0 0 15px rgba(167, 139, 250, 0.8)",
            "0 0 5px rgba(167, 139, 250, 0.5)"
          ],
        }}
        transition={{ 
          duration: 2, 
          repeat: Infinity,
          repeatType: "reverse" 
        }}
      >
        VS
      </motion.div>
      
      <motion.div
        animate={{ 
          y: [0, -5, 0],
          x: [3, -3, 3],
        }}
        transition={{ 
          duration: 3, 
          repeat: Infinity, 
          repeatType: "mirror" 
        }}
      >
        <SpriteAnimation
          type="red"
          width={120}
          height={120}
          fps={12}
        />
      </motion.div>
    </div>
  ),
  name: 'Duel Arrangement',
  parameters: {
    docs: {
      description: {
        story: 'Displays both character sprites in a duel arrangement with animations.',
      },
    },
  },
};

// Different sizes
export const SmallSize: Story = {
  args: {
    type: 'green',
    width: 64,
    height: 64,
    fps: 10,
  },
  name: 'Small Size (64px)',
};

export const LargeSize: Story = {
  args: {
    type: 'red',
    width: 200,
    height: 200,
    fps: 10,
  },
  name: 'Large Size (200px)',
};

// Landing page preview
export const LandingPagePreview: Story = {
  render: () => (
    <div className="flex flex-col items-center justify-center gap-8 p-6 bg-gray-900 rounded-xl">
      <h1 className="text-2xl font-bold text-white mb-4">DegenDuel</h1>
      
      <motion.div 
        className="flex justify-center items-center gap-16 my-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ 
          opacity: 1, 
          y: 0,
          transition: {
            delay: 0.3,
            duration: 0.8,
          }
        }}
      >
        <div className="flex flex-col items-center">
          <motion.div 
            className="relative" 
            animate={{ y: [0, -5, 0], x: [-5, 5, -5] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "mirror" 
            }}
          >
            <SpriteAnimation
              type="green"
              width={120}
              height={120}
              fps={12}
            />
          </motion.div>
        </div>
        <motion.div
          className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 via-purple-500 to-red-500"
          animate={{ 
            textShadow: [
              "0 0 5px rgba(167, 139, 250, 0.5)",
              "0 0 20px rgba(167, 139, 250, 0.8)",
              "0 0 5px rgba(167, 139, 250, 0.5)"
            ],
            scale: [1, 1.05, 1]
          }}
          transition={{ 
            duration: 2, 
            repeat: Infinity,
            repeatType: "reverse" 
          }}
        >
          VS
        </motion.div>
        <div className="flex flex-col items-center">
          <motion.div 
            className="relative" 
            animate={{ y: [0, -5, 0], x: [5, -5, 5] }}
            transition={{ 
              duration: 3, 
              repeat: Infinity, 
              repeatType: "mirror" 
            }}
          >
            <SpriteAnimation
              type="red"
              width={120}
              height={120}
              fps={12}
            />
          </motion.div>
        </div>
      </motion.div>
      
      <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-6 px-4">
        <button className="relative overflow-hidden bg-gradient-to-r from-blue-500 to-cyan-600 text-white px-6 py-3 rounded-md">
          HOW TO PLAY
        </button>
        
        <button className="relative overflow-hidden bg-gradient-to-r from-emerald-500 to-teal-600 text-white px-6 py-3 rounded-md">
          START DUELING
        </button>
      </div>
    </div>
  ),
  name: 'Landing Page Preview',
  parameters: {
    docs: {
      description: {
        story: 'A preview of how the sprite animations look on the landing page.',
      },
    },
    layout: 'fullscreen',
  },
};