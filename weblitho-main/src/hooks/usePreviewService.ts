import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

interface DeployResult {
  previewUrl: string;
  message: string;
  projectId: string;
  needsBuild?: boolean;
}

interface BuildResult {
  previewUrl: string;
  message: string;
  projectId: string;
}

interface PreviewStatus {
  status: 'ready' | 'pending' | 'not_found';
  projectId: string;
  previewUrl?: string;
}

// Get the API base URL from environment or default to same origin
const getApiBaseUrl = () => {
  // In production with Docker, API is proxied through nginx
  // In development, you might need to set VITE_API_URL
  return import.meta.env.VITE_API_URL || '';
};

export const usePreviewService = () => {
  const [isDeploying, setIsDeploying] = useState(false);
  const [isBuilding, setIsBuilding] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const { toast } = useToast();

  // Deploy project files to the server
  const deployProject = useCallback(async (
    projectId: string,
    files: Array<{ path: string; content: string }>,
    preview?: string
  ): Promise<DeployResult | null> => {
    setIsDeploying(true);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/preview/deploy`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId, files, preview }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Deploy failed');
      }

      const result: DeployResult = await response.json();
      setPreviewUrl(result.previewUrl);
      
      toast({
        title: 'Project Deployed',
        description: result.message,
      });

      return result;
    } catch (error) {
      console.error('Deploy error:', error);
      toast({
        title: 'Deploy Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsDeploying(false);
    }
  }, [toast]);

  // Build the project (npm ci && npm run build)
  const buildProject = useCallback(async (projectId: string): Promise<BuildResult | null> => {
    setIsBuilding(true);
    
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/preview/build`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ projectId }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Build failed');
      }

      const result: BuildResult = await response.json();
      setPreviewUrl(result.previewUrl);
      
      toast({
        title: 'Build Complete',
        description: result.message,
      });

      return result;
    } catch (error) {
      console.error('Build error:', error);
      toast({
        title: 'Build Failed',
        description: error instanceof Error ? error.message : 'Unknown error',
        variant: 'destructive',
      });
      return null;
    } finally {
      setIsBuilding(false);
    }
  }, [toast]);

  // Deploy and build in one step
  const deployAndBuild = useCallback(async (
    projectId: string,
    files: Array<{ path: string; content: string }>,
    preview?: string
  ): Promise<string | null> => {
    // First deploy the files
    const deployResult = await deployProject(projectId, files, preview);
    
    if (!deployResult) return null;
    
    // If it's just a static preview (no build needed), return the URL
    if (!deployResult.needsBuild) {
      return deployResult.previewUrl;
    }
    
    // Build the project
    const buildResult = await buildProject(projectId);
    
    if (!buildResult) return null;
    
    return buildResult.previewUrl;
  }, [deployProject, buildProject]);

  // Check preview status
  const getPreviewStatus = useCallback(async (projectId: string): Promise<PreviewStatus | null> => {
    try {
      const response = await fetch(`${getApiBaseUrl()}/api/preview/status/${projectId}`);
      
      if (!response.ok) {
        return null;
      }

      return await response.json();
    } catch (error) {
      console.error('Status check error:', error);
      return null;
    }
  }, []);

  // Get the full preview URL (for use in iframe or browser)
  const getFullPreviewUrl = useCallback((relativePath: string): string => {
    const baseUrl = getApiBaseUrl() || window.location.origin;
    return `${baseUrl}${relativePath}`;
  }, []);

  return {
    isDeploying,
    isBuilding,
    previewUrl,
    deployProject,
    buildProject,
    deployAndBuild,
    getPreviewStatus,
    getFullPreviewUrl,
  };
};
