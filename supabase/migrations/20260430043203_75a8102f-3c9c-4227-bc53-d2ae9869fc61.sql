-- Drop news system entirely
DROP TABLE IF EXISTS public.news_posts CASCADE;

-- Enable cron + http extensions for scheduled scraping
CREATE EXTENSION IF NOT EXISTS pg_cron;
CREATE EXTENSION IF NOT EXISTS pg_net;

-- Storage bucket for contact form attachments (screenshots)
INSERT INTO storage.buckets (id, name, public)
VALUES ('contact-attachments', 'contact-attachments', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone can view (public bucket)
DROP POLICY IF EXISTS "Public can view contact attachments" ON storage.objects;
CREATE POLICY "Public can view contact attachments"
ON storage.objects FOR SELECT
USING (bucket_id = 'contact-attachments');

-- Authenticated users can upload
DROP POLICY IF EXISTS "Authenticated can upload contact attachments" ON storage.objects;
CREATE POLICY "Authenticated can upload contact attachments"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'contact-attachments');

-- Admin can delete
DROP POLICY IF EXISTS "Admin can delete contact attachments" ON storage.objects;
CREATE POLICY "Admin can delete contact attachments"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'contact-attachments' AND public.has_role(auth.uid(), 'admin'));

-- Add attachments column to contacts (array of public URLs)
ALTER TABLE public.contacts
  ADD COLUMN IF NOT EXISTS attachments TEXT[] DEFAULT '{}';

-- Allow admins to delete contacts (for cleanup)
DROP POLICY IF EXISTS "Admins can delete contacts" ON public.contacts;
CREATE POLICY "Admins can delete contacts"
ON public.contacts FOR DELETE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'));