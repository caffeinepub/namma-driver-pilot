/**
 * Safely normalizes a role value returned from the backend actor.
 *
 * The backend may return:
 *   - A plain string: "admin" | "customer" | "driver"
 *   - A Candid variant object: { admin: null } | { customer: null } | { driver: null }
 *   - A legacy Candid variant with '#' prefix: { '#admin': null } etc.
 *   - null or undefined (unauthenticated / no role)
 *
 * Returns the normalized role string (without '#' prefix), or '' as a safe fallback.
 */
export function normalizeRole(role: unknown): string {
  if (role === null || role === undefined) return '';
  if (typeof role === 'string') {
    // Strip leading '#' if present (legacy format)
    return role.startsWith('#') ? role.slice(1) : role;
  }
  if (typeof role === 'object' && !Array.isArray(role)) {
    const keys = Object.keys(role as object);
    if (keys.length > 0) {
      const key = keys[0];
      // Strip leading '#' if present (legacy format)
      return key.startsWith('#') ? key.slice(1) : key;
    }
  }
  return '';
}
