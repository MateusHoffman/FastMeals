process.env.DATABASE_URL ??=
  'postgresql://fastmeals:fastmeals123@localhost:5433/fastmeals';
process.env.JWT_SECRET ??= 'local-dev-jwt-secret-min-32-chars-change-me!!';
process.env.JWT_REFRESH_SECRET ??=
  'local-dev-refresh-secret-min-32-change!!';
process.env.SPA_ORIGIN ??= 'http://localhost:3000';
process.env.COOKIE_SECURE ??= 'false';
process.env.TRUST_PROXY ??= 'false';
process.env.HOST ??= '127.0.0.1';
process.env.NODE_ENV ??= 'test';
