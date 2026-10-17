import { timingSafeEqual, randomBytes } from 'node:crypto';
import type { FastifyRequest } from 'fastify';
import { AppError } from '../errors/app-error.js';
import type { Env } from '../../config/env.js';

export const CSRF_COOKIE = 'csrf_token';
export const CSRF_HEADER = 'x-csrf-token';

export function generateCsrfToken(): string {
  return randomBytes(32).toString('hex');
}

function safeEqual(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

function allowedSpaOrigins(spaOrigin: string): Set<string> {
  const allowed = new Set<string>([spaOrigin]);
  if (spaOrigin.includes('localhost')) {
    allowed.add(spaOrigin.replace('localhost', '127.0.0.1'));
  }
  if (spaOrigin.includes('127.0.0.1')) {
    allowed.add(spaOrigin.replace('127.0.0.1', 'localhost'));
  }
  return allowed;
}

export function validateOrigin(request: FastifyRequest, env: Env): void {
  const origin = request.headers.origin;
  if (!origin || !allowedSpaOrigins(env.SPA_ORIGIN).has(origin)) {
    throw new AppError(403, 'FORBIDDEN', 'Origin invalida');
  }
}

export function validateCsrf(request: FastifyRequest): void {
  const cookie = request.cookies[CSRF_COOKIE];
  const header = request.headers[CSRF_HEADER];
  if (!cookie || typeof header !== 'string' || !safeEqual(cookie, header)) {
    throw new AppError(403, 'FORBIDDEN', 'CSRF token invalido');
  }
}

export function usesCookieAuth(request: FastifyRequest): boolean {
  return Boolean(request.cookies.fm_access) || Boolean(request.cookies.fm_refresh);
}
