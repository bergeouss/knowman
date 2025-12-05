FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY packages/dashboard/package.json ./packages/dashboard/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN bun install --frozen-lockfile

# Copy source code
COPY packages/dashboard ./packages/dashboard
COPY packages/types ./packages/types

# Build dashboard
WORKDIR /app/packages/dashboard
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/dashboard/.next ./.next
COPY --from=base /app/packages/dashboard/package.json ./package.json
COPY --from=base /app/packages/dashboard/public ./public

# Expose port
EXPOSE 3000

# Start the application
CMD ["bun", "start"]

# Development stage
FROM base AS development

WORKDIR /app/packages/dashboard

# Expose port
EXPOSE 3000

# Start development server
CMD ["bun", "dev"]