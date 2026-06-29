/** Simple event bus */
import type { EventType } from '../types.js';

type Handler = (payload: Record<string, unknown>, source: string) => void | Promise<void>;

export class EventBus {
  private handlers = new Map<EventType, Handler[]>();

  on(event: EventType, handler: Handler): void {
    if (!this.handlers.has(event)) this.handlers.set(event, []);
    this.handlers.get(event)!.push(handler);
  }

  off(event: EventType, handler: Handler): void {
    const list = this.handlers.get(event);
    if (list) this.handlers.set(event, list.filter(h => h !== handler));
  }

  async emit(event: EventType, payload: Record<string, unknown> = {}, source = 'unknown'): Promise<void> {
    const list = this.handlers.get(event);
    if (!list) return;
    for (const handler of list) {
      try { await handler(payload, source); } catch {}
    }
  }

  removeAll(): void {
    this.handlers.clear();
  }
}
