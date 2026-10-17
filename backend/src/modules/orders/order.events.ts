export type OrderEventType =
  | 'order.created'
  | 'order.status_changed'
  | 'order.assigned'
  | 'order.assignment_accepted';

export interface OrderEvent {
  type: OrderEventType;
  orderId: string;
  at: string;
  payload?: Record<string, unknown>;
}

type Listener = (event: OrderEvent) => void;

class OrderEventHub {
  private readonly listeners = new Set<Listener>();

  subscribe(listener: Listener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  publish(event: OrderEvent): void {
    for (const listener of this.listeners) {
      try {
        listener(event);
      } catch {
        // subscriber errors must not break publishers
      }
    }
  }
}

export const orderEventHub = new OrderEventHub();

export function publishOrderEvent(
  type: OrderEventType,
  orderId: string,
  payload?: Record<string, unknown>,
): void {
  orderEventHub.publish({
    type,
    orderId,
    at: new Date().toISOString(),
    ...(payload ? { payload } : {}),
  });
}
