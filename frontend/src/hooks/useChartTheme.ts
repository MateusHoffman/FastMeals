import { useSyncExternalStore } from 'react';

function subscribeDark(cb: () => void): () => void {
  const mq = window.matchMedia('(prefers-color-scheme: dark)');
  const observer = new MutationObserver(cb);
  observer.observe(document.documentElement, {
    attributes: true,
    attributeFilter: ['class'],
  });
  mq.addEventListener('change', cb);
  return () => {
    observer.disconnect();
    mq.removeEventListener('change', cb);
  };
}

function isDarkSnapshot(): boolean {
  return document.documentElement.classList.contains('dark');
}

export type ChartTheme = {
  grid: string;
  axis: string;
  tooltipBg: string;
  tooltipBorder: string;
  tooltipText: string;
};

const light: ChartTheme = {
  grid: '#e2e8f0',
  axis: '#94a3b8',
  tooltipBg: '#ffffff',
  tooltipBorder: '#e2e8f0',
  tooltipText: '#0f172a',
};

const dark: ChartTheme = {
  grid: '#334155',
  axis: '#64748b',
  tooltipBg: '#1e293b',
  tooltipBorder: '#475569',
  tooltipText: '#f1f5f9',
};

export function useChartTheme(): ChartTheme {
  const darkMode = useSyncExternalStore(
    subscribeDark,
    isDarkSnapshot,
    () => false,
  );
  return darkMode ? dark : light;
}
