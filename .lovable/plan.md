
# Plan: Corrección de Errores de Subida de Documentos y Mejoras de UX

## Resumen del Problema

He identificado varios problemas que impiden la subida correcta de documentos:

### Causa Raíz del Error "relation profiles does not exist"

El error se produce porque:

1. **Trigger en la tabla `documents`**: Existe un trigger llamado `update_profile_on_document_insert` que se ejecuta al insertar documentos y llama a la función `update_profile_verification()`, la cual intenta actualizar una tabla `profiles` que NO EXISTE en la base de datos.

2. **Tabla real disponible**: La base de datos tiene las tablas `users` y `providers` pero NO tiene tabla `profiles`.

3. **Flujo del error**:
   - Usuario sube documento correctamente al storage (verificado: hay archivos recientes en `user-documents`)
   - Se intenta insertar registro en tabla `documents`
   - El trigger `update_profile_on_document_insert` se ejecuta
   - La función llama `UPDATE profiles SET updated_at = now()`
   - Error: "relation profiles does not exist"
   - La transacción completa falla y se revierte

### Problemas Adicionales Identificados

| Problema | Descripción |
|----------|-------------|
| Toast de progreso restaurado | Aparece desde abajo y bloquea el botón de avanzar |
| Texto en inglés | "SKILLS" debe ser "HABILIDADES" |
| Funciones de BD obsoletas | Múltiples funciones refieren a tabla `profiles` inexistente |
| Edge function obsoleta | `send-push-notification` usa tabla `profiles` |
| Consultas en ProviderMap | Usa relación `profiles!jobs_customer_id_fkey` inexistente |

---

## Solución

### Paso 1: Eliminar Trigger Problemático (Base de Datos)

Eliminar el trigger que causa el error:

```sql
-- Drop the problematic trigger
DROP TRIGGER IF EXISTS update_profile_on_document_insert ON documents;
```

### Paso 2: Actualizar Función de Verificación (Base de Datos)

Actualizar `update_profile_verification()` para usar las tablas correctas:

```sql
CREATE OR REPLACE FUNCTION public.update_profile_verification()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Update provider_details when document is uploaded
  UPDATE provider_details 
  SET 
    updated_at = now(),
    verification_status = CASE 
      WHEN verification_status = 'none' THEN 'pending'
      ELSE verification_status
    END
  WHERE user_id = NEW.provider_id;
  
  RETURN NEW;
END;
$function$;
```

### Paso 3: Quitar Toast de Progreso Restaurado (Frontend)

En `src/pages/provider-portal/ProviderOnboardingWizard.tsx`, eliminar el toast que bloquea el botón:

**Líneas 173-175** - Eliminar:
```typescript
// ELIMINAR estas líneas
toast.info('Progreso restaurado', {
  description: 'Continuamos donde lo dejaste'
});
```

### Paso 4: Cambiar "SKILLS" a "HABILIDADES" (Frontend)

En `src/pages/provider-portal/ProviderOnboardingWizard.tsx`:

**Línea 98** - Cambiar:
```typescript
// ANTES
{ id: 4, label: 'SKILLS' },

// DESPUÉS  
{ id: 4, label: 'HABILIDADES' },
```

### Paso 5: Actualizar Edge Function (Backend)

En `supabase/functions/send-push-notification/index.ts`, cambiar de `profiles` a `providers`:

**Líneas 34-39 y 45-49** - Actualizar queries:
```typescript
// ANTES
const { data: providers } = await supabase
  .from('profiles')
  .select('fcm_token, user_id, full_name')
  .eq('is_tasker', true)
  .eq('verification_status', 'verified')
  .not('fcm_token', 'is', null);

// DESPUÉS
const { data: providers } = await supabase
  .from('providers')
  .select('fcm_token, user_id, display_name')
  .eq('verified', true)
  .not('fcm_token', 'is', null);
```

### Paso 6: Corregir ProviderMap.tsx (Frontend)

En `src/pages/provider-portal/ProviderMap.tsx`, corregir las consultas con relación inexistente:

**Líneas 86 y 102** - Cambiar relación:
```typescript
// ANTES
customer:profiles!jobs_customer_id_fkey(full_name)

// DESPUÉS - usar users con client_id
client:users!jobs_client_id_fkey(full_name)
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Quitar toast de progreso, cambiar "SKILLS" a "HABILIDADES" |
| `supabase/functions/send-push-notification/index.ts` | Usar tabla `providers` en lugar de `profiles` |
| `src/pages/provider-portal/ProviderMap.tsx` | Corregir relación de foreign key |

## Migraciones de Base de Datos Requeridas

1. **DROP TRIGGER**: Eliminar `update_profile_on_document_insert`
2. **UPDATE FUNCTION**: Actualizar `update_profile_verification()` para usar tablas correctas

---

## Detalles Técnicos

### Verificación del Storage (Confirmado Funcionando)

Los archivos se están subiendo correctamente al bucket `user-documents`. Ejemplo de archivo reciente:
- `636f8f17-f311-4729-b2d4-470164e12778/verification/ine_back_1769705444734.jpg`
- Subido: 2026-01-29 16:50:46

El problema está en el INSERT a la tabla `documents` que dispara el trigger fallido.

### Funciones de BD Afectadas (Para Limpieza Futura)

Las siguientes funciones también refieren a `profiles` y deberían actualizarse en una limpieza posterior:
- `get_provider_profile_id()` 
- `notify_reschedule_request()`
- `get_top_providers()`
- `create_job_reminders()`
- `get_public_provider_profiles()`
- `audit_security_changes()`

---

## Resultado Esperado

Después de aplicar estos cambios:
1. Los documentos se subirán sin error
2. El registro se guardará correctamente en la tabla `documents`  
3. El toast de progreso no bloqueará el botón de avanzar
4. La interfaz mostrará "HABILIDADES" en lugar de "SKILLS"
5. Las notificaciones push funcionarán con la tabla correcta

---

## Recomendación de Prueba

1. Ir al onboarding wizard como proveedor nuevo
2. Llegar al paso de documentos
3. Subir una foto usando "Tomar Foto" o "Subir Imagen"
4. Verificar que el documento aparece como subido (check verde)
5. Continuar al siguiente paso sin ver el toast bloqueando

