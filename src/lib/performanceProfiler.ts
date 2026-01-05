/**
 * Performance Profiler
 *
 * A utility to measure and log function execution times.
 * Helps identify performance bottlenecks in cell selection and other operations.
 *
 * Usage:
 * 1. Wrap functions with profileFunction()
 * 2. Use ProfilerGroup for related operations
 * 3. Check console for detailed timing logs
 */

interface ProfileEntry {
  name: string;
  startTime: number;
  endTime?: number;
  duration?: number;
  level: number;
  children: ProfileEntry[];
  parent?: ProfileEntry;
}

class PerformanceProfiler {
  private enabled: boolean = true;
  private rootEntries: ProfileEntry[] = [];
  private groupStack: ProfileEntry[] = [];

  constructor() {
    // Enable profiler if in development or if explicitly enabled
    this.enabled =
      localStorage.getItem('enablePerformanceProfiler') === 'true' ||
      import.meta.env.DEV;
  }

  enable() {
    this.enabled = true;
    localStorage.setItem('enablePerformanceProfiler', 'true');
    console.log('✅ Performance Profiler ENABLED');
  }

  disable() {
    this.enabled = false;
    localStorage.setItem('enablePerformanceProfiler', 'false');
    console.log('❌ Performance Profiler DISABLED');
  }

  isEnabled(): boolean {
    return this.enabled;
  }

  /**
   * Start profiling a function or operation
   */
  start(name: string): ProfileEntry {
    if (!this.enabled) {
      return {} as ProfileEntry;
    }

    const entry: ProfileEntry = {
      name,
      startTime: performance.now(),
      level: this.groupStack.length,
      children: [],
    };

    // Add to current group or root
    if (this.groupStack.length > 0) {
      const parent = this.groupStack[this.groupStack.length - 1];
      entry.parent = parent;
      parent.children.push(entry);
    } else {
      this.rootEntries.push(entry);
    }

    return entry;
  }

  /**
   * End profiling for a function or operation
   */
  end(entry: ProfileEntry): number {
    if (!this.enabled || !entry.startTime) {
      return 0;
    }

    entry.endTime = performance.now();
    entry.duration = entry.endTime - entry.startTime;

    return entry.duration;
  }

  /**
   * Start a profiling group (for grouping related operations)
   */
  startGroup(name: string): ProfileEntry {
    if (!this.enabled) {
      return {} as ProfileEntry;
    }

    const entry = this.start(name);
    this.groupStack.push(entry);
    return entry;
  }

  /**
   * End a profiling group
   */
  endGroup(entry: ProfileEntry): number {
    if (!this.enabled || !entry.startTime) {
      return 0;
    }

    const duration = this.end(entry);

    // Remove from stack
    const index = this.groupStack.indexOf(entry);
    if (index !== -1) {
      this.groupStack.splice(index, 1);
    }

    return duration;
  }

  /**
   * Print all profiling results to console
   */
  printResults(threshold: number = 0) {
    if (!this.enabled) {
      return;
    }

    console.group('🔍 Performance Profile Results');

    this.rootEntries.forEach(entry => {
      this.printEntry(entry, threshold);
    });

    console.groupEnd();
  }

  /**
   * Print a single entry with indentation
   */
  private printEntry(entry: ProfileEntry, threshold: number, indent: string = '') {
    if (!entry.duration || entry.duration < threshold) {
      return;
    }

    const duration = entry.duration.toFixed(2);
    const color = this.getColorForDuration(entry.duration);

    console.log(
      `%c${indent}${entry.name}: ${duration}ms`,
      `color: ${color}; font-weight: ${entry.level === 0 ? 'bold' : 'normal'}`
    );

    if (entry.children.length > 0) {
      entry.children.forEach(child => {
        this.printEntry(child, threshold, indent + '  ');
      });
    }
  }

  /**
   * Get color based on duration (for console styling)
   */
  private getColorForDuration(duration: number): string {
    if (duration < 1) return '#4CAF50';      // Green - fast
    if (duration < 10) return '#8BC34A';     // Light green - good
    if (duration < 50) return '#FFC107';     // Yellow - warning
    if (duration < 100) return '#FF9800';    // Orange - slow
    if (duration < 500) return '#FF5722';    // Deep orange - very slow
    return '#F44336';                         // Red - critical
  }

