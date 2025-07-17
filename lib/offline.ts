import { get, set, del, keys } from 'idb-keyval';

export interface OfflineOperation {
  id: string;
  tool: string;
  args: any;
  userId: string;
  timestamp: number;
  retryCount: number;
}

export class OfflineManager {
  private static readonly QUEUE_KEY_PREFIX = 'offline_op_';
  private static readonly MAX_RETRIES = 3;

  static async queueOperation(operation: Omit<OfflineOperation, 'id' | 'timestamp' | 'retryCount'>): Promise<void> {
    const id = crypto.randomUUID();
    const queuedOp: OfflineOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    await set(`${this.QUEUE_KEY_PREFIX}${id}`, queuedOp);
    console.log('Operation queued for offline sync:', queuedOp);
  }

  static async getQueuedOperations(): Promise<OfflineOperation[]> {
    const allKeys = await keys();
    const queueKeys = allKeys.filter(key => 
      typeof key === 'string' && key.startsWith(this.QUEUE_KEY_PREFIX)
    ) as string[];

    const operations: OfflineOperation[] = [];
    for (const key of queueKeys) {
      const op = await get(key);
      if (op) {
        operations.push(op);
      }
    }

    return operations.sort((a, b) => a.timestamp - b.timestamp);
  }

  static async removeOperation(operationId: string): Promise<void> {
    await del(`${this.QUEUE_KEY_PREFIX}${operationId}`);
  }

  static async flushQueue(): Promise<void> {
    if (!navigator.onLine) {
      console.log('Still offline, skipping queue flush');
      return;
    }

    const operations = await this.getQueuedOperations();
    console.log(`Flushing ${operations.length} queued operations`);

    for (const operation of operations) {
      try {
        await this.executeOperation(operation);
        await this.removeOperation(operation.id);
        console.log('Successfully synced operation:', operation.id);
      } catch (error) {
        console.error('Failed to sync operation:', operation.id, error);
        
        if (operation.retryCount < this.MAX_RETRIES) {
          // Update retry count
          operation.retryCount++;
          await set(`${this.QUEUE_KEY_PREFIX}${operation.id}`, operation);
        } else {
          // Remove operation after max retries
          await this.removeOperation(operation.id);
          console.error('Max retries exceeded, removing operation:', operation.id);
        }
      }
    }
  }

  private static async executeOperation(operation: OfflineOperation): Promise<void> {
    const response = await fetch('/api/mcp/sse', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
      },
      body: JSON.stringify({
        tool: operation.tool,
        args: operation.args,
      }),
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
  }

  static setupOfflineDetection(): void {
    window.addEventListener('online', () => {
      console.log('Connection restored, flushing offline queue');
      this.flushQueue();
    });

    window.addEventListener('offline', () => {
      console.log('Connection lost, operations will be queued');
    });
  }

  static isOnline(): boolean {
    return navigator.onLine;
  }
}

// Initialize offline detection when module loads
if (typeof window !== 'undefined') {
  OfflineManager.setupOfflineDetection();
} 