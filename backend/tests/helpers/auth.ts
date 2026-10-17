import type { FastifyInstance } from 'fastify';

export async function loginAs(
  app: FastifyInstance,
  email: string,
  password: string,
): Promise<string> {
  const res = await app.inject({
    method: 'POST',
    url: '/api/auth/login',
    payload: { email, password },
  });
  if (res.statusCode !== 200) {
    throw new Error(`login failed: ${res.body}`);
  }
  return (res.json() as { accessToken: string }).accessToken;
}

export async function adminToken(app: FastifyInstance): Promise<string> {
  return loginAs(app, 'admin@fastmeals.com', 'Admin@123');
}

export async function viewerToken(app: FastifyInstance): Promise<string> {
  return loginAs(app, 'viewer@fastmeals.com', 'Viewer@123');
}
