/**
 * VIKI Message Analysis Hook
 * Analyzes user messages and submits to VIKI for conversation insights
 */

import { HookContext } from '../../../types.js';
import { submitToServers } from '../../../utils/submit.js';

interface MessageAnalysis {
  message_id: string;
  project: string;
  user_message: string;
  detected_categories: string[];
  detected_keywords: string[];
  is_code_query: boolean;
  suggested_files: string[];
  suggested_commands: string[];
  timestamp: string;
}

const VIKI_KEYWORDS = {
  data: ['backfill', 'ingest', 'vector', 'embedding', 'conversation'],
  search: ['search', 'query', 'find', 'retrieve', 'similarity'],
  infrastructure: ['deploy', 'terraform', 'azure', 'infrastructure'],
  analytics: ['analyze', 'analytics', 'metrics', 'insights'],
  database: ['postgres', 'pgvector', 'schema', 'migration'],
  api: ['api', 'endpoint', 'fastapi', 'route', 'request'],
  testing: ['test', 'pytest', 'coverage', 'unit', 'integration'],
  debugging: ['debug', 'fix', 'bug', 'error', 'issue'],
  feature: ['implement', 'create', 'add', 'feature', 'functionality'],
};

export async function analyzeMessage(context: HookContext): Promise<MessageAnalysis> {
  const messageLower = context.userMessage.toLowerCase();
  const detectedCategories: Set<string> = new Set();
  const detectedKeywords: Set<string> = new Set();

  // Detect categories and keywords
  for (const [category, keywords] of Object.entries(VIKI_KEYWORDS)) {
    for (const keyword of keywords) {
      if (messageLower.includes(keyword)) {
        detectedCategories.add(category);
        detectedKeywords.add(keyword);
      }
    }
  }

  // Determine if it's a code-related query
  const codeIndicators = [
    'write', 'implement', 'fix', 'debug', 'create', 'code',
    'function', 'class', 'method', 'error', 'bug', 'refactor',
  ];
  const isCodeQuery = codeIndicators.some((indicator) =>
    messageLower.includes(indicator)
  );

  // Generate suggested files based on categories
  const suggestedFiles = generateSuggestedFiles(Array.from(detectedCategories));

  // Generate suggested commands
  const suggestedCommands = generateSuggestedCommands(Array.from(detectedCategories));

  return {
    message_id: `msg_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
    project: context.project,
    user_message: context.userMessage,
    detected_categories: Array.from(detectedCategories),
    detected_keywords: Array.from(detectedKeywords),
    is_code_query: isCodeQuery,
    suggested_files: suggestedFiles,
    suggested_commands: suggestedCommands,
    timestamp: new Date().toISOString(),
  };
}

function generateSuggestedFiles(categories: string[]): string[] {
  const fileMap: Record<string, string[]> = {
    data: ['src/models.py', 'src/ingestion.py', 'scripts/backfill.py'],
    search: ['src/search.py', 'src/vector_db.py', 'tests/test_search.py'],
    infrastructure: ['terraform/main.tf', 'terraform/variables.tf', 'infrastructure/'],
    analytics: ['src/analytics.py', 'scripts/analytics.py'],
    database: ['src/database.py', 'alembic/versions/', 'migrations/'],
    api: ['src/api/main.py', 'src/api/routes.py', 'tests/test_api.py'],
    testing: ['tests/', 'pytest.ini', 'jest.config.js'],
    debugging: ['logs/', 'src/', 'tests/'],
    feature: ['src/', 'docs/'],
  };

  const suggested = new Set<string>();
  for (const category of categories) {
    if (fileMap[category]) {
      fileMap[category].forEach((file) => suggested.add(file));
    }
  }

  return Array.from(suggested);
}

function generateSuggestedCommands(categories: string[]): string[] {
  const commandMap: Record<string, string[]> = {
    data: ['python scripts/backfill.py', 'python scripts/ingest.py'],
    search: ['python scripts/search.py'],
    infrastructure: ['terraform plan', 'terraform apply'],
    analytics: ['python scripts/analytics.py'],
    database: ['alembic revision --autogenerate', 'alembic upgrade head'],
    api: ['uvicorn src.api.main:app --reload'],
    testing: ['pytest tests/', 'npm test', 'jest --coverage'],
    debugging: ['pytest -vv', 'npm run dev', 'tail -f logs/app.log'],
    feature: ['git checkout -b feature/', 'npm run dev'],
  };

  const suggested = new Set<string>();
  for (const category of categories) {
    if (commandMap[category]) {
      commandMap[category].forEach((cmd) => suggested.add(cmd));
    }
  }

  return Array.from(suggested);
}

/**
 * Pre-execution hook handler
 */
export default async function handler(context: HookContext) {
  const analysis = await analyzeMessage(context);

  // Submit to VIKI
  const servers = [
    // Server config loaded from servers.json
    {
      name: 'viki',
      url: process.env.VIKI_URL || 'https://viki.yjos.lgtm.build',
      auth: {
        type: 'bearer' as const,
        tokenEnv: 'VIKI_API_TOKEN',
      },
      retry: {
        maxAttempts: 3,
        backoff: 'exponential' as const,
        initialDelayMs: 1000,
      },
      timeoutMs: 5000,
      enabled: true,
    },
  ];

  await submitToServers(servers, '/api/v1/hooks/messages/analyze', analysis);

  return { analysis };
}
