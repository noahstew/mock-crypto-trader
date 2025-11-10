# Use official Node.js LTS image
FROM node:20-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY server/package*.json ./

# Install dependencies (including devDependencies for build)
RUN npm install

# Copy source code
COPY server/ ./

# Build TypeScript
RUN npm run build

# Verify the build output
RUN ls -la dist/ && echo "Build contents:" && ls dist/

# Remove devDependencies to reduce image size
RUN npm prune --production

# Expose port (Render will override with PORT env var, default 10000)
EXPOSE 10000

# Set environment to production
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/server.js"]
