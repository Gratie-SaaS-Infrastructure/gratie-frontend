FROM node:18-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

RUN apk add --no-cache git

COPY package.json package.json
COPY yarn.lock yarn.lock

RUN  yarn install

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED 1

RUN yarn build

FROM node:18-alpine AS runner
WORKDIR /app

ENV NODE_ENV production
ENV NEXT_TELEMETRY_DISABLED 1

RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json
COPY --from=builder /app/public/ ./public

USER nextjs

EXPOSE 3000

ENV PORT 3000

CMD ["yarn", "start"]