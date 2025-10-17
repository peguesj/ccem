import React from 'react';
import { render } from 'ink-testing-library';
import { StatusMessage } from '../../src/tui/components/StatusMessage.js';

describe('StatusMessage', () => {
  it('renders info message', () => {
    const { lastFrame } = render(
      <StatusMessage type="info" message="Information message" />
    );

    expect(lastFrame()).toContain('Information message');
  });

  it('renders success message', () => {
    const { lastFrame } = render(
      <StatusMessage type="success" message="Success message" />
    );

    expect(lastFrame()).toContain('Success message');
  });

  it('renders warning message', () => {
    const { lastFrame } = render(
      <StatusMessage type="warning" message="Warning message" />
    );

    expect(lastFrame()).toContain('Warning message');
  });

  it('renders error message', () => {
    const { lastFrame } = render(
      <StatusMessage type="error" message="Error message" />
    );

    expect(lastFrame()).toContain('Error message');
  });

  it('renders details when provided', () => {
    const { lastFrame } = render(
      <StatusMessage
        type="info"
        message="Main message"
        details="Additional details"
      />
    );

    expect(lastFrame()).toContain('Main message');
    expect(lastFrame()).toContain('Additional details');
  });
});
