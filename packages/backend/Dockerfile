FROM oven/bun:1 AS base

WORKDIR /app

# Copy package files
COPY package.json bun.lock ./
COPY tsconfig.base.json ./
COPY packages/backend/package.json ./packages/backend/
COPY packages/types/package.json ./packages/types/

# Install dependencies
RUN bun install

# Copy source code
COPY packages/backend ./packages/backend
COPY packages/types ./packages/types

# Build backend
WORKDIR /app/packages/backend
RUN bun run build

# Production stage
FROM oven/bun:1-slim AS production

WORKDIR /app

# Copy built artifacts and dependencies
COPY --from=base /app/node_modules ./node_modules
COPY --from=base /app/packages/backend/dist ./dist
COPY --from=base /app/packages/backend/package.json ./package.json
COPY --from=base /app/packages/backend/.env.example ./.env.example

# Create data directory for SQLite
RUN mkdir -p ./data

# Expose port
EXPOSE 3001

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost:3001/health || exit 1

# Start the application
CMD ["bun", "start"]

# Development stage
FROM base AS development

WORKDIR /app/packages/backend

# Expose port
EXPOSE 3001

# Start development server with watch mode
CMD ["bun", "dev"]