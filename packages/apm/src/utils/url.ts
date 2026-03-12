/**
 * Build a URL from a base, path, and optional query parameters.
 *
 * @param base - Base URL (e.g., "http://localhost:3032")
 * @param path - URL path (e.g., "/api/agents")
 * @param params - Optional query parameters
 * @returns The fully constructed URL string
 */
export function buildUrl(
  base: string,
  path: string,
  params?: Record<string, string | number | boolean | undefined>,
): string {
  // Remove trailing slash from base
  const cleanBase = base.replace(/\/+$/, '');
  // Ensure path starts with /
  const cleanPath = path.startsWith('/') ? path : `/${path}`;

  const url = new URL(`${cleanBase}${cleanPath}`);

  if (params) {
    for (const [key, value] of Object.entries(params)) {
      if (value !== undefined) {
        url.searchParams.set(key, String(value));
      }
    }
  }

  return url.toString();
}
