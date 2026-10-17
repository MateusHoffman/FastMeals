import type { FastifyRequest } from 'fastify';
import type { UserRole } from '@prisma/client';
import { AppError } from '../errors/app-error.js';
import {
  verifyToken,
  type AuthUserDto,
  getUserById,
} from '../../modules/auth/auth.service.js';
import type { Env } from '../../config/env.js';

declare module 'fastify' {
  interface FastifyRequest {
    user?: AuthUserDto;
  }
}

const ACCESS_COOKIE = 'fm_access';
const REFRESH_COOKIE = 'fm_refresh';

export function getAccessCookieName(): string {
  return ACCESS_COOKIE;
}

export function getRefreshCookieName(): string {
  return REFRESH_COOKIE;
}

export async function authenticateRequest(
  request: FastifyRequest,
  env: Env,
): Promise<AuthUserDto | null> {
  const authHeader = request.headers.authorization;
  if (authHeader?.startsWith('Bearer ')) {
    const token = authHeader.slice(7);
    const payload = verifyToken(token, env.JWT_SECRET, 'access');
    const user = await getUserById(payload.sub);
    if (!user) throw new AppError(401, 'INVALID_TOKEN', 'Token invalido');
    return user;
  }

  const cookieToken = request.cookies[ACCESS_COOKIE];
  if (cookieToken) {
    const payload = verifyToken(cookieToken, env.JWT_SECRET, 'access');
    const user = await getUserById(payload.sub);
    if (!user) throw new AppError(401, 'INVALID_TOKEN', 'Token invalido');
    return user;
  }

  return null;
}

export function requireAuth(env: Env) {
  return async (request: FastifyRequest): Promise<void> => {
    const user = await authenticateRequest(request, env);
    if (!user) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token ausente ou invalido');
    }
    request.user = user;
  };
}

export function requireRole(...roles: UserRole[]) {
  return async (request: FastifyRequest): Promise<void> => {
    if (!request.user) {
      throw new AppError(401, 'INVALID_TOKEN', 'Nao autenticado');
    }
    if (!roles.includes(request.user.role)) {
      throw new AppError(403, 'FORBIDDEN', 'Permissao insuficiente');
    }
  };
}

export function requireAdmin() {
  return requireRole('admin');
}
