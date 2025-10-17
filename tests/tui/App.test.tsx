import React from 'react';
import { render } from 'ink-testing-library';
import { App } from '../../src/tui/App.js';

describe('App', () => {
  it('renders menu by default', () => {
    const onExit = jest.fn();
    const { lastFrame } = render(
      <App onExit={onExit} />
    );

    const frame = lastFrame();
    expect(frame).toContain('Main Menu');
    expect(frame).toContain('Configuration Manager');
    expect(frame).toContain('Merge Configurations');
  });

  it('calls onExit when exit is triggered', () => {
    const onExit = jest.fn();
    const { stdin } = render(
      <App onExit={onExit} />
    );

    // Navigate to Exit option (last item)
    for (let i = 0; i < 6; i++) {
      stdin.write('\x1B[B');
    }

    // Press Enter on Exit
    stdin.write('\r');

    expect(onExit).toHaveBeenCalled();
  });

  it('renders config manager when selected', () => {
    const onExit = jest.fn();
    const config = {
      permissions: ['Read(*)', 'Write(~/.config)'],
      mcpServers: {},
      settings: {}
    };

    const { lastFrame, stdin } = render(
      <App onExit={onExit} config={config} />
    );

    // Press Enter on first item (Configuration Manager)
    stdin.write('\r');

    const frame = lastFrame();
    expect(frame).toContain('Configuration Manager');
  });

  it('accepts initial view prop', () => {
    const onExit = jest.fn();
    const config = {
      permissions: ['Read(*)'],
      mcpServers: {},
      settings: {}
    };

    const { lastFrame } = render(
      <App onExit={onExit} initialView="config" config={config} />
    );

    const frame = lastFrame();
    expect(frame).toContain('Configuration Manager');
  });
});
