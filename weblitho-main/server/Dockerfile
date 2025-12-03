FROM node:22-alpine

WORKDIR /app

# Install docker CLI for interacting with Docker daemon
RUN apk add --no-cache docker-cli

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --omit=dev

# Copy server source code
COPY index.js ./

# Create projects directory
RUN mkdir -p /projects

# Expose port
EXPOSE 8080

# Start the server
CMD ["node", "index.js"]
