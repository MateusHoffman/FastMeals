import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import type { User, UserRole } from '@prisma/client';
import { prisma } from '../../shared/database/prisma.js';
import { AppError } from '../../shared/errors/app-error.js';
import type { Env } from '../../config/env.js';

const DUMMY_HASH =
  '$2b$10$abcdefghijklmnopqrstuuABCDEFGHIJKLMNOPQRSTUVWXYZ012';

export interface TokenPayload {
  sub: string;
  role: UserRole;
  type: 'access' | 'refresh';
}

export interface AuthUserDto {
  id: string;
  email: string;
  role: UserRole;
}

export interface LoginResult {
  accessToken: string;
  refreshToken: string;
  user: AuthUserDto;
}

function signToken(
  payload: TokenPayload,
  secret: string,
  expiresIn: string,
): string {
  return jwt.sign(payload, secret, { expiresIn } as jwt.SignOptions);
}

export function verifyToken(
  token: string,
  secret: string,
  expectedType: 'access' | 'refresh',
): TokenPayload {
  try {
    const decoded = jwt.verify(token, secret, {
      algorithms: ['HS256'],
    }) as TokenPayload;
    if (decoded.type !== expectedType || !decoded.sub) {
      throw new AppError(401, 'INVALID_TOKEN', 'Token invalido');
    }
    return decoded;
  } catch (err) {
    if (err instanceof AppError) throw err;
    if (err instanceof jwt.TokenExpiredError) {
      throw new AppError(401, 'TOKEN_EXPIRED', 'Token expirado');
    }
    throw new AppError(401, 'INVALID_TOKEN', 'Token invalido');
  }
}

function toUserDto(user: User): AuthUserDto {
  return { id: user.id, email: user.email, role: user.role };
}

export async function loginWithPassword(
  email: string,
  password: string,
  env: Env,
): Promise<LoginResult> {
  const normalized = email.toLowerCase().trim();
  const user = await prisma.user.findUnique({ where: { email: normalized } });
  const hash = user?.passwordHash ?? DUMMY_HASH;
  const match = await bcrypt.compare(password, hash);
  if (!user || !match) {
    throw new AppError(401, 'INVALID_CREDENTIALS', 'Email ou senha invalidos');
  }
  const accessToken = signToken(
    { sub: user.id, role: user.role, type: 'access' },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
  );
  const refreshToken = signToken(
    { sub: user.id, role: user.role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN,
  );
  return { accessToken, refreshToken, user: toUserDto(user) };
}

export async function refreshTokens(
  refreshToken: string,
  env: Env,
): Promise<{ accessToken: string; refreshToken: string }> {
  const payload = verifyToken(
    refreshToken,
    env.JWT_REFRESH_SECRET,
    'refresh',
  );
  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user) {
    throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh token invalido');
  }
  const accessToken = signToken(
    { sub: user.id, role: user.role, type: 'access' },
    env.JWT_SECRET,
    env.JWT_EXPIRES_IN,
  );
  const newRefresh = signToken(
    { sub: user.id, role: user.role, type: 'refresh' },
    env.JWT_REFRESH_SECRET,
    env.JWT_REFRESH_EXPIRES_IN,
  );
  return { accessToken, refreshToken: newRefresh };
}

export async function getUserById(id: string): Promise<AuthUserDto | null> {
  const user = await prisma.user.findUnique({ where: { id } });
  return user ? toUserDto(user) : null;
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}
