export type DateRangePreset =
  | '24h'
  | '7d'
  | '15d'
  | '30d'
  | '6m'
  | '1y'
  | 'custom';

export type DateRangeValue = {
  preset: DateRangePreset;
  startDate: string;
  endDate: string;
  startDateTime?: string;
  endDateTime?: string;
};

const PRESETS: { id: DateRangePreset; label: string }[] = [
  { id: '24h', label: '24h' },
  { id: '7d', label: '7 dias' },
  { id: '15d', label: '15 dias' },
  { id: '30d', label: '30 dias' },
  { id: '6m', label: '6 meses' },
  { id: '1y', label: '1 ano' },
  { id: 'custom', label: 'Personalizado' },
];

function utcDateOnly(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function addUtcDays(d: Date, days: number): Date {
  const x = new Date(d);
  x.setUTCDate(x.getUTCDate() + days);
  return x;
}

function addUtcMonths(d: Date, months: number): Date {
  const x = new Date(d);
  x.setUTCMonth(x.getUTCMonth() + months);
  return x;
}

export function computeRangeForPreset(preset: DateRangePreset): DateRangeValue {
  const now = new Date();
  if (preset === '24h') {
    const start = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    return {
      preset,
      startDate: utcDateOnly(start),
      endDate: utcDateOnly(now),
      startDateTime: start.toISOString(),
      endDateTime: now.toISOString(),
    };
  }
  if (preset === '7d') {
    return {
      preset,
      startDate: utcDateOnly(addUtcDays(now, -6)),
      endDate: utcDateOnly(now),
    };
  }
  if (preset === '15d') {
    return {
      preset,
      startDate: utcDateOnly(addUtcDays(now, -14)),
      endDate: utcDateOnly(now),
    };
  }
  if (preset === '30d') {
    return {
      preset,
      startDate: utcDateOnly(addUtcDays(now, -29)),
      endDate: utcDateOnly(now),
    };
  }
  if (preset === '6m') {
    return {
      preset,
      startDate: utcDateOnly(addUtcMonths(now, -6)),
      endDate: utcDateOnly(now),
    };
  }
  if (preset === '1y') {
    return {
      preset,
      startDate: utcDateOnly(addUtcMonths(now, -12)),
      endDate: utcDateOnly(now),
    };
  }
  return {
    preset: 'custom',
    startDate: utcDateOnly(addUtcDays(now, -29)),
    endDate: utcDateOnly(now),
  };
}

export function buildReportQueryString(range: DateRangeValue): string {
  const params = new URLSearchParams();
  if (range.preset === '24h' && range.startDateTime && range.endDateTime) {
    params.set('startDateTime', range.startDateTime);
    params.set('endDateTime', range.endDateTime);
  } else {
    params.set('startDate', range.startDate);
    params.set('endDate', range.endDate);
  }
  return params.toString();
}

type DateRangeToolbarProps = {
  value: DateRangeValue;
  onChange: (next: DateRangeValue) => void;
};

export function DateRangeToolbar({ value, onChange }: DateRangeToolbarProps) {
  const showDateFields = value.preset === 'custom' || value.preset !== '24h';

  return (
    <div className="fm-toolbar flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
      <div className="flex flex-wrap gap-2">
        {PRESETS.map(({ id, label }) => (
          <button
            key={id}
            type="button"
            className={
              value.preset === id ? 'fm-preset-btn fm-preset-btn-active' : 'fm-preset-btn'
            }
            onClick={() => {
              if (id === 'custom') {
                onChange({ ...value, preset: 'custom' });
              } else {
                onChange(computeRangeForPreset(id));
              }
            }}
          >
            {label}
          </button>
        ))}
      </div>
      {showDateFields && (
        <div className="flex w-full flex-wrap items-end gap-3 lg:w-auto lg:justify-end">
          <div className="fm-toolbar-field flex-1 sm:flex-none">
            <span className="fm-toolbar-label">Início</span>
            <input
              type="date"
              value={value.startDate}
              onChange={(e) => {
                onChange({
                  preset: 'custom',
                  startDate: e.target.value,
                  endDate: value.endDate,
                });
              }}
              className="fm-input"
            />
          </div>
          <div className="fm-toolbar-field flex-1 sm:flex-none">
            <span className="fm-toolbar-label">Fim</span>
            <input
              type="date"
              value={value.endDate}
              onChange={(e) => {
                onChange({
                  preset: 'custom',
                  startDate: value.startDate,
                  endDate: e.target.value,
                });
              }}
              className="fm-input"
            />
          </div>
        </div>
      )}
    </div>
  );
}
