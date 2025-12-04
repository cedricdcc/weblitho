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

# Create directory for projects (if your app needs it)
RUN mkdir -p /projects

EXPOSE 8080

# Run as non-root user (security best practice)
RUN addgroup -g 1001 nodejs
RUN adduser -S -u 1001 nodejs
USER nodejs

CMD ["node", "index.js"]