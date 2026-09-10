import jwt from 'jsonwebtoken';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config';

export interface UserTokenPayload {
  uid: string;
  tg: string;
}
export interface AdminTokenPayload {
  aid: string;
  username: string;
  role: string;
}

export function signUserToken(payload: UserTokenPayload): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '30d' });
}
export function signAdminToken(payload: AdminTokenPayload): string {
  return jwt.sign(payload, config.admin.jwtSecret, { expiresIn: '12h' });
}

export interface AuthedRequest extends Request {
  user?: UserTokenPayload;
  admin?: AdminTokenPayload;
}

function bearer(req: Request): string | null {
  const h = req.headers.authorization;
  if (!h?.startsWith('Bearer ')) return null;
  return h.slice(7);
}

export function requireUser(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.user = jwt.verify(token, config.jwtSecret) as UserTokenPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_token' });
  }
}

export function requireAdmin(req: AuthedRequest, res: Response, next: NextFunction) {
  const token = bearer(req);
  if (!token) return res.status(401).json({ error: 'unauthorized' });
  try {
    req.admin = jwt.verify(token, config.admin.jwtSecret) as AdminTokenPayload;
    next();
  } catch {
    return res.status(401).json({ error: 'invalid_admin_token' });
  }
}
