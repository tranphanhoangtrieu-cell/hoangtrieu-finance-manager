import { NavLink, Outlet } from 'react-router-dom';

import styles from './PublicLayout.module.css';

export function PublicLayout() {
  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.inner}>
          <NavLink to="/" className={styles.brand}>
            <span className={styles.logo} aria-hidden="true" />
            <span className={styles.brandText}>Finance Manager</span>
          </NavLink>

          <nav className={styles.nav}>
            <NavLink to="/login" className={styles.navLink}>
              Đăng nhập
            </NavLink>
            <NavLink to="/register" className={[styles.navLink, styles.navPrimary].join(' ')}>
              Đăng ký
            </NavLink>
          </nav>
        </div>
      </header>

      <main className={styles.main}>
        <Outlet />
      </main>

      <footer className={styles.footer}>
        <div className={styles.inner}>
          <div className={styles.footerText}>© {new Date().getFullYear()} Finance Manager</div>
        </div>
      </footer>
    </div>
  );
}

