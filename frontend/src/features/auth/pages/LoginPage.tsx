import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../../../services/auth.service';
import styles from './AuthPage.module.css';

export function LoginPage() {
  const [email, setEmail] = useState('trieu@example.com');
  const [password, setPassword] = useState('123456');
  const disabled = useMemo(() => email.trim() === '' || password.trim() === '', [email, password]);
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
              onSubmit={(e) => {
                e.preventDefault();
                authService.login({ email, password });
                navigate('/dashboard', { replace: true });
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

              <Button className={styles.primaryBtn} type="submit" disabled={disabled}>
                Đăng nhập
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

