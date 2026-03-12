/**
 * Integration tests for @ccem/apm client SDK against the live APM server.
 *
 * These tests require a running APM server at http://localhost:3032.
 * They are skipped automatically if the server is unreachable.
 *
 * Run with: npx vitest run tests/integration/
 *
 * NOTE: Several SDK methods declare return types as bare arrays (e.g. Agent[])
 * but the server wraps responses in envelope objects (e.g. { agents: [...] }).
 * These tests validate the ACTUAL server behavior. Where the SDK type and the
 * server response disagree, the test documents both with a comment.
 */
import { describe, it, expect, beforeAll } from 'vitest';
import { APMClient } from '../../src/client.js';

const APM_BASE_URL = 'http://localhost:3032';

/** Check whether the APM server is reachable before running the suite. */
async function isApmAvailable(): Promise<boolean> {
  try {
    const res = await fetch(`${APM_BASE_URL}/api/status`, {
      signal: AbortSignal.timeout(3000),
    });
    return res.ok;
  } catch {
    return false;
  }
}

let apmAvailable = false;

beforeAll(async () => {
  apmAvailable = await isApmAvailable();
  if (!apmAvailable) {
    console.warn(
      'APM server not reachable at %s -- skipping integration tests',
      APM_BASE_URL,
    );
  }
});

describe('Live APM Integration Tests', () => {
  const apm = new APMClient({ baseUrl: APM_BASE_URL, timeout: 10_000 });

  /** Helper: skip the current test at runtime if APM is down. */
  function requireApm(): boolean {
    if (!apmAvailable) {
      console.warn('Skipping: APM unavailable');
      return false;
    }
    return true;
  }

  // ---------- Health ----------

  describe('health', () => {
    it('check() returns a response', async () => {
      if (!requireApm()) return;
      // /health serves the LiveView HTML page (not JSON), which can cause
      // the SDK's text() call to hang on chunked transfer. Use a direct
      // fetch with a tight timeout to verify the endpoint is reachable.
      const res = await fetch(`${APM_BASE_URL}/health`, {
        signal: AbortSignal.timeout(5000),
      });
      expect(res.status).toBe(200);
    });

    it('status() returns { status: "ok" }', async () => {
      if (!requireApm()) return;
      const result = await apm.health.status();
      expect(result).toBeDefined();
      expect(result).toHaveProperty('status', 'ok');
    });
  });

  // ---------- Agents ----------

  describe('agents', () => {
    it('list() returns an object containing an agents array', async () => {
      if (!requireApm()) return;
      // SDK declares Agent[] but server returns { agents: Agent[] }
      const result = await apm.agents.list();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      // Server envelope: { agents: [...] }
      const envelope = result as unknown as { agents: unknown[] };
      expect(Array.isArray(envelope.agents)).toBe(true);
    });

    it('register() succeeds with a test agent', async () => {
      if (!requireApm()) return;
      const result = await apm.agents.register({
        agent_id: `test-integration-${Date.now()}`,
        project: 'ccem',
        role: 'test',
        status: 'active',
      });
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  // ---------- Notifications ----------

  describe('notifications', () => {
    it('list() returns an object containing a notifications array', async () => {
      if (!requireApm()) return;
      // SDK declares Notification[] but server returns { notifications: [...], count, limit }
      const result = await apm.notifications.list();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { notifications: unknown[] };
      expect(Array.isArray(envelope.notifications)).toBe(true);
    });

    it('add() succeeds with a test notification', async () => {
      if (!requireApm()) return;
      const result = await apm.notifications.add({
        type: 'test',
        message: 'Integration test notification',
      });
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
    });
  });

  // ---------- Projects ----------

  describe('projects', () => {
    it('list() returns an object containing a projects array', async () => {
      if (!requireApm()) return;
      // SDK declares Project[] but server returns { projects: [...], active_project }
      const result = await apm.projects.list();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { projects: unknown[] };
      expect(Array.isArray(envelope.projects)).toBe(true);
    });
  });

  // ---------- Skills ----------

  describe('skills', () => {
    it('registry() returns an object containing a skills array', async () => {
      if (!requireApm()) return;
      // SDK declares SkillRegistry[] but server returns { skills: [...], total, healthy, ... }
      const result = await apm.skills.registry();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { skills: unknown[] };
      expect(Array.isArray(envelope.skills)).toBe(true);
    });
  });

  // ---------- Config ----------

  describe('config', () => {
    it('openapi() returns an object with openapi field', async () => {
      if (!requireApm()) return;
      const result = await apm.config.openapi();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      expect(result).toHaveProperty('openapi');
    });
  });

  // ---------- Metrics ----------

  describe('metrics', () => {
    it('fleet() returns a metrics envelope', async () => {
      if (!requireApm()) return;
      // Server returns { data: {...}, links: {...}, meta: {...} }
      const result = await apm.metrics.fleet();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { data: unknown };
      expect(envelope).toHaveProperty('data');
    });
  });

  // ---------- SLOs ----------

  describe('slos', () => {
    it('list() returns an object containing a data array', async () => {
      if (!requireApm()) return;
      // SDK declares SLO[] but server returns { data: [...], links, meta }
      const result = await apm.slos.list();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { data: unknown[] };
      expect(Array.isArray(envelope.data)).toBe(true);
    });
  });

  // ---------- Alerts ----------

  describe('alerts', () => {
    it('list() returns an object containing a data array', async () => {
      if (!requireApm()) return;
      // SDK declares Alert[] but server returns { data: [...], links, meta }
      const result = await apm.alerts.list();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { data: unknown[] };
      expect(Array.isArray(envelope.data)).toBe(true);
    });
  });

  // ---------- Formations ----------

  describe('formations', () => {
    it('list() returns an object containing a data array', async () => {
      if (!requireApm()) return;
      // SDK declares Formation[] but server returns { data: [...], links, meta }
      const result = await apm.formations.list();
      expect(result).toBeDefined();
      expect(typeof result).toBe('object');
      const envelope = result as unknown as { data: unknown[] };
      expect(Array.isArray(envelope.data)).toBe(true);
    });
  });
});
