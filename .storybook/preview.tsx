// .storybook/preview.tsx
import React from 'react';
import type { DecoratorFn } from '@storybook/react';
import { MemoryRouter } from 'react-router-dom';

export const decorators: DecoratorFn[] = [
  (Story, context) => {
    // If a story wants a custom route, it can set `parameters.route`
    // e.g. { parameters: { route: '/tokens?symbol=BTC' } }
    const initialEntries = context.parameters.route
      ? [context.parameters.route]
      : ['/'];

    return (
      <MemoryRouter initialEntries={initialEntries}>
        <Story />
      </MemoryRouter>
    );
  },
];