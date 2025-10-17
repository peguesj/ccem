import React from 'react';
import { render } from 'ink-testing-library';
import { ProgressBar } from '../../src/tui/components/ProgressBar.js';

describe('ProgressBar', () => {
  it('renders with progress value', () => {
    const { lastFrame } = render(
      <ProgressBar progress={50} />
    );

    expect(lastFrame()).toContain('50%');
  });

  it('renders with label', () => {
    const { lastFrame } = render(
      <ProgressBar progress={75} label="Processing..." />
    );

    expect(lastFrame()).toContain('Processing...');
    expect(lastFrame()).toContain('75%');
  });

  it('clamps progress to 0-100 range', () => {
    const { lastFrame: frame1 } = render(
      <ProgressBar progress={-10} />
    );
    expect(frame1()).toContain('0%');

    const { lastFrame: frame2 } = render(
      <ProgressBar progress={150} />
    );
    expect(frame2()).toContain('100%');
  });

  it('hides percentage when showPercentage is false', () => {
    const { lastFrame } = render(
      <ProgressBar progress={50} showPercentage={false} />
    );

    expect(lastFrame()).not.toContain('%');
  });
});
