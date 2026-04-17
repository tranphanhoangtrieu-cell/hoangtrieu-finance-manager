import { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';

import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { authService } from '../../../services/auth.service';
import styles from './AuthPage.module.css';

export function RegisterPage() {
  const [name, setName] = useState('Trần Phan Hoàng Triều');
  const [email, setEmail] = useState('trieu@example.com');
  const [password, setPassword] = useState('123456');
  const navigate = useNavigate();
  const disabled = useMemo(
    () => name.trim() === '' || email.trim() === '' || password.trim() === '',
    [name, email, password]
  );

  return (
    <div className={styles.wrap}>
      <div className={styles.bg}>
        <div className={styles.card}>
          <div className={styles.cardInner}>
            <div className={styles.iconBadge} aria-hidden="true">
              👤
            </div>
            <div className={styles.top}>
              <div className={styles.title}>Đăng ký</div>
              <div className={styles.subtitle}>
                Tạo tài khoản để bắt đầu quản lý thu/chi.
              </div>
            </div>

            <form
              className={styles.form}
              onSubmit={(e) => {
                e.preventDefault();
                authService.register({ name, email, password });
                navigate('/dashboard', { replace: true });
              }}
            >
              <Input label="Họ tên" value={name} onChange={setName} labelClassName={styles.inputLabel} inputClassName={styles.inputPill} />
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
                Tạo tài khoản
              </Button>

              <div className={styles.linksRow}>
                <Link className={styles.link} to="/login">
                  Đã có tài khoản
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

