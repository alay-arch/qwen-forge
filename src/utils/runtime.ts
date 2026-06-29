/** Global runtime state — CLI flags, debug mode */

export interface RuntimeState {
  debug: boolean;
  startTime: number;
}

const state: RuntimeState = {
  debug: false,
  startTime: Date.now(),
};

export function parseCliArgs(): { debug: boolean } {
  const args = process.argv.slice(2);
  return {
    debug: args.includes('--debug'),
  };
}

export function initRuntime(): void {
  const { debug } = parseCliArgs();
  state.debug = debug;
  state.startTime = Date.now();
}

export function isDebug(): boolean {
  return state.debug;
}

export function getUptime(): number {
  return Date.now() - state.startTime;
}

/** Measure execution time */
export function timer() {
  const start = Date.now();
  return {
    elapsed: () => Date.now() - start,
    stop: () => {
      const elapsed = Date.now() - start;
      return elapsed;
    },
  };
}
