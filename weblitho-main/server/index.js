import express from "express";
import cors from "cors";
import Docker from "dockerode";
import fs from "fs";
import path from "path";
import rateLimit from "express-rate-limit";

const app = express();
const docker = new Docker();
const PORT = process.env.PORT || 8080;
const PROJECTS_DIR = process.env.PROJECTS_DIR || "/projects";

// Trust proxy (nginx) - required for rate limiting behind reverse proxy
app.set('trust proxy', 1);

app.use(cors());
app.use(express.json());

// Rate limiting for API endpoints
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Stricter rate limiting for build endpoint (resource intensive)
const buildLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 5, // limit each IP to 5 builds per minute
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many build requests, please try again later." }
});

// Health check endpoint (no rate limiting)
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Build preview endpoint - builds a project and returns preview URL
app.post("/api/preview/build", buildLimiter, async (req, res) => {
  const { projectId } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  // Validate projectId format (alphanumeric, hyphens, underscores only)
  // This validation prevents path traversal attacks (no dots, slashes, etc.)
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    return res.status(400).json({ error: "Invalid projectId format" });
  }

  // Additional security: ensure projectId doesn't contain path traversal patterns
  if (projectId.includes('..') || projectId.includes('/') || projectId.includes('\\')) {
    return res.status(400).json({ error: "Invalid projectId format" });
  }

  const projectPath = path.join(PROJECTS_DIR, projectId);

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ error: "Project not found" });
  }

  // Check if package.json exists
  const packageJsonPath = path.join(projectPath, "package.json");
  if (!fs.existsSync(packageJsonPath)) {
    return res.status(400).json({ error: "No package.json found in project" });
  }

  console.log(`Starting build for project: ${projectId}`);

  try {
    const imageName = "node:22-alpine";
    
    // Check if image exists, if not pull it
    try {
      await docker.getImage(imageName).inspect();
      console.log(`Image ${imageName} already exists`);
    } catch (imageErr) {
      console.log(`Image ${imageName} not found, pulling...`);
      await new Promise((resolve, reject) => {
        docker.pull(imageName, (err, stream) => {
          if (err) return reject(err);
          docker.modem.followProgress(stream, (err, output) => {
            if (err) return reject(err);
            console.log(`Image ${imageName} pulled successfully`);
            resolve(output);
          });
        });
      });
    }
    
    // Get the Docker volume name - docker-compose prefixes with directory name
    // The volume is mounted at /projects in the backend container
    // We need to find the actual volume name to mount in the build container
    const volumeName = process.env.PROJECTS_VOLUME || 'weblitho-main_projects';
    
    // Create Docker container for building (don't auto-remove so we can get logs)
    // Note: rw mount is required as npm install creates node_modules and npm run build creates dist
    // Using npm install instead of npm ci since we generate package.json dynamically (no lockfile)
    // We mount the entire projects volume and use the subdirectory as workdir
    const container = await docker.createContainer({
      Image: imageName,
      Cmd: ["sh", "-c", "npm install 2>&1 && npm run build 2>&1"],
      WorkingDir: `/projects/${projectId}`,
      HostConfig: {
        Binds: [`${volumeName}:/projects:rw`],
        AutoRemove: false,  // Keep container to get logs on failure
      },
      Tty: true,
    });

    await container.start();
    
    // Wait for container to finish
    const result = await container.wait();
    
    // Get container logs
    const logStream = await container.logs({
      stdout: true,
      stderr: true,
      follow: false,
    });
    const logs = logStream.toString('utf8');
    
    // Clean up container
    try {
      await container.remove();
    } catch (removeErr) {
      console.log('Container already removed or error removing:', removeErr.message);
    }
    
    if (result.StatusCode !== 0) {
      console.error(`Build failed for project ${projectId} with status ${result.StatusCode}`);
      console.error(`Build logs:\n${logs}`);
      return res.status(500).json({ 
        error: "Build failed", 
        exitCode: result.StatusCode,
        logs: logs.slice(-2000)  // Return last 2000 chars of logs
      });
    }

    // Verify dist directory was created
    const distPath = path.join(projectPath, "dist");
    if (!fs.existsSync(distPath)) {
      console.error(`Build logs:\n${logs}`);
      return res.status(500).json({ 
        error: "Build completed but dist directory not found",
        logs: logs.slice(-2000)
      });
    }

    const previewUrl = `/preview/${projectId}`;
    
    console.log(`Build completed for project: ${projectId}`);
    
    // Start a persistent preview server container
    // First, stop any existing preview container for this project
    const containerName = `weblitho-preview-${projectId}`;
    try {
      const existingContainer = docker.getContainer(containerName);
      await existingContainer.stop().catch(() => {});
      await existingContainer.remove().catch(() => {});
      console.log(`Removed existing preview container: ${containerName}`);
    } catch (e) {
      // Container doesn't exist, that's fine
    }
    
    // Find a random available port (between 3000-4000)
    const previewPort = 3000 + Math.floor(Math.random() * 1000);
    
    // Create and start persistent preview container
    const previewContainer = await docker.createContainer({
      Image: imageName,
      name: containerName,
      Cmd: ["sh", "-c", "npm run preview -- --host 0.0.0.0 --port 4173"],
      WorkingDir: `/projects/${projectId}`,
      ExposedPorts: {
        "4173/tcp": {}
      },
      HostConfig: {
        Binds: [`${volumeName}:/projects:rw`],
        PortBindings: {
          "4173/tcp": [{ HostPort: String(previewPort) }]
        },
        AutoRemove: false,
        RestartPolicy: { Name: "unless-stopped" }
      },
      Tty: true,
    });
    
    await previewContainer.start();
    console.log(`Preview server started for project ${projectId} on port ${previewPort}`);
    
    // Give the server a moment to start
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    res.json({
      previewUrl,
      devServerUrl: `http://localhost:${previewPort}`,
      devServerPort: previewPort,
      containerName,
      message: "Build finished — preview server running",
      projectId,
    });
  } catch (err) {
    console.error(`Build error for project ${projectId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Get build status endpoint
app.get("/api/preview/status/:projectId", apiLimiter, async (req, res) => {
  const { projectId } = req.params;

  // Validate projectId format
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    return res.status(400).json({ error: "Invalid projectId format" });
  }

  const projectPath = path.join(PROJECTS_DIR, projectId);
  const distPath = path.join(projectPath, "dist");

  if (!fs.existsSync(projectPath)) {
    return res.status(404).json({ status: "not_found", projectId });
  }

  // Check if there's a running preview container
  let devServerInfo = null;
  const containerName = `weblitho-preview-${projectId}`;
  try {
    const container = docker.getContainer(containerName);
    const info = await container.inspect();
    if (info.State.Running) {
      const portBindings = info.NetworkSettings.Ports["4173/tcp"];
      if (portBindings && portBindings.length > 0) {
        devServerInfo = {
          running: true,
          port: parseInt(portBindings[0].HostPort),
          containerName
        };
      }
    }
  } catch (e) {
    // Container doesn't exist
  }

  if (fs.existsSync(distPath)) {
    return res.json({ 
      status: "ready", 
      projectId,
      previewUrl: `/preview/${projectId}`,
      devServer: devServerInfo
    });
  }

  res.json({ status: "pending", projectId, devServer: devServerInfo });
});

// Stop preview server endpoint
app.post("/api/preview/stop/:projectId", apiLimiter, async (req, res) => {
  const { projectId } = req.params;

  // Validate projectId format
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    return res.status(400).json({ error: "Invalid projectId format" });
  }

  const containerName = `weblitho-preview-${projectId}`;
  try {
    const container = docker.getContainer(containerName);
    await container.stop();
    await container.remove();
    console.log(`Stopped and removed preview container: ${containerName}`);
    res.json({ message: "Preview server stopped", projectId });
  } catch (err) {
    if (err.statusCode === 404) {
      return res.status(404).json({ error: "Preview server not found", projectId });
    }
    console.error(`Error stopping preview server for ${projectId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// List all projects with preview status
app.get("/api/preview/list", apiLimiter, (req, res) => {
  if (!fs.existsSync(PROJECTS_DIR)) {
    return res.json({ projects: [] });
  }

  const projects = fs.readdirSync(PROJECTS_DIR, { withFileTypes: true })
    .filter(dirent => dirent.isDirectory())
    .map(dirent => {
      const distPath = path.join(PROJECTS_DIR, dirent.name, "dist");
      return {
        projectId: dirent.name,
        hasPreview: fs.existsSync(distPath),
        previewUrl: fs.existsSync(distPath) ? `/preview/${dirent.name}` : null
      };
    });

  res.json({ projects });
});

// Deploy project endpoint - receives project files from frontend and writes to disk
app.post("/api/preview/deploy", apiLimiter, async (req, res) => {
  const { projectId, files, preview } = req.body;

  if (!projectId) {
    return res.status(400).json({ error: "projectId is required" });
  }

  // Validate projectId format (alphanumeric, hyphens, underscores only)
  // This regex already excludes dots, slashes, and backslashes
  if (!/^[a-zA-Z0-9_-]+$/.test(projectId)) {
    return res.status(400).json({ error: "Invalid projectId format" });
  }

  const projectPath = path.join(PROJECTS_DIR, projectId);

  console.log(`Deploying project: ${projectId}`);

  try {
    // Create project directory if it doesn't exist
    if (!fs.existsSync(projectPath)) {
      fs.mkdirSync(projectPath, { recursive: true });
    }

    console.log(`Creating Vite project for: ${projectId}`);
    
    // Always create a complete, buildable Vite React project
    // This ensures the project can be built regardless of what files are sent
    
    // 1. Create package.json
    const packageJson = {
      name: `weblitho-${projectId}`,
      private: true,
      version: "0.0.1",
      type: "module",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        react: "^18.3.1",
        "react-dom": "^18.3.1"
      },
      devDependencies: {
        "@types/react": "^18.3.3",
        "@types/react-dom": "^18.3.0",
        "@vitejs/plugin-react": "^4.3.4",
        vite: "^6.0.0"
      }
    };
    fs.writeFileSync(
      path.join(projectPath, 'package.json'),
      JSON.stringify(packageJson, null, 2),
      'utf8'
    );
    
    // 2. Create vite.config.js
    const viteConfig = `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})
`;
    fs.writeFileSync(
      path.join(projectPath, 'vite.config.js'),
      viteConfig,
      'utf8'
    );
    
    // 3. Create src directory
    const srcPath = path.join(projectPath, 'src');
    if (!fs.existsSync(srcPath)) {
      fs.mkdirSync(srcPath, { recursive: true });
    }
    
    // 4. Create index.html
    // Extract styles from preview if available
    let headStyles = '';
    if (preview) {
      const styleMatches = preview.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/gi);
      for (const match of styleMatches) {
        headStyles += `<style>${match[1]}</style>\n    `;
      }
    }
    
    const indexHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Weblitho Preview</title>
    <script src="https://cdn.tailwindcss.com"></script>
    ${headStyles}
  </head>
  <body>
    <div id="root"></div>
    <script type="module" src="/src/main.jsx"></script>
  </body>
</html>
`;
    fs.writeFileSync(path.join(projectPath, 'index.html'), indexHtml, 'utf8');
    
    // 5. Create main.jsx
    const mainJsx = `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.jsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)
`;
    fs.writeFileSync(path.join(srcPath, 'main.jsx'), mainJsx, 'utf8');
    
    // 6. Create App.jsx - render the preview HTML content
    let appContent = '';
    
    if (preview) {
      // Extract body content from the preview HTML
      let bodyContent = preview;
      const bodyMatch = preview.match(/<body[^>]*>([\s\S]*?)<\/body>/i);
      if (bodyMatch) {
        bodyContent = bodyMatch[1];
      }
      
      // Clean up the body content - remove script tags that load modules
      bodyContent = bodyContent.replace(/<script[^>]*type="module"[^>]*>[\s\S]*?<\/script>/gi, '');
      bodyContent = bodyContent.replace(/<script[^>]*src="[^"]*"[^>]*>[\s\S]*?<\/script>/gi, '');
      
      // Escape backticks and dollar signs for template literal
      const escapedBody = bodyContent
        .replace(/\\/g, '\\\\')
        .replace(/`/g, '\\`')
        .replace(/\$/g, '\\$');
      
      appContent = `function App() {
  return (
    <div dangerouslySetInnerHTML={{ __html: \`${escapedBody}\` }} />
  )
}`;
    } else {
      // If no preview, create a simple placeholder
      appContent = `function App() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">Weblitho Preview</h1>
        <p className="text-gray-600">Your generated content will appear here</p>
      </div>
    </div>
  )
}`;
    }
    
    const appJsx = `import React from 'react'

${appContent}

export default App
`;
    fs.writeFileSync(path.join(srcPath, 'App.jsx'), appJsx, 'utf8');
    
    // 7. Create index.css with base Tailwind directives
    const indexCss = `@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom styles */
`;
    fs.writeFileSync(path.join(srcPath, 'index.css'), indexCss, 'utf8');
    
    // 8. If we have additional component files, write them
    if (files && Array.isArray(files) && files.length > 0) {
      console.log(`Writing ${files.length} additional files for: ${projectId}`);
      
      for (const file of files) {
        if (!file.path || typeof file.content !== 'string') continue;
        
        // Validate file path to prevent path traversal
        const normalizedPath = path.normalize(file.path);
        if (normalizedPath.startsWith('..') || normalizedPath.startsWith('/')) {
          console.warn(`Skipping suspicious file path: ${file.path}`);
          continue;
        }
        
        // Skip files we've already created (package.json, vite.config, index.html, main.jsx, App.jsx)
        const baseName = path.basename(normalizedPath).toLowerCase();
        if (['package.json', 'vite.config.js', 'vite.config.ts', 'index.html'].includes(baseName)) {
          console.log(`Skipping ${file.path} - using generated version`);
          continue;
        }
        if (normalizedPath === 'src/main.jsx' || normalizedPath === 'src/main.tsx' ||
            normalizedPath === 'src/App.jsx' || normalizedPath === 'src/App.tsx') {
          console.log(`Skipping ${file.path} - using generated version`);
          continue;
        }
        
        const filePath = path.join(projectPath, normalizedPath);
        const fileDir = path.dirname(filePath);
        
        // Create directory if needed
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }
        
        fs.writeFileSync(filePath, file.content, 'utf8');
        console.log(`Wrote file: ${normalizedPath}`);
      }
    }
    
    console.log(`Vite project created for: ${projectId}, ready for build`);
    
    res.json({
      previewUrl: `/preview/${projectId}`,
      message: "Vite project created — ready for build",
      projectId,
      needsBuild: true
    });
  } catch (err) {
    console.error(`Deploy error for project ${projectId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Weblitho Preview Server running on port ${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
});
