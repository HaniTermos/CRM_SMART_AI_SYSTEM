
-- RLS policies call these helpers in the caller's context.
-- Authenticated users must have EXECUTE; anon/public stay revoked.
GRANT EXECUTE ON FUNCTION public.has_role(uuid, uuid, public.app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_member(uuid, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.is_store_admin(uuid, uuid) TO authenticated;
