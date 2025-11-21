-- ============================================
-- ELIMINAR TRIGGER Y FUNCIÓN OBSOLETOS
-- ============================================

-- 1. Eliminar el trigger obsoleto que causa el error
DROP TRIGGER IF EXISTS on_auth_user_created_client ON auth.users;

-- 2. Eliminar la función obsoleta que referencia la tabla clients inexistente
DROP FUNCTION IF EXISTS public.handle_new_user_client();

-- 3. Verificar que el trigger correcto está activo
DO $$
DECLARE
  trigger_exists boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM pg_trigger t
    JOIN pg_proc p ON t.tgfoid = p.oid
    WHERE t.tgname = 'on_auth_user_created'
    AND p.proname = 'handle_new_user'
  ) INTO trigger_exists;
  
  IF trigger_exists THEN
    RAISE NOTICE '✓ Trigger correcto on_auth_user_created está activo';
  ELSE
    RAISE WARNING '✗ Trigger on_auth_user_created NO encontrado';
  END IF;
END $$;