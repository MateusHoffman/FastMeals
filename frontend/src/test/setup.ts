import '@testing-library/jest-dom/vitest';
import { vi } from 'vitest';

class MockEventSource {
  static instances: MockEventSource[] = [];
  url: string;
  onopen: ((ev: Event) => void) | null = null;
  onmessage: ((ev: MessageEvent) => void) | null = null;
  onerror: ((ev: Event) => void) | null = null;

  constructor(url: string) {
    this.url = url;
    MockEventSource.instances.push(this);
    queueMicrotask(() => this.onopen?.(new Event('open')));
  }

  close() {
    /* noop */
  }
}

vi.stubGlobal('EventSource', MockEventSource);
