import { z } from 'zod';

/** A project tracked by APM */
export interface Project {
  /** Project name */
  name: string;
  /** Filesystem path to the project */
  path?: string;
  /** Number of agents in the project */
  agent_count: number;
  /** Project status */
  status?: string;
  /** Technology stack information */
  stack?: string[];
}

/** Payload for updating a Plane project */
export interface PlaneUpdate {
  /** Plane project ID */
  project_id: string;
  /** Metadata to update */
  metadata: Record<string, unknown>;
}

/** Payload for updating a project */
export interface ProjectUpdatePayload {
  /** Project name */
  name: string;
  /** Updated fields */
  [key: string]: unknown;
}

/** Zod schema for Project */
export const ProjectSchema = z.object({
  name: z.string(),
  path: z.string().optional(),
  agent_count: z.number(),
  status: z.string().optional(),
  stack: z.array(z.string()).optional(),
});

/** Zod schema for PlaneUpdate */
export const PlaneUpdateSchema = z.object({
  project_id: z.string(),
  metadata: z.record(z.unknown()),
});
