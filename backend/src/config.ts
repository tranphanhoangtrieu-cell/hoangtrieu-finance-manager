function requireEnv(name: string, fallback?: string): string {
  const v = process.env[name] ?? fallback;
  if (!v) throw new Error(`Missing env: ${name}`);
  return v;
}

export const config = {
  port: Number(process.env.PORT ?? 8000),
  frontendOrigin: process.env.FRONTEND_ORIGIN ?? 'http://localhost:5173',

  db: {
    host: requireEnv('DB_HOST', 'localhost'),
    port: Number(process.env.DB_PORT ?? 3306),
    user: requireEnv('DB_USER', 'root'),
    password: process.env.DB_PASSWORD ?? '12345',
    database: requireEnv('DB_NAME', 'finance_manager'),
  },

  jwt: {
    secret: requireEnv('JWT_SECRET', 'change_me_in_production'),
    expiresIn: process.env.JWT_EXPIRES_IN ?? '7d',
  },
};

