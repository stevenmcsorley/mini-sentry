# Skylark MCP — remote Streamable-HTTP server (skylark-mcp service).
FROM node:20-alpine

WORKDIR /app

# Install deps first for layer caching.
COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# App source.
COPY tools.js index.js http.js ./

ENV PORT=3000
EXPOSE 3000

# Basic liveness — the HTTP server exposes /health.
HEALTHCHECK --interval=30s --timeout=5s --retries=3 \
  CMD wget -q --spider http://127.0.0.1:3000/health || exit 1

CMD ["node", "http.js"]