  /**
   * Print summary statistics
   */
  printSummary() {
    if (!this.enabled) {
      return;
    }

    const allEntries = this.flattenEntries(this.rootEntries);
    const totalTime = allEntries.reduce((sum, e) => sum + (e.duration || 0), 0);
    const slowest = [...allEntries].sort((a, b) => (b.duration || 0) - (a.duration || 0)).slice(0, 10);

    console.group('📊 Performance Summary');
    console.log(`Total Operations: ${allEntries.length}`);
    console.log(`Total Time: ${totalTime.toFixed(2)}ms`);
    console.log(`\nTop 10 Slowest Operations:`);

    slowest.forEach((entry, i) => {
      console.log(`  ${i + 1}. ${entry.name}: ${(entry.duration || 0).toFixed(2)}ms`);
    });

    console.groupEnd();
  }

  /**
   * Flatten all entries into a single array
   */
  private flattenEntries(entries: ProfileEntry[]): ProfileEntry[] {
    const result: ProfileEntry[] = [];

    entries.forEach(entry => {
      result.push(entry);
      if (entry.children.length > 0) {
        result.push(...this.flattenEntries(entry.children));
      }
    });

    return result;
  }

  /**
   * Clear all profiling data
   */
  clear() {
    this.rootEntries = [];
    this.groupStack = [];
    console.log('🗑️ Profiler data cleared');
  }

  /**
   * Profile a function call
   */
  profile<T>(name: string, fn: () => T): T {
    if (!this.enabled) {
      return fn();
    }

    const entry = this.start(name);
    try {
      const result = fn();
      this.end(entry);
      return result;
    } catch (error) {
      this.end(entry);
      throw error;
    }
  }

  /**
   * Profile an async function call
   */
  async profileAsync<T>(name: string, fn: () => Promise<T>): Promise<T> {
    if (!this.enabled) {
      return fn();
    }

    const entry = this.start(name);
    try {
      const result = await fn();
      this.end(entry);
      return result;
    } catch (error) {
      this.end(entry);
      throw error;
    }
  }
}

// Create singleton instance
export const profiler = new PerformanceProfiler();

/**
 * Decorator to automatically profile a function
 */
export function profileFunction(name?: string) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;
    const functionName = name || `${target.constructor.name}.${propertyKey}`;

    descriptor.value = function (...args: any[]) {
      return profiler.profile(functionName, () => originalMethod.apply(this, args));
    };

    return descriptor;
  };
}

/**
 * Profiler group helper for React hooks
 */
export class ProfilerGroup {
  private entry: ProfileEntry;

  constructor(name: string) {
    this.entry = profiler.startGroup(name);
  }

  end() {
    return profiler.endGroup(this.entry);
  }

  /**
   * Start a sub-operation within this group
   */
  startOp(name: string): ProfileEntry {
    return profiler.start(name);
  }

  /**
   * End a sub-operation
   */
  endOp(entry: ProfileEntry): number {
    return profiler.end(entry);
  }
}

// Export convenience functions
export const startProfile = (name: string) => profiler.start(name);
export const endProfile = (entry: ProfileEntry) => profiler.end(entry);
export const printProfile = (threshold?: number) => profiler.printResults(threshold);
export const printSummary = () => profiler.printSummary();
export const clearProfile = () => profiler.clear();
export const enableProfiler = () => profiler.enable();
export const disableProfiler = () => profiler.disable();

// Make profiler available globally for console access
if (typeof window !== 'undefined') {
  (window as any).profiler = {
    enable: enableProfiler,
    disable: disableProfiler,
    print: printProfile,
    summary: printSummary,
    clear: clearProfile,
    isEnabled: () => profiler.isEnabled(),
  };

  console.log(
    '%c📊 Performance Profiler Available',
    'color: #2196F3; font-weight: bold; font-size: 12px;',
    '\n\nConsole commands:' +
    '\n  profiler.enable()   - Enable profiling' +
    '\n  profiler.disable()  - Disable profiling' +
    '\n  profiler.print()    - Print results (optional threshold in ms)' +
    '\n  profiler.summary()  - Print summary statistics' +
    '\n  profiler.clear()    - Clear profiling data' +
    '\n  profiler.isEnabled() - Check if enabled'
  );
}
