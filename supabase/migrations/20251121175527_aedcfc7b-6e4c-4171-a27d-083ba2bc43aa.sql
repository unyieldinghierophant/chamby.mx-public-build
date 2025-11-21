-- ============================================
-- LIMPIEZA COMPLETA DE DATOS DE PRUEBA
-- ============================================

-- 1. Eliminar todas las notificaciones
DELETE FROM notifications;

-- 2. Eliminar todos los trabajos
DELETE FROM jobs;

-- 3. Eliminar todos los detalles de proveedores
DELETE FROM provider_details;

-- 4. Eliminar todos los roles de usuarios (excepto admin si existe)
DELETE FROM user_roles WHERE role != 'admin';

-- 5. Eliminar todos los usuarios
DELETE FROM users;

-- Verificación: Contar registros restantes
DO $$
BEGIN
  RAISE NOTICE 'Limpieza completada:';
  RAISE NOTICE '  - users: % registros', (SELECT COUNT(*) FROM users);
  RAISE NOTICE '  - provider_details: % registros', (SELECT COUNT(*) FROM provider_details);
  RAISE NOTICE '  - user_roles: % registros', (SELECT COUNT(*) FROM user_roles);
  RAISE NOTICE '  - jobs: % registros', (SELECT COUNT(*) FROM jobs);
  RAISE NOTICE '  - notifications: % registros', (SELECT COUNT(*) FROM notifications);
END $$;