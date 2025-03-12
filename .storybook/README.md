# DegenDuel Storybook

This directory contains the Storybook configuration for the DegenDuel UI components.

## Getting Started

To run Storybook locally:

```bash
npm run storybook
```

This will start Storybook on port 6006. Open your browser to `http://localhost:6006` to view the component library.

## Building Storybook

To build a static version of Storybook:

```bash
npm run build-storybook
```

This will create a static build in the `storybook-static` directory.

## Writing Stories

Create stories in the same directory as your components with the naming convention `ComponentName.stories.tsx`.

Example:

```tsx
import type { Meta, StoryObj } from '@storybook/react';
import { YourComponent } from './YourComponent';

const meta: Meta<typeof YourComponent> = {
  title: 'Category/YourComponent',
  component: YourComponent,
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    // Define your component's props here
  },
};

export default meta;
type Story = StoryObj<typeof YourComponent>;

export const Default: Story = {
  args: {
    // Set default props
  },
};

export const Variant: Story = {
  args: {
    // Override props for this variant
  },
};
```

## Theme

DegenDuel Storybook uses a custom dark theme that matches the app's design language. The theme is defined in `.storybook/degenTheme.js`.

## Testing in Storybook

Storybook includes interaction testing capabilities. Use the "Interactions" addon panel to test component behaviors.

## Automated Visual Testing

The CI/CD pipeline includes visual regression testing that captures screenshots of stories and compares them against a baseline. This helps catch unintended visual changes.