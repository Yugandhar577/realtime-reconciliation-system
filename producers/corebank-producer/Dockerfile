# Multi-stage build for corebank producer
FROM node:20-alpine AS deps
WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm install --production && \
    npm cache clean --force

# Production image
FROM node:20-alpine AS runner
WORKDIR /app

# Copy dependencies from deps stage
COPY --from=deps /app/node_modules ./node_modules

# Copy application code
COPY . .

# Create non-root user and set permissions
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 producer && \
    chown -R producer:nodejs /app

# Switch to non-root user
USER producer

# Start the continuous runner
CMD ["node", "src/runner.js"]