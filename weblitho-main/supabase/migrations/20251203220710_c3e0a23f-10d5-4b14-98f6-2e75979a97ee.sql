-- Create storage bucket for user uploads
INSERT INTO storage.buckets (id, name, public)
VALUES ('project-assets', 'project-assets', true);

-- Allow authenticated users to upload files
CREATE POLICY "Users can upload their own assets"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'project-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow authenticated users to view their own assets
CREATE POLICY "Users can view their own assets"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'project-assets' AND (storage.foldername(name))[1] = auth.uid()::text);

-- Allow public access to view assets (for preview)
CREATE POLICY "Public can view project assets"
ON storage.objects FOR SELECT
TO anon
USING (bucket_id = 'project-assets');

-- Allow authenticated users to delete their own assets
CREATE POLICY "Users can delete their own assets"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'project-assets' AND (storage.foldername(name))[1] = auth.uid()::text);