# Use Node.js 20 LTS
FROM node:20-alpine AS base

# Install dependencies only when needed
FROM base AS deps
RUN apk add --no-cache openssl
WORKDIR /app

# Copy package files and Prisma schema
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies without running postinstall scripts
RUN npm ci --ignore-scripts

# Install Prisma CLI globally with specific version
RUN npm install -g prisma@6.19.2

RUN npx prisma generate

# Build the application
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/prisma ./prisma
COPY . .

# Build Next.js
RUN npm run build

# Production image
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000

# Create non-root user
RUN addgroup --system --gid 1001 nodejs
RUN adduser --system --uid 1001 nextjs

# Copy necessary files
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

# Copy ALL node_modules to ensure all Prisma dependencies are available
COPY --from=builder /app/node_modules ./node_modules

# Copy prisma schema
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/package.json ./package.json

# Set permissions
RUN chown -R nextjs:nodejs /app

USER nextjs

EXPOSE 3000

ENV HOSTNAME="0.0.0.0"

# Use global Prisma CLI (installed in deps stage and available via PATH)
CMD ["sh", "-c", "prisma migrate deploy && node server.js"]
