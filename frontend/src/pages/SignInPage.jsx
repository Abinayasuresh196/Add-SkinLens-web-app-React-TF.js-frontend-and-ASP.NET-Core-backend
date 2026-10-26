import { useState } from 'react';
import { Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { useAuth } from '../lib/auth.jsx';
import { BrandMark } from '../components/Icons.jsx';

export default function SignInPage() {
  const { user, signIn, register } = useAuth();
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const next = params.get('next')?.startsWith('/') ? params.get('next') : '/';

  const [mode, setMode] = useState('signin');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [errors, setErrors] = useState({});
  const [busy, setBusy] = useState(false);

  if (user) return <Navigate to={next} replace />;

  const set = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }));
  const isRegister = mode === 'register';

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setErrors({});
    try {
      if (isRegister) await register(form.name, form.email, form.password);
      else await signIn(form.email, form.password);
      navigate(next, { replace: true });
    } catch (err) {
      setErrors({ ...err.fields, form: Object.keys(err.fields ?? {}).length ? '' : err.message });
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="container auth">
      <div className="panel auth-panel">
        <BrandMark size={44} />
        <div className="auth-tabs" role="tablist" aria-label="Account">
          {[['signin', 'Sign in'], ['register', 'Create account']].map(([key, label]) => (
            <button
              key={key}
              type="button"
              role="tab"
              aria-selected={mode === key}
              className={mode === key ? 'is-active' : undefined}
              onClick={() => { setMode(key); setErrors({}); }}
            >
              {mode === key && <motion.span layoutId="auth-tab" className="auth-tab-bg" transition={{ type: 'spring', stiffness: 420, damping: 34 }} />}
              <span>{label}</span>
            </button>
          ))}
        </div>

        <p className="auth-lede">{isRegister ? 'Save results and track a lesion over time.' : 'Welcome back. Sign in to see your saved scans.'}</p>

        <form className="auth-form" onSubmit={submit} noValidate>
          <AnimatePresence initial={false}>
            {isRegister && (
              <motion.label
                className="field"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                style={{ overflow: 'hidden' }}
              >
                <span>Name</span>
                <input value={form.name} onChange={set('name')} autoComplete="name" aria-invalid={!!errors.name} />
                {errors.name && <small className="field-error">{errors.name}</small>}
              </motion.label>
            )}
          </AnimatePresence>
          <label className="field">
            <span>Email</span>
            <input type="email" value={form.email} onChange={set('email')} autoComplete="email" aria-invalid={!!errors.email} />
            {errors.email && <small className="field-error">{errors.email}</small>}
          </label>
          <label className="field">
            <span>Password</span>
            <input
              type="password"
              value={form.password}
              onChange={set('password')}
              autoComplete={isRegister ? 'new-password' : 'current-password'}
              aria-invalid={!!errors.password}
            />
            {isRegister && !errors.password && <small className="muted">At least 8 characters.</small>}
            {errors.password && <small className="field-error">{errors.password}</small>}
          </label>

          {errors.form && <p className="alert" role="alert">{errors.form}</p>}

          <button className="btn btn-block" disabled={busy}>
            {busy ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  );
}
