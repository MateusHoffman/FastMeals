import { motion, useReducedMotion } from 'motion/react';
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiFetch } from '../services/api';
import { useAuthStore, type AuthUser } from '../stores/authStore';
import { PasswordField } from '../components/PasswordField';
import { ThemeToggle } from '../components/ThemeToggle';

const ease = [0.22, 1, 0.36, 1] as const;

export function LoginPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((s) => s.setUser);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const reduce = useReducedMotion();

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError('');
    if (!email || !password) {
      setError('Preencha email e senha');
      return;
    }
    try {
      const res = await apiFetch<{ user: AuthUser }>('/auth/session', {
        method: 'POST',
        json: { email, password },
      });
      setUser(res.user);
      useAuthStore.getState().setSessionHydrated(true);
      navigate('/orders');
    } catch {
      setError('Credenciais inválidas');
    }
  }

  return (
    <div className="fm-login-page">
      <div className="fm-login-glow" aria-hidden />
      <div className="absolute right-4 top-4 z-10">
        <ThemeToggle />
      </div>
      <motion.div
        className="relative z-[1] w-full max-w-md"
        initial={reduce ? false : { opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease }}
      >
        <div className="mb-8 text-center">
          <p className="text-2xl font-bold tracking-tight text-orange-700 dark:text-orange-400">
            FastMeals
          </p>
          <p className="mt-1 text-sm text-slate-700 dark:text-slate-300">Acesso ao painel</p>
        </div>
        <motion.form
          onSubmit={(e) => void onSubmit(e)}
          className="fm-login-card"
          initial={reduce ? false : { opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.35, delay: 0.08, ease }}
        >
          {error && (
            <motion.p
              className="fm-error-banner mb-4"
              role="alert"
              initial={reduce ? false : { opacity: 0, x: -6 }}
              animate={{ opacity: 1, x: 0 }}
            >
              {error}
            </motion.p>
          )}
          <label htmlFor="email" className="mb-4 block text-sm font-medium text-slate-700 dark:text-slate-300">
            Email
            <input
              id="email"
              type="email"
              autoComplete="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="fm-input mt-1.5"
            />
          </label>
          <div className="mb-6">
            <PasswordField
              id="password"
              value={password}
              onChange={setPassword}
              autoComplete="current-password"
            />
          </div>
          <button type="submit" className="fm-btn-primary w-full py-2.5">
            Entrar
          </button>
        </motion.form>
      </motion.div>
    </div>
  );
}
