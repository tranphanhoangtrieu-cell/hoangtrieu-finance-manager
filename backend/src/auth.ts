import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

import { config } from './config';

export type JwtUser = { id: string; email: string; name: string };

export function signAccessToken(user: JwtUser): string {
  return jwt.sign(
    { sub: user.id, email: user.email, name: user.name },
    config.jwt.secret as jwt.Secret,
    { expiresIn: config.jwt.expiresIn as any },
  );
}

export function verifyAccessToken(token: string): JwtUser | null {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as { sub?: unknown; email?: unknown; name?: unknown };
    if (typeof decoded.sub !== 'string') return null;
    if (typeof decoded.email !== 'string') return null;
    if (typeof decoded.name !== 'string') return null;
    return { id: decoded.sub, email: decoded.email, name: decoded.name };
  } catch {
    return null;
  }
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(password: string, passwordHash: string): Promise<boolean> {
  return bcrypt.compare(password, passwordHash);
}

