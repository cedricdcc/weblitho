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
    // Create and run Docker container for building
    // Note: rw mount is required as npm ci creates node_modules and npm run build creates dist
    const container = await docker.createContainer({
      Image: "node:22-alpine",
      Cmd: ["sh", "-c", "npm ci && npm run build"],
      WorkingDir: "/app",
      HostConfig: {
        Binds: [`${projectPath}:/app:rw`],
        AutoRemove: true,
      },
    });

    await container.start();
    
    // Wait for container to finish
    const result = await container.wait();
    
    if (result.StatusCode !== 0) {
      console.error(`Build failed for project ${projectId} with status ${result.StatusCode}`);
      return res.status(500).json({ 
        error: "Build failed", 
        exitCode: result.StatusCode 
      });
    }

    // Verify dist directory was created
    const distPath = path.join(projectPath, "dist");
    if (!fs.existsSync(distPath)) {
      return res.status(500).json({ error: "Build completed but dist directory not found" });
    }

    const previewUrl = `/preview/${projectId}`;
    
    console.log(`Build completed for project: ${projectId}`);
    
    res.json({
      previewUrl,
      message: "Build finished — preview ready",
      projectId,
    });
  } catch (err) {
    console.error(`Build error for project ${projectId}:`, err);
    res.status(500).json({ error: err.message });
  }
});

// Get build status endpoint
app.get("/api/preview/status/:projectId", apiLimiter, (req, res) => {
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

  if (fs.existsSync(distPath)) {
    return res.json({ 
      status: "ready", 
      projectId,
      previewUrl: `/preview/${projectId}`
    });
  }

  res.json({ status: "pending", projectId });
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

app.listen(PORT, () => {
  console.log(`Weblitho Preview Server running on port ${PORT}`);
  console.log(`Projects directory: ${PROJECTS_DIR}`);
});
