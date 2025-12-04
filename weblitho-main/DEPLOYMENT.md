# Weblitho Docker Deployment

This document describes the production-grade Docker deployment architecture for Weblitho.

## Architecture Overview

```
User → https://your-domain.com ← Cloudflare Tunnel (HTTPS)
                              ↓ (proxies to localhost:80)
         Nginx (webapp container)
              ↙        ↘
    Frontend (/)    API (/api/) → Backend container (port 8080)
              ↘        ↙
         Preview (/preview/:projectId) → Static files from /projects/:projectId/dist
                            ↑
         Docker container (one-time) → npm run build → creates /projects/:projectId/dist
```

## Services

### 1. Webapp (Nginx)
- Serves the React SPA (built frontend)
- Proxies API requests to the backend
- Serves built project previews as static files
- Runs on port 80

### 2. Backend (Node.js Express)
- Handles preview build requests
- Uses Docker-in-Docker to build projects
- Exposes `/api/preview/build` endpoint
- Runs on port 8080 (internal)

## Quick Start

### Prerequisites
- Docker and Docker Compose installed
- (Optional) Cloudflare Tunnel for HTTPS

### Deployment

```bash
# Clone the repository
git clone <repository-url>
cd weblitho-main

# Build and start all services
docker compose up -d --build

# View logs
docker compose logs -f

# Stop services
docker compose down
```

## API Endpoints

### Build Preview
```bash
curl -X POST http://localhost/api/preview/build \
     -H "Content-Type: application/json" \
     -d '{"projectId":"my-project"}'
```

Response:
```json
{
  "previewUrl": "/preview/my-project",
  "message": "Build finished — preview ready",
  "projectId": "my-project"
}
```

### Deploy Project Files
Deploy project files from the frontend to the server. Supports both full project files (for npm build) and static HTML previews.

```bash
curl -X POST http://localhost/api/preview/deploy \
     -H "Content-Type: application/json" \
     -d '{
       "projectId": "my-project",
       "files": [
         {"path": "src/App.tsx", "content": "..."},
         {"path": "package.json", "content": "..."}
       ],
       "preview": "<!DOCTYPE html>..."
     }'
```

Response:
```json
{
  "previewUrl": "/preview/my-project",
  "message": "Project deployed — ready for build",
  "projectId": "my-project",
  "needsBuild": true
}
```

If only `preview` is provided (no `files`), the HTML is saved directly to the dist folder:
```json
{
  "previewUrl": "/preview/my-project",
  "message": "Static preview deployed — ready to view",
  "projectId": "my-project",
  "needsBuild": false
}
```

### Check Build Status
```bash
curl http://localhost/api/preview/status/my-project
```

Response:
```json
{
  "status": "ready",
  "projectId": "my-project",
  "previewUrl": "/preview/my-project"
}
```

### List All Projects
```bash
curl http://localhost/api/preview/list
```

Response:
```json
{
  "projects": [
    {
      "projectId": "my-project",
      "hasPreview": true,
      "previewUrl": "/preview/my-project"
    }
  ]
}
```

### Health Check
```bash
curl http://localhost/api/health
```

## Cloudflare Tunnel Setup

1. Install cloudflared:
```bash
# Debian/Ubuntu
curl -L --output cloudflared.deb https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64.deb
sudo dpkg -i cloudflared.deb
```

2. Authenticate:
```bash
cloudflared tunnel login
```

3. Create a tunnel:
```bash
cloudflared tunnel create weblitho
```

4. Configure the tunnel (~/.cloudflared/config.yml):
```yaml
tunnel: <tunnel-id>
credentials-file: /root/.cloudflared/<tunnel-id>.json
ingress:
  - hostname: your-domain.com
    service: http://localhost:80
  - service: http_status:404
```

5. Start the tunnel:
```bash
cloudflared tunnel run weblitho
```

## Adding Projects for Preview

Projects must be placed in the `/projects` volume with this structure:

```
/projects/
├── project-id-1/
│   ├── package.json
│   ├── src/
│   └── ... (project files)
├── project-id-2/
│   ├── package.json
│   └── ...
```

After calling `/api/preview/build`, the `dist/` folder will be created:

```
/projects/project-id-1/
├── package.json
├── src/
├── dist/           # ← Created by build
│   ├── index.html
│   └── assets/
```

## Environment Variables

### Backend Service
| Variable | Default | Description |
|----------|---------|-------------|
| PORT | 8080 | Server port |
| PROJECTS_DIR | /projects | Path to projects directory |

## Security Considerations

### Docker Socket Access
The backend container has read-only access to the Docker socket (`/var/run/docker.sock:ro`) which is required to spawn build containers. This provides significant access to the Docker daemon. Security recommendations:

- Run in a trusted network environment
- Consider using rootless Docker if available
- For higher security environments, consider alternatives like:
  - Kaniko for rootless container builds
  - A dedicated CI/CD system (GitHub Actions, GitLab CI)
  - BuildKit with a remote builder

### Backend Container Permissions
The backend container runs as root to ensure:
- Write access to the `/projects` Docker volume
- Access to the Docker socket for spawning build containers

The container is isolated by Docker's sandboxing, and security is maintained through:
- Read-only Docker socket access
- Strict project ID validation
- Rate limiting on API endpoints

### Project ID Validation
- Project IDs are validated to contain only alphanumeric characters, hyphens, and underscores
- Path traversal patterns (`.`, `/`, `\`) are explicitly blocked
- Preview files are served with `X-Robots-Tag: noindex` to prevent search engine indexing

### Network Security
- No open ports except via Cloudflare Tunnel (recommended)
- Internal Docker network for service-to-service communication
- API endpoints only accessible through the nginx proxy

## Troubleshooting

### Build fails
```bash
# Check backend logs
docker compose logs backend

# Ensure Docker socket is accessible
docker compose exec backend docker ps
```

### Preview not loading
```bash
# Check if dist exists
docker compose exec webapp ls /projects/<project-id>/dist

# Check nginx logs
docker compose logs webapp
```
