/** Time between each loading step (3 steps in 6s). */
export const LOADING_STEP_INTERVAL_MS = 2000;

/** When all three steps are marked complete. */
export const LOADING_ALL_COMPLETE_MS = 6000;

/** Brief pause after all steps complete before showing results. */
export const LOADING_FINAL_HOLD_MS = 500;

/** Minimum time the loading screen stays visible. */
export const MIN_LOADING_DISPLAY_MS = LOADING_ALL_COMPLETE_MS + LOADING_FINAL_HOLD_MS;

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
