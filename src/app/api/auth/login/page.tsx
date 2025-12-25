"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import styles from './login.module.css';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // כאן אנחנו נשלח ל-API של ה-Auth (שניצור מיד)
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.message || 'פרטי התחברות שגויים');

      // שמירת פרטי המשתמש (כרגע ב-LocalStorage, בהמשך ב-Cookies/Session)
      localStorage.setItem('user', JSON.stringify(data.user));
      
      // ניתוב לפי תפקיד
      if (data.user.roles.includes('SUPERVISOR')) {
        router.push('/supervisor/placement-management');
      } else {
        router.push('/teacher/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.authContainer}>
      <div className={styles.loginCard}>
        <div className={styles.header}>
          <h1>כניסה למערכת Fit-In</h1>
        </div>

        {error && <div className={styles.errorMsg}>{error}</div>}

        <form onSubmit={handleSubmit}>
          <div className={styles.formGroup}>
            <label className={styles.label}>אימייל</label>
            <input 
              type="email" 
              className={styles.input}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>סיסמה</label>
            <input 
              type="password" 
              className={styles.input}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className={styles.submitBtn} disabled={loading}>
            {loading ? 'מתחבר...' : 'התחברי'}
          </button>
        </form>
      </div>
    </div>
  );
}