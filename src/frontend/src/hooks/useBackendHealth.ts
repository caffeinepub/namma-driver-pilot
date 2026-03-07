/**
 * useBackendHealth
 *
 * Silently retries health check in background forever.
 * Users NEVER see any banner during normal cold start.
 * Error is only surfaced after 2+ minutes of continuous failure.
 *
 * Strategy:
 *   - On mount: isHealthy = true, isChecking = false — NO banner shown
 *   - Retry every 15s silently in background
 *   - Only set isHealthy = false after 8 consecutive failures (~2 minutes)
 *   - On any success at any point → clear error, stay healthy silently
 *   - recheck() resets failure count and retries immediately
 */

import { useCallback, useEffect, useRef, useState } from "react";

const RETRY_DELAY_MS = 15_000; // 15s between retries
const FAILURE_THRESHOLD = 8; // 8 × 15s = 2 minutes before showing error

/**
 * Ping the backend canister using an anonymous HttpAgent.
 * No identity required — fires immediately on page load.
 */
async function pingCanisterRaw(): Promise<boolean> {
  try {
    const { HttpAgent } = await import("@dfinity/agent");

    const canisterId = process.env.CANISTER_ID_BACKEND;
    if (!canisterId) return true; // no canister ID in dev — don't show error

    const isLocal =
      window.location.hostname.includes("localhost") ||
      window.location.hostname.includes("127.0.0.1");

    const host = isLocal ? "http://127.0.0.1:4943" : "https://icp0.io";

    const agent = await HttpAgent.create({ host });

    if (isLocal) {
      await agent.fetchRootKey();
    }

    // Candid encoding for a no-arg query: DIDL\x00\x00
    const noArgsCandid = new Uint8Array([68, 73, 68, 76, 0, 0]);

    const response = await agent.query(canisterId, {
      methodName: "health",
      arg: noArgsCandid,
    });

    return response.status === "replied";
  } catch {
    return false;
  }
}

export function useBackendHealth() {
  // Start healthy — no banner shown on load
  const [isHealthy, setIsHealthy] = useState(true);
  const [isChecking, setIsChecking] = useState(false);

  const consecutiveFailuresRef = useRef(0);
  const mountedRef = useRef(true);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const scheduleNext = useCallback(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      if (!mountedRef.current) return;

      const ok = await pingCanisterRaw();

      if (!mountedRef.current) return;

      if (ok) {
        consecutiveFailuresRef.current = 0;
        setIsHealthy(true); // silently restore if it was unhealthy
      } else {
        consecutiveFailuresRef.current += 1;
        if (consecutiveFailuresRef.current >= FAILURE_THRESHOLD) {
          setIsHealthy(false); // only show error after 2+ minutes continuous failure
        }
      }

      scheduleNext(); // keep retrying forever
    }, RETRY_DELAY_MS);
  }, []);

  const recheck = useCallback(async () => {
    // Manual recheck: reset failure count, try immediately
    consecutiveFailuresRef.current = 0;
    setIsChecking(true);
    const ok = await pingCanisterRaw();
    if (mountedRef.current) {
      setIsChecking(false);
      if (ok) {
        setIsHealthy(true);
      }
      // Don't set unhealthy on a single manual recheck failure
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;

    // Start background polling — no immediate ping, no banner on load
    scheduleNext();

    return () => {
      mountedRef.current = false;
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [scheduleNext]);

  return {
    isHealthy,
    isChecking,
    recheck,
  };
}
