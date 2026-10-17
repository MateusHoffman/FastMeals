import type { FastifyInstance, FastifyReply } from 'fastify';
import type { Env } from '../../config/env.js';
import {
  loginWithPassword,
  refreshTokens,
  getUserById,
  verifyToken,
} from './auth.service.js';
import {
  loginBodySchema,
  refreshBodySchema,
} from '../../shared/validation/index.js';
import {
  getAccessCookieName,
  getRefreshCookieName,
} from '../../shared/middlewares/auth.js';
import {
  CSRF_COOKIE,
  CSRF_HEADER,
  generateCsrfToken,
  validateCsrf,
  validateOrigin,
} from '../../shared/middlewares/csrf.js';
import { AppError } from '../../shared/errors/app-error.js';

function cookieOpts(env: Env, maxAgeSec: number, path = '/api') {
  return {
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: env.COOKIE_SECURE,
    path,
    maxAge: maxAgeSec,
  };
}

const ACCESS_MAX = 15 * 60;
const REFRESH_MAX = 7 * 24 * 60 * 60;

function setSessionCookies(
  reply: FastifyReply,
  env: Env,
  accessToken: string,
  refreshToken: string,
  csrf: string,
) {
  reply.setCookie(getAccessCookieName(), accessToken, cookieOpts(env, ACCESS_MAX));
  reply.setCookie(
    getRefreshCookieName(),
    refreshToken,
    cookieOpts(env, REFRESH_MAX, '/api/auth/session'),
  );
  reply.setCookie(CSRF_COOKIE, csrf, {
    httpOnly: false,
    sameSite: 'lax',
    secure: env.COOKIE_SECURE,
    path: '/',
    maxAge: REFRESH_MAX,
  });
}

function clearSessionCookies(reply: FastifyReply) {
  reply.clearCookie(getAccessCookieName(), { path: '/api' });
  reply.clearCookie(getRefreshCookieName(), { path: '/api/auth/session' });
  reply.clearCookie(CSRF_COOKIE, { path: '/' });
}

export async function registerAuthRoutes(
  app: FastifyInstance,
  env: Env,
): Promise<void> {
  app.post(
    '/auth/login',
    {
      schema: { body: loginBodySchema },
    },
    async (request) => {
      const body = loginBodySchema.parse(request.body);
      return loginWithPassword(body.email, body.password, env);
    },
  );

  app.post(
    '/auth/refresh',
    {
      schema: { body: refreshBodySchema },
    },
    async (request) => {
      const body = refreshBodySchema.parse(request.body);
      return refreshTokens(body.refreshToken, env);
    },
  );

  app.post('/auth/session', async (request, reply) => {
    validateOrigin(request, env);
    const body = loginBodySchema.parse(request.body);
    const result = await loginWithPassword(body.email, body.password, env);
    const csrf = generateCsrfToken();
    setSessionCookies(reply, env, result.accessToken, result.refreshToken, csrf);
    return { user: result.user };
  });

  app.post('/auth/session/refresh', async (request, reply) => {
    validateOrigin(request, env);
    validateCsrf(request);
    const refresh = request.cookies[getRefreshCookieName()];
    if (!refresh) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Refresh ausente');
    }
    const tokens = await refreshTokens(refresh, env);
    const payload = verifyToken(tokens.accessToken, env.JWT_SECRET, 'access');
    const user = await getUserById(payload.sub);
    if (!user) {
      throw new AppError(401, 'INVALID_REFRESH_TOKEN', 'Usuario invalido');
    }
    const csrf = request.cookies[CSRF_COOKIE] ?? generateCsrfToken();
    setSessionCookies(reply, env, tokens.accessToken, tokens.refreshToken, csrf);
    return { user };
  });

  app.get('/auth/session', async (request) => {
    const access = request.cookies[getAccessCookieName()];
    if (!access) {
      throw new AppError(401, 'INVALID_TOKEN', 'Sessao invalida');
    }
    const payload = verifyToken(access, env.JWT_SECRET, 'access');
    const user = await getUserById(payload.sub);
    if (!user) {
      throw new AppError(401, 'INVALID_TOKEN', 'Sessao invalida');
    }
    return { user };
  });

  app.delete('/auth/session', async (request, reply) => {
    validateOrigin(request, env);
    validateCsrf(request);
    clearSessionCookies(reply);
    return reply.status(204).send();
  });
}

void CSRF_HEADER;
