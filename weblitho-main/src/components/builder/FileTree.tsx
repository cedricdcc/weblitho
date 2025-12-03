import { useState, useMemo } from "react";
import { ChevronRight, ChevronDown, FileCode, FileText, Folder, FolderOpen, Code2, Braces, FileJson, FileType } from "lucide-react";
import { cn } from "@/lib/utils";
import { ScrollArea } from "@/components/ui/scroll-area";

interface ExtractedFile {
  name: string;
  type: "file" | "folder";
  language: string;
  content?: string;
  children?: ExtractedFile[];
  lines?: number;
}

interface ProjectFile {
  path: string;
  content: string;
}

interface FileTreeProps {
  code: string;
  files?: ProjectFile[];
  onFileSelect?: (fileName: string, content: string) => void;
}

const getFileIcon = (name: string) => {
  if (name.endsWith(".tsx") || name.endsWith(".jsx")) return <Code2 className="h-4 w-4 text-cyan-400" />;
  if (name.endsWith(".ts") || name.endsWith(".js")) return <Braces className="h-4 w-4 text-amber-400" />;
  if (name.endsWith(".css") || name.endsWith(".scss")) return <FileCode className="h-4 w-4 text-pink-400" />;
  if (name.endsWith(".html")) return <FileCode className="h-4 w-4 text-orange-400" />;
  if (name.endsWith(".json")) return <FileJson className="h-4 w-4 text-emerald-400" />;
  if (name.endsWith(".svg")) return <FileType className="h-4 w-4 text-violet-400" />;
  return <FileText className="h-4 w-4 text-muted-foreground" />;
};

