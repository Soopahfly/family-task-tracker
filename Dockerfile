# Production build with Node.js backend and SQLite

FROM node:20-alpine

WORKDIR /app

# Install build dependencies for native modules (better-sqlite3, sharp)
RUN apk add --no-cache python3 make g++

# Copy package files
COPY package*.json ./

# Install ALL dependencies (needed for build process)
RUN npm ci

# Copy source code
COPY . .

# Build the frontend (generates icons and builds Vite app)
RUN npm run build

# Remove dev dependencies after build
RUN npm prune --production

# Create data directory for SQLite database
RUN mkdir -p /app/server/data

# Expose port 80 (Node.js will serve on this port)
EXPOSE 80

# Set production environment
ENV NODE_ENV=production
ENV PORT=80

# Start the Node.js server (serves both API and static files)
CMD ["node", "server/index.js"]
