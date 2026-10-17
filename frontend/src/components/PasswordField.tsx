import { useId, useState } from 'react';

type PasswordFieldProps = {
  id?: string;
  value: string;
  onChange: (value: string) => void;
  autoComplete?: string;
  className?: string;
  label?: string;
};

export function PasswordField({
  id: idProp,
  value,
  onChange,
  autoComplete = 'current-password',
  className = 'fm-input',
  label = 'Senha',
}: PasswordFieldProps) {
  const autoId = useId();
  const id = idProp ?? autoId;
  const [visible, setVisible] = useState(false);

  return (
    <label htmlFor={id} className="block text-sm font-medium text-slate-700 dark:text-slate-300">
      {label}
      <div className="relative mt-1.5">
        <input
          id={id}
          type={visible ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`${className} pr-10`}
        />
        <button
          type="button"
          className="absolute inset-y-0 right-0 flex items-center rounded-r-lg px-2.5 text-slate-500 hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-orange-500/30 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
          aria-label={visible ? 'Ocultar senha' : 'Mostrar senha'}
          onClick={() => setVisible((v) => !v)}
        >
          {visible ? (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M3 3l18 18" />
              <path d="M10.58 10.58a2 2 0 002.84 2.84" />
              <path d="M9.88 4.24A10.94 10.94 0 0112 5c7 0 10 7 10 7a18.45 18.45 0 01-5.06 5.94M6.61 6.61A18.45 18.45 0 003 12s3 7 10 7a10.94 10.94 0 004.12-.76" />
            </svg>
          ) : (
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="h-5 w-5"
              aria-hidden
            >
              <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
              <circle cx="12" cy="12" r="3" />
            </svg>
          )}
        </button>
      </div>
    </label>
  );
}
