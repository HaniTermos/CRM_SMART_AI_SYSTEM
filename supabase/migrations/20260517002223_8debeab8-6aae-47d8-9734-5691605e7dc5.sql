-- Public bucket for product images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

-- Anyone (including unauthenticated shoppers) can view product images
CREATE POLICY "Public read product images"
ON storage.objects
FOR SELECT
USING (bucket_id = 'product-images');

-- Authenticated members can upload product images for stores they belong to.
-- File path convention: {store_id}/{filename}
CREATE POLICY "Store admins upload product images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'product-images'
  AND public.is_store_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Store admins update product images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_store_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);

CREATE POLICY "Store admins delete product images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'product-images'
  AND public.is_store_admin(auth.uid(), ((storage.foldername(name))[1])::uuid)
);
