FROM node:22-alpine AS base
WORKDIR /app
RUN apk add --no-cache openssl

FROM base AS deps
COPY backend/package.json backend/package-lock.json* ./
RUN npm ci 2>/dev/null || npm install

FROM deps AS build
COPY backend/ ./
COPY seed/ /app/seed/
RUN npx prisma generate && npm run build

FROM deps AS setup
COPY backend/ ./
COPY seed/ /app/seed/
RUN npx prisma generate
CMD ["sh", "-c", "npx prisma migrate deploy && npx tsx prisma/seed.ts"]

FROM node:22-alpine AS runtime
WORKDIR /app
RUN apk add --no-cache openssl wget
ENV NODE_ENV=production
COPY --from=build /app/dist ./dist
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/package.json ./
COPY --from=build /app/prisma ./prisma
USER node
EXPOSE 3001
CMD ["node", "dist/src/server.js"]
