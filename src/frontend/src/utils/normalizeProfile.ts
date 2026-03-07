import type { UserProfile } from "../lib/types";

/**
 * A normalized version of UserProfile where the driver-specific array fields
 * are always plain string[] instead of Candid variant object arrays.
 */
export type NormalizedDriverProfile = Omit<
  UserProfile,
  "vehicleExperience" | "transmissionComfort" | "languages"
> & {
  vehicleExperience: string[];
  transmissionComfort: string[];
  languages: string[];
};

/**
 * Normalizes any value to a string array:
 * - string → [string]
 * - null/undefined → []
 * - Candid variant object like { '#manual': null } → ['manual']
 * - array of strings or variant objects → string[]
 * - anything else → []
 */
export function normalizeArrayField(value: unknown): string[] {
  if (value === null || value === undefined) return [];
  if (typeof value === "string") return [value];
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== null && item !== undefined)
      .map((item) => {
        if (typeof item === "string") return item.replace(/^#/, "");
        // Handle Candid variant objects like { '#manual': null } → 'manual'
        if (typeof item === "object") {
          const keys = Object.keys(item as object);
          if (keys.length > 0) return keys[0].replace(/^#/, "");
        }
        return String(item);
      });
  }
  // Handle Candid variant objects like { '#manual': null } → ['manual']
  if (typeof value === "object") {
    const keys = Object.keys(value as object);
    if (keys.length > 0) return [keys[0].replace(/^#/, "")];
  }
  return [];
}

/**
 * Normalizes the languages field from Candid optional array format `[] | [string[]]`
 * to a plain string[].
 */
function normalizeLanguages(languages: unknown): string[] {
  if (languages === null || languages === undefined) return [];
  if (Array.isArray(languages)) {
    // Candid optional: [] means None, [string[]] means Some(string[])
    if (languages.length === 0) return [];
    const inner = languages[0];
    if (Array.isArray(inner))
      return inner.filter((s): s is string => typeof s === "string");
    // If it's already a flat string array (malformed/direct), return it
    if (typeof inner === "string") return languages as string[];
  }
  return [];
}

/**
 * Returns a NormalizedDriverProfile where:
 * - vehicleExperience is always string[] (e.g. ['hatchback', 'sedan'])
 * - transmissionComfort is always string[] (e.g. ['manual', 'automatic'])
 * - languages is always string[] (e.g. ['English', 'Hindi'])
 *
 * Handles all backend return shapes: Candid variant objects, plain strings,
 * null/undefined, and already-valid arrays.
 */
export function normalizeDriverProfile(
  profile: UserProfile,
): NormalizedDriverProfile {
  return {
    ...(profile as Omit<
      UserProfile,
      "vehicleExperience" | "transmissionComfort" | "languages"
    >),
    vehicleExperience: normalizeArrayField(profile.vehicleExperience),
    transmissionComfort: normalizeArrayField(profile.transmissionComfort),
    languages: normalizeLanguages(profile.languages),
  };
}
