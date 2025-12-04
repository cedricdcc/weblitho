# Use official Node.js 22 on Alpine
FROM node:22-alpine AS builder

WORKDIR /app

# Copy only the files needed to install dependencies (leverages Docker layer caching)
COPY package.json package-lock.json ./

# Install ONLY production dependencies (clean, reproducible)
RUN npm ci --omit=dev

# --------------------
# Final stage
FROM node:22-alpine

WORKDIR /app

# Install docker CLI (needed at runtime to talk to host daemon)
RUN apk add --no-cache docker-cli

# Copy node_modules and the locked-down app from builder
COPY --from=builder /app/node_modules ./node_modules
COPY . .

# Create directory for projects
RUN mkdir -p /projects

EXPOSE 8080

# Note: Running as root because we need:
# 1. Write access to /projects volume
# 2. Access to Docker socket for building projects
# The container is already isolated and sandboxed by Docker

CMD ["node", "index.js"]