import { NavLink, Outlet, useNavigate } from 'react-router-dom';

import styles from './AppShell.module.css';
import { Button } from '../ui/Button';
import { authService } from '../../services/auth.service';
import { useAuth } from '../../app/auth';
import { QuickAddWidget } from '../ai/QuickAddWidget';

const navItems: Array<{ to: string; label: string }> = [
  { to: '/dashboard', label: 'Dashboard' },
  { to: '/transactions', label: 'Giao dịch' },
  { to: '/categories', label: 'Danh mục' },
];

export function AppShell() {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className={styles.shell}>
      <aside className={styles.sidebar}>
        <NavLink to="/" className={styles.brand}>
          <div className={styles.logo} aria-hidden="true" />
          <div>
            <div className={styles.title}>Finance</div>
            <div className={styles.subtitle}>Manager</div>
          </div>
        </NavLink>

        <nav className={styles.nav}>
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                [styles.navItem, isActive ? styles.navItemActive : ''].join(' ')
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
      </aside>

      <main className={styles.main}>
        <div className={styles.header}>
          <div className={styles.headerTitle}>Quản lý tài chính cá nhân</div>
          <div className={styles.headerRight}>
            <div className={styles.userText}>{user?.name ?? ''}</div>
            <Button
              variant="secondary"
              onClick={() => {
                authService.logout();
                navigate('/', { replace: true });
              }}
            >
              Đăng xuất
            </Button>
          </div>
        </div>

        <div className={styles.content}>
          <Outlet />
        </div>
        <QuickAddWidget />
      </main>
    </div>
  );
}

