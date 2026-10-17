import { useQueryClient } from '@tanstack/react-query';
import { useEffect, useRef, useState } from 'react';

const API_BASE = import.meta.env.VITE_API_URL ?? '/api';

export function useOrderEvents(options?: {
  onEvent?: (type: string, orderId: string) => void;
}) {
  const qc = useQueryClient();
  const [connected, setConnected] = useState(false);
  const onEventRef = useRef(options?.onEvent);
  onEventRef.current = options?.onEvent;

  useEffect(() => {
    const url = `${API_BASE.replace(/\/$/, '')}/orders/stream`;
    const es = new EventSource(url);

    es.onopen = () => setConnected(true);
    es.onerror = () => setConnected(false);

    es.onmessage = (msg) => {
      try {
        const parsed = JSON.parse(msg.data) as { type: string; orderId: string };
        void qc.invalidateQueries({ queryKey: ['orders'] });
        void qc.invalidateQueries({ queryKey: ['orders-ready'] });
        onEventRef.current?.(parsed.type, parsed.orderId);
      } catch {
        // ignore malformed events
      }
    };

    return () => {
      es.close();
      setConnected(false);
    };
  }, [qc]);

  return { connected };
}
