# @ccem/apm

TypeScript client SDK for the CCEM APM (Agentic Performance Monitor) server REST API.

## Install

```bash
npm install @ccem/apm
```

## Usage

```typescript
import { APMClient } from '@ccem/apm';

const apm = new APMClient({ baseUrl: 'http://localhost:3032' });

// Register an agent
await apm.agents.register({ agent_id: 'my-agent', project: 'my-project' });

// List agents
const agents = await apm.agents.list();

// Stream AG-UI events
const stream = apm.agUi.streamEvents();
for await (const event of stream) {
  console.log(event.type, event.data);
}
```

## Requirements

- Node.js 18+ (uses native `fetch`)
- ESM only

## License

MIT
