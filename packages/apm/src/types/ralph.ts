import { z } from 'zod';

/** Ralph autonomous fix loop data */
export interface RalphData {
  /** Current iteration number */
  iteration: number;
  /** Current Ralph status */
  status: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Current fix loop state */
  fix_loop_state: string;
}

/** Node in a Ralph flowchart visualization */
export interface RalphFlowchartNode {
  /** Node identifier */
  id: string;
  /** Display label */
  label: string;
  /** Node type */
  type?: string;
  /** Node status */
  status?: string;
}

/** Edge in a Ralph flowchart visualization */
export interface RalphFlowchartEdge {
  /** Source node ID */
  from: string;
  /** Target node ID */
  to: string;
  /** Edge label */
  label?: string;
}

/** Ralph flowchart representation */
export interface RalphFlowchart {
  /** Flowchart nodes */
  nodes: RalphFlowchartNode[];
  /** Flowchart edges */
  edges: RalphFlowchartEdge[];
}

/** Zod schema for RalphData */
export const RalphDataSchema = z.object({
  iteration: z.number(),
  status: z.string(),
  progress: z.number(),
  fix_loop_state: z.string(),
});

/** Zod schema for RalphFlowchart */
export const RalphFlowchartSchema = z.object({
  nodes: z.array(z.object({
    id: z.string(),
    label: z.string(),
    type: z.string().optional(),
    status: z.string().optional(),
  })),
  edges: z.array(z.object({
    from: z.string(),
    to: z.string(),
    label: z.string().optional(),
  })),
});
