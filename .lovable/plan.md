
# Plan: Páginas dedicadas de Login para Clientes y Proveedores

## Resumen
Actualmente, los botones de "Iniciar sesión" redirigen al wizard de signup completo. Se crearán páginas de login dedicadas y simples que solo contengan:
- Sign in con Google
- Ingreso con Email/Password
- Link para crear cuenta nueva

## Situación Actual

- **Página de Login para clientes** (`/login`): Ya existe y funciona correctamente
- **Problema en Index.tsx**: Los enlaces de "Iniciar sesión" apuntan a `/auth/user` (wizard de signup)
- **Problema en ProviderLanding.tsx**: El botón "Iniciar Sesión" apunta a `/auth/provider` (wizard de signup)
- **No existe página de login dedicada para proveedores**

## Cambios Propuestos

### 1. Crear página de Login para Proveedores
**Archivo nuevo:** `src/pages/ProviderLogin.tsx`

- Copiar estructura de `Login.tsx` existente
- Adaptar para contexto de proveedor:
  - Cambiar `login_context` a `'provider'`
  - Cambiar redirección post-login a `/provider-portal`
  - Actualizar link de registro a `/auth/provider`
  - Ajustar textos para proveedores ("Accede a tu cuenta de Chambynauta")

### 2. Agregar ruta para Login de Proveedores
**Archivo:** `src/constants/routes.ts`
- Agregar `PROVIDER_LOGIN: '/provider/login'`

**Archivo:** `src/App.tsx`
- Agregar ruta para `ProviderLogin`

### 3. Actualizar enlaces en Index.tsx
**Archivo:** `src/pages/Index.tsx`
- Cambiar enlaces de "Iniciar sesión" de `/auth/user` a `/login`
- El link ya usa `?mode=signin` en móvil, se simplificará a `/login`

### 4. Actualizar botón en ProviderLanding.tsx
**Archivo:** `src/pages/ProviderLanding.tsx`
- Cambiar el botón "Iniciar Sesión" de `/auth/provider` a `/provider/login`

## Flujo Final

```text
Usuario (cliente):
  Click "Iniciar sesión" → /login → Login simple → /user-landing

Proveedor:
  Click "Iniciar Sesión" → /provider/login → Login simple → /provider-portal
```

## Detalles Técnicos

### Estructura de ProviderLogin.tsx
- Misma estructura visual que `Login.tsx`
- Usa `signInWithGoogle(true, 'provider')` para OAuth
- Usa `signIn(email, password, 'provider')` para email/password
- Redirección post-login: verificar si tiene onboarding completo, si no → `/auth/provider`, si sí → `/provider-portal`
- Link "¿No tienes cuenta?" → `/auth/provider`

### Archivos a Modificar
1. `src/constants/routes.ts` - Nueva ruta
2. `src/App.tsx` - Registro de ruta
3. `src/pages/Index.tsx` - Actualizar enlaces
4. `src/pages/ProviderLanding.tsx` - Actualizar botón

### Archivo Nuevo
1. `src/pages/ProviderLogin.tsx` - Página de login para proveedores
