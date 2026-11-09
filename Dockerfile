# syntax=docker/dockerfile:1.7

FROM node:22-bookworm-slim AS base
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

FROM base AS dependencies
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm \
    npm ci --no-audit --no-fund \
      --fetch-retries=5 \
      --fetch-retry-mintimeout=20000 \
      --fetch-retry-maxtimeout=120000

FROM base AS builder

# NEXT_PUBLIC_* values are deliberately build arguments: Next.js embeds them
# in the browser bundle during `next build`. They are public configuration,
# never secrets. The real catalog secret is supplied only when the container
# runs; this fixed build-only value merely satisfies next.config validation.
ARG NEXT_PUBLIC_API_BASE_URL
ARG NEXT_PUBLIC_IMAGE_ORIGINS=""
ARG NEXT_PUBLIC_R2_ACCOUNT_ID=""
ENV NODE_ENV=production \
    NEXT_PUBLIC_API_BASE_URL=${NEXT_PUBLIC_API_BASE_URL} \
    NEXT_PUBLIC_IMAGE_ORIGINS=${NEXT_PUBLIC_IMAGE_ORIGINS} \
    NEXT_PUBLIC_R2_ACCOUNT_ID=${NEXT_PUBLIC_R2_ACCOUNT_ID} \
    CATALOG_REVALIDATION_SECRET=docker-build-only-placeholder-not-a-runtime-secret

RUN test -n "$NEXT_PUBLIC_API_BASE_URL"
COPY --from=dependencies /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:22-bookworm-slim AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0

RUN groupadd --system --gid 1001 nextjs \
    && useradd --system --uid 1001 --gid nextjs nextjs

COPY --from=builder --chown=nextjs:nextjs /app/public ./public
COPY --from=builder --chown=nextjs:nextjs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nextjs /app/.next/static ./.next/static

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD ["node", "-e", "fetch('http://127.0.0.1:3000/sign-in').then((response) => process.exit(response.ok ? 0 : 1)).catch(() => process.exit(1))"]

CMD ["node", "server.js"]
