/**
 * Audit Log Request Queue
 *
 * Ensures audit log entries are sent to the server in sequential order,
 * preventing race conditions when users make multiple quick edits.
 *
 * Problem: Without queueing, if a user makes two edits quickly:
 * - Edit #1 starts at T+0ms
 * - Edit #2 starts at T+100ms
 * - Edit #2 might finish before Edit #1 (due to network variability)
 * - Server receives edits out of order → audit log chronology is corrupted
 *
 * Solution: Queue ensures each request waits for the previous one to complete.
 */

class AuditLogQueue {
  private queue: Promise<any> = Promise.resolve();
  private queueLength = 0;

  /**
   * Add an operation to the queue
   *
   * @param operation - Async function to execute (typically a fetch request)
   * @returns Promise that resolves with the operation's result
   */
  async add<T>(operation: () => Promise<T>): Promise<T> {
    this.queueLength++;
    const currentPosition = this.queueLength;

    console.log(`📝 Audit log queue: Adding request #${currentPosition} (queue length: ${this.queueLength})`);

    // Chain this operation to the end of the queue
    const result = await (this.queue = this.queue
      .then(async () => {
        console.log(`▶️ Audit log queue: Executing request #${currentPosition}`);
        const startTime = performance.now();

        try {
          const operationResult = await operation();
          const duration = performance.now() - startTime;
          console.log(`✅ Audit log queue: Request #${currentPosition} completed in ${duration.toFixed(0)}ms`);
          return operationResult;
        } catch (error) {
          const duration = performance.now() - startTime;
          console.error(`❌ Audit log queue: Request #${currentPosition} failed after ${duration.toFixed(0)}ms`, error);
          throw error;
        } finally {
          this.queueLength--;
        }
      })
      .catch(async (error) => {
        // If a request fails, don't block subsequent requests
        // Just log the error and continue processing the queue
        console.error(`⚠️ Audit log queue: Request #${currentPosition} error (continuing queue)`, error);
        this.queueLength--;

        // Re-execute the operation to return the actual result/error
        return operation();
      }));

    return result;
  }

  /**
   * Get current queue length (for debugging/monitoring)
   */
  getQueueLength(): number {
    return this.queueLength;
  }

  /**
   * Wait for all pending operations to complete (useful for testing)
   */
  async waitForQueue(): Promise<void> {
    await this.queue;
  }
}

// Create singleton instance
export const auditLogQueue = new AuditLogQueue();

// Make queue available globally for debugging
if (typeof window !== 'undefined') {
  (window as any).auditLogQueue = {
    getLength: () => auditLogQueue.getQueueLength(),
    wait: () => auditLogQueue.waitForQueue(),
  };

  console.log(
    '%c📝 Audit Log Queue Available',
    'color: #4CAF50; font-weight: bold; font-size: 12px;',
    '\n\nDebug commands:' +
    '\n  auditLogQueue.getLength() - Get current queue length' +
    '\n  auditLogQueue.wait()      - Wait for queue to empty'
  );
}
