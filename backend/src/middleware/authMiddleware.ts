import type { NextFunction, Request, Response } from 'express';

import { jsonError } from '../http';
import { verifyAccessToken, type JwtUser } from '../auth';

declare module 'express-serve-static-core' {
  interface Request {
    user?: JwtUser;
  }
}

export function authMiddleware(req: Request, res: Response, next: NextFunction) {
  const header = req.header('authorization') ?? '';
  const token = header.startsWith('Bearer ') ? header.slice('Bearer '.length).trim() : '';
  if (!token) return jsonError(res, 401, 'Bạn chưa đăng nhập.');

  const user = verifyAccessToken(token);
  if (!user) return jsonError(res, 401, 'Phiên đăng nhập không hợp lệ.');

  req.user = user;
  return next();
}

