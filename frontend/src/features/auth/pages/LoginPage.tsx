import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../../../services/auth.service';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const disabled = useMemo(
    () => submitting || email.trim() === '' || password.trim() === '',
    [email, password, submitting],
  );
  const navigate = useNavigate();

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.iconBadge} aria-hidden="true">
              🔒
            </div>
            <div className={styles.top}>
              <div className={styles.title}>Đăng nhập</div>
              <div className={styles.subtitle}>Chào mừng bạn quay lại. Đăng nhập để tiếp tục.</div>
            </div>

            <form
              className={styles.form}
              onSubmit={async (e) => {
                e.preventDefault();
                setError('');
                setSubmitting(true);
                try {
                  await authService.login({ email, password });
                  navigate('/dashboard', { replace: true });
                } catch (err) {
                  setError(err instanceof Error ? err.message : 'Đăng nhập thất bại.');
                } finally {
                  setSubmitting(false);
                }
              }}
            >
              <Input
                label="Email"
                value={email}
                onChange={setEmail}
                type="email"
                labelClassName={styles.inputLabel}
                inputClassName={styles.inputPill}
              />
              <Input
                label="Mật khẩu"
                value={password}
                onChange={setPassword}
                type="password"
                labelClassName={styles.inputLabel}
                inputClassName={styles.inputPill}
              />

              {error ? <div className={styles.formError}>{error}</div> : null}

              <Button className={styles.primaryBtn} type="submit" disabled={disabled}>
                {submitting ? 'Đang đăng nhập...' : 'Đăng nhập'}
              </Button>

              <div className={styles.linksRow}>
                <Link className={styles.link} to="/register">
                  Tạo tài khoản
                </Link>
                <Link className={styles.link} to="/">
                  Quay về trang chủ
                </Link>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

