import { useState } from "react";
import { Download, Github, Loader2, ExternalLink, Check, FolderArchive } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ProjectFile {
  path: string;
  content: string;
}

interface ExportOptionsProps {
  code: string;
  files?: ProjectFile[];
  projectName?: string;
}

export const ExportOptions = ({ code, files, projectName = "weblitho-project" }: ExportOptionsProps) => {
  const [isExporting, setIsExporting] = useState(false);
  const [showGitHubDialog, setShowGitHubDialog] = useState(false);
  const [repoName, setRepoName] = useState(projectName);
  const [isPrivate, setIsPrivate] = useState(true);
  const { toast } = useToast();

  const generateProjectFiles = () => {
    const files: { name: string; content: string }[] = [];

    // Parse components from the generated HTML
    const componentNames: string[] = [];
    const componentRegex = /const\s+(\w+)\s*=\s*\([^)]*\)\s*=>/g;
    let match;
    while ((match = componentRegex.exec(code)) !== null) {
      if (match[1][0] === match[1][0].toUpperCase() && match[1] !== "App") {
        componentNames.push(match[1]);
      }
    }

    // Main index.html
    files.push({
      name: "public/index.html",
      content: `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${projectName}</title>
</head>
<body>
  <div id="root"></div>
</body>
</html>`,
    });

    // package.json
    files.push({
      name: "package.json",
      content: JSON.stringify({
        name: projectName.toLowerCase().replace(/\s+/g, "-"),
        private: true,
        version: "0.0.0",
        type: "module",
        scripts: {
          dev: "vite",
          build: "tsc && vite build",
          preview: "vite preview",
        },
        dependencies: {
          react: "^18.2.0",
          "react-dom": "^18.2.0",
          "lucide-react": "^0.462.0",
        },
        devDependencies: {
          "@types/react": "^18.2.0",
          "@types/react-dom": "^18.2.0",
          "@vitejs/plugin-react": "^4.2.0",
          autoprefixer: "^10.4.18",
          postcss: "^8.4.35",
          tailwindcss: "^3.4.1",
          typescript: "^5.2.2",
          vite: "^5.1.0",
        },
      }, null, 2),
    });

    // tailwind.config.js
    files.push({
      name: "tailwind.config.js",
      content: `/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}`,
    });

    // postcss.config.js
    files.push({
      name: "postcss.config.js",
      content: `export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}`,
    });

    // vite.config.ts
    files.push({
      name: "vite.config.ts",
      content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
    });

    // tsconfig.json
    files.push({
      name: "tsconfig.json",
      content: JSON.stringify({
        compilerOptions: {
          target: "ES2020",
          useDefineForClassFields: true,
          lib: ["ES2020", "DOM", "DOM.Iterable"],
          module: "ESNext",
          skipLibCheck: true,
          moduleResolution: "bundler",
          allowImportingTsExtensions: true,
          resolveJsonModule: true,
          isolatedModules: true,
          noEmit: true,
          jsx: "react-jsx",
          strict: true,
          noUnusedLocals: true,
          noUnusedParameters: true,
          noFallthroughCasesInSwitch: true,
        },
        include: ["src"],
        references: [{ path: "./tsconfig.node.json" }],
      }, null, 2),
    });

    // src/index.css
    files.push({
      name: "src/index.css",
      content: `@tailwind base;
@tailwind components;
@tailwind utilities;

body {
  @apply antialiased;
}`,
    });

    // src/main.tsx
    files.push({
      name: "src/main.tsx",
      content: `import React from 'react'
import ReactDOM from 'react-dom/client'
import App from './App.tsx'
import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
)`,
    });

    // Extract and save App component
    // For simplicity, we'll save the entire generated code as the App
    files.push({
      name: "src/App.tsx",
      content: `import React, { useState, useEffect } from 'react';
import { Menu, X, ArrowRight, Check, Star, Zap, Shield, Code, Layers, Rocket } from 'lucide-react';

// Generated by QubeAI
${extractReactCode(code)}

export default App;`,
    });

    // README.md
    files.push({
      name: "README.md",
      content: `# ${projectName}

Generated with [QubeAI](https://qubeai.dev)

## Getting Started

\`\`\`bash
npm install
npm run dev
\`\`\`

## Build

\`\`\`bash
npm run build
\`\`\`
`,
    });

    return files;
  };

  const extractReactCode = (htmlCode: string): string => {
    // Extract the React code from the script tag
    const scriptMatch = htmlCode.match(/<script type="text\/babel">([\s\S]*?)<\/script>/);
    if (scriptMatch) {
      let reactCode = scriptMatch[1];
      // Remove the render call at the end
      reactCode = reactCode.replace(/const root = ReactDOM\.createRoot[\s\S]*?root\.render[\s\S]*?;/g, "");
      // Remove the destructuring of React and lucideReact
      reactCode = reactCode.replace(/const \{ useState, useEffect \} = React;/g, "");
      reactCode = reactCode.replace(/const \{[^}]+\} = lucideReact;/g, "");
      return reactCode.trim();
    }
    return "const App = () => <div>Generated content</div>;";
  };

  const handleDownloadZip = async () => {
    setIsExporting(true);
    try {
      const JSZip = (await import("jszip")).default;
      const zip = new JSZip();
      
      // Use provided Next.js files if available, otherwise generate from code
      if (files && files.length > 0) {
        files.forEach(({ path, content }) => {
          zip.file(path, content);
        });
      } else {
        const generatedFiles = generateProjectFiles();
        generatedFiles.forEach(({ name, content }) => {
          zip.file(name, content);
        });
      }

      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${projectName}.zip`;
      a.click();
      URL.revokeObjectURL(url);

      toast({
        title: "Downloaded!",
        description: files && files.length > 0 
          ? "Your Next.js project has been downloaded" 
          : "Your project has been downloaded as a ZIP file",
      });
    } catch (error) {
      console.error("Download error:", error);
      toast({
        title: "Download failed",
        description: "Failed to generate ZIP file",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleGitHubPush = async () => {
    toast({
      title: "GitHub Integration",
      description: "Connect your GitHub account in settings to push directly",
    });
    setShowGitHubDialog(false);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white/60 hover:text-white hover:bg-white/10 h-8"
            disabled={!code || isExporting}
          >
            {isExporting ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Download className="h-4 w-4 mr-2" />
            )}
            Export
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="w-56 bg-[#1a1a1a] border-white/10">
          <DropdownMenuItem 
            onClick={handleDownloadZip}
            className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <FolderArchive className="h-4 w-4 mr-2 text-orange-400" />
            Download as ZIP
          </DropdownMenuItem>
          <DropdownMenuSeparator className="bg-white/10" />
          <DropdownMenuItem 
            onClick={() => setShowGitHubDialog(true)}
            className="text-white/80 hover:text-white hover:bg-white/10 cursor-pointer"
          >
            <Github className="h-4 w-4 mr-2" />
            Push to GitHub
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={showGitHubDialog} onOpenChange={setShowGitHubDialog}>
        <DialogContent className="bg-[#1a1a1a] border-white/10">
          <DialogHeader>
            <DialogTitle className="text-white flex items-center gap-2">
              <Github className="h-5 w-5" />
              Push to GitHub
            </DialogTitle>
            <DialogDescription className="text-white/60">
              Create a new repository and push your generated code
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="repo-name" className="text-white/80">Repository name</Label>
              <Input
                id="repo-name"
                value={repoName}
                onChange={(e) => setRepoName(e.target.value)}
                className="bg-white/5 border-white/10 text-white"
              />
            </div>
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="private-repo"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="rounded border-white/20 bg-white/5"
              />
              <Label htmlFor="private-repo" className="text-white/80">Private repository</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setShowGitHubDialog(false)} className="text-white/60">
              Cancel
            </Button>
            <Button onClick={handleGitHubPush} className="bg-orange-500 hover:bg-orange-600 text-white">
              <Github className="h-4 w-4 mr-2" />
              Create & Push
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};
