/**
 * Fork Discovery System Demo
 *
 * Demonstrates the capabilities of CCEM's fork discovery system.
 */

import {
  parseConversation,
  identifyForkPoints,
  clusterByTopic,
  detectWorktrees,
  analyzeWorktreeStructure,
  extractByTopic,
  mapConversationToCode,
  generateTraceabilityReport,
  type Conversation
} from '../src/fork';

// Example conversation
const exampleConversation: Conversation = {
  messages: [
    {
      role: 'user',
      content: 'Create a TUI menu system with React and Ink',
      timestamp: '2025-10-17T00:00:00Z'
    },
    {
      role: 'assistant',
      content: 'I will create Menu.tsx with keyboard navigation support',
      timestamp: '2025-10-17T00:01:00Z'
    },
    {
      role: 'user',
      content: 'Add comprehensive tests for the menu',
      timestamp: '2025-10-17T00:05:00Z'
    },
    {
      role: 'assistant',
      content: 'Creating tests/Menu.test.tsx with ink-testing-library',
      timestamp: '2025-10-17T00:06:00Z'
    },
    {
      role: 'user',
      content: 'TRAINING: Create schema validation examples',
      timestamp: '2025-10-17T00:10:00Z'
    },
    {
      role: 'assistant',
      content: 'Generating training-data/schema-examples.json',
      timestamp: '2025-10-17T00:11:00Z'
    }
  ],
  files: ['Menu.tsx', 'tests/Menu.test.tsx', 'training-data/schema-examples.json'],
  timestamp: '2025-10-17T00:00:00Z'
};

async function demonstrateForkDiscovery() {
  console.log('=== CCEM Fork Discovery System Demo ===\n');

  // 1. Parse Conversation
  console.log('1. Parsing Conversation...');
  const parsed = parseConversation(exampleConversation);
  console.log(`   Messages: ${parsed.messageCount}`);
  console.log(`   Files: ${parsed.fileReferences.length}`);
  console.log(`   Duration: ${parsed.duration ? parsed.duration / 1000 : 0}s\n`);

  // 2. Identify Fork Points
  console.log('2. Identifying Fork Points...');
  const forkPoints = identifyForkPoints(exampleConversation);
  forkPoints.forEach((fp, idx) => {
    console.log(`   Fork ${idx + 1}: ${fp.type} (score: ${fp.score})`);
    console.log(`      Context: ${fp.context.join(', ')}`);
    console.log(`      Files: ${fp.files.length}`);
  });
  console.log();

  // 3. Cluster by Topic
  console.log('3. Clustering Messages by Topic...');
  const clusters = clusterByTopic(exampleConversation);
  clusters.forEach(cluster => {
    console.log(`   Topic: ${cluster.topic}`);
    console.log(`      Messages: ${cluster.messages.length}`);
    console.log(`      Files: ${cluster.relatedFiles?.length || 0}`);
  });
  console.log();

  // 4. Extract Context
  console.log('4. Extracting Context by Topic...');
  const menuContext = extractByTopic(exampleConversation, 'menu');
  console.log(`   Menu Context: ${menuContext.messages.length} messages`);
  console.log(`   Completeness: ${menuContext.completeness}%\n`);

  // 5. Map Conversation to Code
  console.log('5. Mapping Conversation to Code...');
  const mapping = mapConversationToCode(exampleConversation);
  console.log(`   User Requests: ${mapping.userRequests.length}`);
  console.log(`   File Mappings: ${mapping.mappings.length}`);
  mapping.mappings.forEach(m => {
    console.log(`      ${m.file} - ${m.implementationStatus}`);
  });
  console.log();

  // 6. Generate Traceability Report
  console.log('6. Generating Traceability Report...');
  const report = generateTraceabilityReport(exampleConversation);
  console.log(`   Coverage: ${report.coverage.coveragePercentage.toFixed(1)}%`);
  console.log(`   Implementation Rate: ${report.implementationStatus.implementationRate.toFixed(1)}%`);
  console.log(`   Orphans: ${report.orphans.length}`);
  console.log(`   Recommendations: ${report.recommendations.length}`);
  report.recommendations.forEach(rec => {
    console.log(`      - ${rec}`);
  });
  console.log();

  // 7. Analyze Git Worktrees
  console.log('7. Analyzing Git Worktrees...');
  try {
    const worktrees = await detectWorktrees(process.cwd());
    console.log(`   Worktrees Found: ${worktrees.length}`);
    worktrees.forEach(wt => {
      console.log(`      ${wt.branch} at ${wt.path}`);
      console.log(`         Main: ${wt.isMain}, Bare: ${wt.isBare}, Detached: ${wt.isDetached}`);
    });

    if (worktrees.length > 0) {
      const analysis = await analyzeWorktreeStructure(process.cwd());
      console.log(`   Analysis:`);
      console.log(`      Total Worktrees: ${analysis.totalWorktrees}`);
      console.log(`      Unique Branches: ${analysis.branches.length}`);
      console.log(`      Parallel Development: ${analysis.hasParallelDevelopment}`);
      console.log(`      Feature Worktrees: ${analysis.featureWorktrees}`);
    }
  } catch (error) {
    console.log('   (Git repository analysis skipped - not in git repo)');
  }

  console.log('\n=== Demo Complete ===');
}

// Run demo if executed directly
if (require.main === module) {
  demonstrateForkDiscovery().catch(console.error);
}

export { demonstrateForkDiscovery };
