import { z } from 'zod';

/** A tracked port assignment */
export interface Port {
  /** Port number */
  port: number;
  /** Service using this port */
  service: string;
  /** Project associated with this port */
  project?: string;
  /** Protocol (tcp, udp, etc.) */
  protocol?: string;
  /** Whether this is the primary port for the service */
  primary?: boolean;
}

/** A port clash detected between services */
export interface PortClash {
  /** Conflicting port numbers */
  ports: number[];
  /** Services involved in the clash */
  services: string[];
}

/** Result of a port scan operation */
export interface PortScanResult {
  /** Discovered ports */
  ports: Port[];
  /** Detected clashes */
  clashes: PortClash[];
  /** ISO-8601 timestamp of the scan */
  scanned_at: string;
}

/** Payload for assigning a port */
export interface PortAssignPayload {
  /** Port number */
  port: number;
  /** Service name */
  service: string;
  /** Project name */
  project?: string;
  /** Protocol */
  protocol?: string;
}

/** Payload for setting a primary port */
export interface PortSetPrimaryPayload {
  /** Port number to set as primary */
  port: number;
  /** Service name */
  service: string;
}

/** Zod schema for Port */
export const PortSchema = z.object({
  port: z.number(),
  service: z.string(),
  project: z.string().optional(),
  protocol: z.string().optional(),
  primary: z.boolean().optional(),
});

/** Zod schema for PortClash */
export const PortClashSchema = z.object({
  ports: z.array(z.number()),
  services: z.array(z.string()),
});

/** Zod schema for PortScanResult */
export const PortScanResultSchema = z.object({
  ports: z.array(PortSchema),
  clashes: z.array(PortClashSchema),
  scanned_at: z.string(),
});
