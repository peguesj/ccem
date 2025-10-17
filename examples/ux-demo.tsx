/**
 * UX Components Demo
 *
 * Demonstrates all enhanced UX components with examples.
 */

import React, { useState, useEffect } from 'react';
import { render, Box, Text } from 'ink';
import {
  ProgressBar,
  Spinner,
  Steps,
  StatusBar,
  Message,
  Success,
  ErrorMessage,
  Warning,
  Info,
  Summary,
  Alert,
  List,
  Confirm,
  Select,
  Input
} from '../src/tui/components/index.js';

/**
 * Progress Demo
 */
function ProgressDemo() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(timer);
          return 100;
        }
        return prev + 10;
      });
    }, 200);

    return () => clearInterval(timer);
  }, []);

  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Progress Indicators Demo</Text>
      <Text dimColor>{'─'.repeat(50)}</Text>

      <Box marginTop={1} flexDirection="column">
        <ProgressBar
          current={progress}
          total={100}
          label="Processing files..."
          showPercentage
          showCount
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Spinner label="Loading configurations..." type="dots" />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Steps
          steps={['Discover', 'Analyze', 'Merge', 'Validate']}
          currentStep={Math.floor(progress / 33)}
          showCompleted
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <StatusBar
          message="Merging configurations..."
          type="loading"
          showSpinner
        />
      </Box>
    </Box>
  );
}

/**
 * Feedback Demo
 */
function FeedbackDemo() {
  return (
    <Box flexDirection="column" padding={1}>
      <Text bold color="cyan">Feedback Components Demo</Text>
      <Text dimColor>{'─'.repeat(50)}</Text>

      <Box marginTop={1} flexDirection="column">
        <Success
          message="Configuration merged successfully"
          details="Output: /Users/user/.claude/config.json"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <ErrorMessage
          message="Configuration file not found"
          details="Could not find config at: /Users/user/.claude/config.json"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Warning
          message="2 conflicts detected"
          details="Manual review required"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Info
          message="Found 3 configurations to merge"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Summary
          title="Merge Results"
          items={[
            { label: 'Projects analyzed', value: '3' },
            { label: 'Permissions merged', value: '15', color: 'green' },
            { label: 'Conflicts detected', value: '2', color: 'yellow' }
          ]}
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <Alert
          type="warning"
          title="Manual Review Required"
          message="2 conflicts need your attention"
        />
      </Box>

      <Box marginTop={1} flexDirection="column">
        <List
          items={[
            'Check configuration file syntax',
            'Run security audit',
            'Review merge conflicts'
          ]}
          bullet="•"
          color="cyan"
        />
      </Box>
    </Box>
  );
}

/**
 * Confirmation Demo
 */
function ConfirmDemo() {
  const [step, setStep] = useState<'confirm' | 'select' | 'input' | 'done'>('confirm');
  const [result, setResult] = useState<string>('');

  if (step === 'done') {
    return (
      <Box flexDirection="column" padding={1}>
        <Success message={`Demo completed: ${result}`} />
      </Box>
    );
  }

  if (step === 'confirm') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">Confirmation Components Demo</Text>
        <Text dimColor>{'─'.repeat(50)}</Text>
        <Box marginTop={1}>
          <Confirm
            message="Delete configuration backup?"
            onConfirm={() => {
              setResult('User confirmed deletion');
              setStep('select');
            }}
            onCancel={() => {
              setResult('User cancelled deletion');
              setStep('select');
            }}
            warning
          />
        </Box>
      </Box>
    );
  }

  if (step === 'select') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">Select Component Demo</Text>
        <Text dimColor>{'─'.repeat(50)}</Text>
        <Box marginTop={1}>
          <Select
            message="Choose merge strategy:"
            options={[
              {
                label: 'Recommended',
                value: 'recommended',
                description: 'AI-powered conflict resolution'
              },
              {
                label: 'Conservative',
                value: 'conservative',
                description: 'Preserve all unique items'
              },
              {
                label: 'Default',
                value: 'default',
                description: 'Simple union and last-write-wins'
              }
            ]}
            onSelect={(value) => {
              setResult(`Selected strategy: ${value}`);
              setStep('input');
            }}
            onCancel={() => {
              setResult('Selection cancelled');
              setStep('done');
            }}
          />
        </Box>
      </Box>
    );
  }

  if (step === 'input') {
    return (
      <Box flexDirection="column" padding={1}>
        <Text bold color="cyan">Input Component Demo</Text>
        <Text dimColor>{'─'.repeat(50)}</Text>
        <Box marginTop={1}>
          <Input
            message="Enter output path:"
            placeholder="/path/to/output"
            onSubmit={(value) => {
              setResult(`${result}, Output path: ${value}`);
              setStep('done');
            }}
            onCancel={() => {
              setResult(`${result}, Input cancelled`);
              setStep('done');
            }}
            validate={(v) => v.length > 0 ? null : 'Path is required'}
          />
        </Box>
      </Box>
    );
  }

  return null;
}

/**
 * Main demo component
 */
function Demo() {
  const [demo, setDemo] = useState<'progress' | 'feedback' | 'confirm'>('progress');

  useEffect(() => {
    const timer = setTimeout(() => {
      if (demo === 'progress') {
        setDemo('feedback');
      } else if (demo === 'feedback') {
        setDemo('confirm');
      }
    }, 5000);

    return () => clearTimeout(timer);
  }, [demo]);

  return (
    <Box flexDirection="column">
      {demo === 'progress' && <ProgressDemo />}
      {demo === 'feedback' && <FeedbackDemo />}
      {demo === 'confirm' && <ConfirmDemo />}
    </Box>
  );
}

// Run demo
render(React.createElement(Demo));
