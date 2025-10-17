import React from 'react';

// Mock ink components for testing
export const Box = ({ children, ...props }: any) => React.createElement('box', props, children);
export const Text = ({ children, ...props }: any) => React.createElement('text', props, children);

// Mock useInput hook
export const useInput = (handler: (input: string, key: any) => void) => {
  // Store handler for manual invocation in tests if needed
};

// Mock render function
export const render = jest.fn();