// Extract real components and code sections from generated HTML
const extractCodeStructure = (code: string): ExtractedFile[] => {
  const files: ExtractedFile[] = [];
  
  if (!code || code.trim() === "") {
    return files;
  }

  // Main HTML file
  const htmlLines = code.split("\n").length;
  files.push({
    name: "src",
    type: "folder",
    language: "",
    children: []
  });

  const srcFolder = files[0];
  
  // Extract React components from the code
  const componentMatches: { name: string; code: string; startLine: number; endLine: number }[] = [];
  
  // Match function components: function ComponentName() { ... } or const ComponentName = () => { ... }
  const functionRegex = /(?:function\s+([A-Z][a-zA-Z0-9]*)\s*\([^)]*\)\s*\{|const\s+([A-Z][a-zA-Z0-9]*)\s*=\s*(?:\([^)]*\)|[^=]*)\s*=>\s*(?:\{|\())/g;
  
  let match;
  const componentNames: string[] = [];
  
  while ((match = functionRegex.exec(code)) !== null) {
    const name = match[1] || match[2];
    if (name && !componentNames.includes(name)) {
      componentNames.push(name);
    }
  }

  // Create components folder if we found components
  if (componentNames.length > 0) {
    const componentsFolder: ExtractedFile = {
      name: "components",
      type: "folder",
      language: "",
      children: []
    };

    componentNames.forEach(name => {
      if (name !== "App" && name !== "Root") {
        // Extract component code (simplified)
        const componentRegex = new RegExp(
          `(?:function\\s+${name}|const\\s+${name}\\s*=)[^]*?(?=(?:function\\s+[A-Z]|const\\s+[A-Z][a-zA-Z]*\\s*=\\s*(?:\\(|[^=]*=>))|ReactDOM|$)`,
          "s"
        );
        const componentMatch = code.match(componentRegex);
        const componentCode = componentMatch ? componentMatch[0].trim() : `// ${name} component`;
        
        componentsFolder.children?.push({
          name: `${name}.tsx`,
          type: "file",
          language: "typescript",
          content: componentCode,
          lines: componentCode.split("\n").length
        });
      }
    });

    if (componentsFolder.children && componentsFolder.children.length > 0) {
      srcFolder.children?.push(componentsFolder);
    }
  }

  // Extract styles from the code
  const styleMatch = code.match(/<style[^>]*>([\s\S]*?)<\/style>/i);
  if (styleMatch) {
    srcFolder.children?.push({
      name: "styles.css",
      type: "file",
      language: "css",
      content: styleMatch[1].trim(),
      lines: styleMatch[1].split("\n").length
    });
  }

  // Extract main App component or root
  const appMatch = code.match(/(?:function\s+App|const\s+App\s*=)[^]*?(?=ReactDOM|$)/s);
  srcFolder.children?.push({
    name: "App.tsx",
    type: "file",
    language: "typescript",
    content: appMatch ? appMatch[0].trim() : "// Main App component",
    lines: appMatch ? appMatch[0].split("\n").length : 1
  });

  // Add index file
  srcFolder.children?.push({
    name: "index.tsx",
    type: "file",
    language: "typescript",
    content: `import React from 'react';\nimport ReactDOM from 'react-dom/client';\nimport App from './App';\nimport './styles.css';\n\nReactDOM.createRoot(document.getElementById('root')!).render(\n  <React.StrictMode>\n    <App />\n  </React.StrictMode>\n);`,
    lines: 10
  });

  // Add public folder with HTML
  files.push({
    name: "public",
    type: "folder",
    language: "",
    children: [
      { 
        name: "index.html", 
        type: "file", 
        language: "html",
        content: code,
        lines: htmlLines
      },
    ]
  });

  // Add config files
  files.push({ 
    name: "package.json", 
    type: "file", 
    language: "json",
    content: JSON.stringify({
      name: "weblitho-project",
      version: "1.0.0",
      scripts: {
        dev: "vite",
        build: "vite build",
        preview: "vite preview"
      },
      dependencies: {
        "react": "^18.2.0",
        "react-dom": "^18.2.0"
      },
      devDependencies: {
        "@types/react": "^18.2.0",
        "@vitejs/plugin-react": "^4.0.0",
        "tailwindcss": "^3.3.0",
        "typescript": "^5.0.0",
        "vite": "^5.0.0"
      }
    }, null, 2),
    lines: 20
  });

  files.push({ 
    name: "tailwind.config.js", 
    type: "file", 
    language: "javascript",
    content: `/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: { extend: {} },
  plugins: [],
}`,
    lines: 6
  });

  files.push({ 
    name: "vite.config.ts", 
    type: "file", 
    language: "typescript",
    content: `import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
})`,
    lines: 6
  });

  files.push({ 
    name: "tsconfig.json", 
    type: "file", 
    language: "json",
    content: JSON.stringify({
      compilerOptions: {
        target: "ES2020",
        jsx: "react-jsx",
        module: "ESNext",
        moduleResolution: "bundler",
        strict: true
      }
    }, null, 2),
    lines: 10
  });

  return files;
};

// Convert ProjectFile[] to tree structure
const convertProjectFilesToTree = (files: ProjectFile[]): ExtractedFile[] => {
  const root: ExtractedFile[] = [];
  
  files.forEach(file => {
    const parts = file.path.split('/');
    let current = root;
    
    parts.forEach((part, index) => {
      if (index === parts.length - 1) {
        current.push({
          name: part,
          type: "file",
          language: part.split('.').pop() || "",
          content: file.content,
          lines: file.content.split('\n').length
        });
      } else {
        let folder = current.find(f => f.name === part && f.type === "folder");
        if (!folder) {
          folder = { name: part, type: "folder", language: "", children: [] };
          current.push(folder);
        }
        current = folder.children || [];
      }
    });
  });
  
  return root;
};

interface TreeNodeProps {
  node: ExtractedFile;
  depth: number;
  selectedFile: string | null;
  onSelect: (name: string, content: string) => void;
}

const TreeNode = ({ node, depth, selectedFile, onSelect }: TreeNodeProps) => {
  const [isOpen, setIsOpen] = useState(depth === 0);

  const handleClick = () => {
    if (node.type === "folder") {
      setIsOpen(!isOpen);
    } else if (node.content) {
      onSelect(node.name, node.content);
    }
  };

  return (
    <div>
      <div
        className={cn(
          "flex items-center gap-1.5 py-1.5 px-2 cursor-pointer rounded-lg transition-all duration-200 group",
          "hover:bg-primary/10",
          selectedFile === node.name && "bg-primary/20 text-primary border-l-2 border-primary"
        )}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
        onClick={handleClick}
      >
        {node.type === "folder" ? (
          <>
            <span className="transition-transform duration-200">
              {isOpen ? (
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
              ) : (
                <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
              )}
            </span>
            {isOpen ? (
              <FolderOpen className="h-4 w-4 text-primary" />
            ) : (
              <Folder className="h-4 w-4 text-primary/70" />
            )}
          </>
        ) : (
          <>
            <span className="w-3.5" />
            {getFileIcon(node.name)}
          </>
        )}
        <span className={cn(
          "text-sm truncate transition-colors",
          node.type === "folder" 
            ? "text-foreground/90 font-medium" 
            : "text-muted-foreground group-hover:text-foreground"
        )}>
          {node.name}
        </span>
        {node.lines && (
          <span className="text-[10px] text-muted-foreground/50 ml-auto tabular-nums">
            {node.lines}L
          </span>
        )}
      </div>
      {node.type === "folder" && isOpen && node.children && (
        <div className="animate-fade-in">
          {node.children.map((child, index) => (
            <TreeNode
              key={`${child.name}-${index}`}
              node={child}
              depth={depth + 1}
              selectedFile={selectedFile}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export const FileTree = ({ code, files, onFileSelect }: FileTreeProps) => {
  const [selectedFile, setSelectedFile] = useState<string | null>("App.tsx");
  
  // Use provided files or extract from code
  const fileTree = useMemo(() => {
    if (files && files.length > 0) {
      // Convert ProjectFile[] to ExtractedFile[] structure
      return convertProjectFilesToTree(files);
    }
    return extractCodeStructure(code);
  }, [code, files]);

  const handleFileSelect = (name: string, content: string) => {
    setSelectedFile(name);
    onFileSelect?.(name, content);
  };

  return (
    <div className="h-full flex flex-col bg-card/30 backdrop-blur-xl">
      <div className="px-3 py-3 border-b border-border/50 bg-card/50">
        <div className="flex items-center gap-2">
          <Folder className="h-4 w-4 text-primary" />
          <h3 className="text-xs font-semibold text-foreground uppercase tracking-wider">Explorer</h3>
        </div>
      </div>
      <ScrollArea className="flex-1">
        <div className="py-2">
          {fileTree.length > 0 ? (
            fileTree.map((node, index) => (
              <TreeNode
                key={`${node.name}-${index}`}
                node={node}
                depth={0}
                selectedFile={selectedFile}
                onSelect={handleFileSelect}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <FileText className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">No files generated yet</p>
            </div>
          )}
        </div>
      </ScrollArea>
    </div>
  );
};
