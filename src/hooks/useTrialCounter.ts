import { useState, useCallback } from "react";

const STORAGE_KEY = "manalens_strategist_trials";
const MAX_FREE_TRIALS = 3;

export function useTrialCounter() {
  const [usedTrials, setUsedTrials] = useState<number>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      return stored ? parseInt(stored, 10) : 0;
    } catch {
      return 0;
    }
  });

  const remaining = Math.max(0, MAX_FREE_TRIALS - usedTrials);
  const isExhausted = remaining <= 0;

  const consumeTrial = useCallback(() => {
    const next = usedTrials + 1;
    setUsedTrials(next);
    try {
      localStorage.setItem(STORAGE_KEY, String(next));
    } catch {}
  }, [usedTrials]);

  return { remaining, isExhausted, consumeTrial, maxTrials: MAX_FREE_TRIALS };
}
