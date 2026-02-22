# ===== Stage 1: Build Frontend =====
FROM node:20-alpine AS client-build

WORKDIR /app/client
COPY client/package*.json ./
RUN npm ci --production=false
COPY client/ ./
RUN npm run build

# ===== Stage 2: Production Server =====
FROM node:20-alpine AS production

WORKDIR /app

# Install dumb-init for proper signal handling
RUN apk add --no-cache dumb-init

# Create non-root user
RUN addgroup -g 1001 -S certifygroup && \
  adduser -S certifyuser -u 1001 -G certifygroup

# Copy server package files and install production deps
COPY server/package*.json ./server/
WORKDIR /app/server
RUN npm ci --production

# Copy server source
COPY server/ ./

# Copy built frontend
COPY --from=client-build /app/client/dist /app/client/dist

# Create upload and log directories
RUN mkdir -p uploads/templates uploads/fonts uploads/signatures \
  uploads/data uploads/certificates logs && \
  chown -R certifyuser:certifygroup /app

# Switch to non-root user
USER certifyuser

# Expose port
EXPOSE 5000

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=30s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:5000/api/health || exit 1

# Set production environment
ENV NODE_ENV=production

# Start with dumb-init for proper PID 1 signal handling
ENTRYPOINT ["dumb-init", "--"]
CMD ["node", "src/server.js"]
