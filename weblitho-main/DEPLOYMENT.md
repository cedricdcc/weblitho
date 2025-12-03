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

- The backend container has access to the Docker socket (read-only)
- Project IDs are validated to prevent path traversal
- Preview files are served with `X-Robots-Tag: noindex`
- No open ports except via Cloudflare Tunnel

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
