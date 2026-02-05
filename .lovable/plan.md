
# Plan: Reorganizar Flujos de Autenticación

## Resumen del Problema
Actualmente hay confusión en las rutas de autenticación:
- Los wizards de onboarding manejan tanto login como registro
- Los usuarios que inician sesión son enviados a wizards en lugar de páginas de login simples
- No hay distinción clara entre el flujo de clientes y proveedores

## Solución Propuesta

### Principios de Diseño
- **Iniciar Sesión** → Siempre va a páginas de login dedicadas (`/login` o `/provider/login`)
- **Registrarse** (clientes) → Página de registro simple o wizard de cliente
- **Ser Chambynauta** → Wizard de proveedor (`/auth/provider`) solo para registro
- **Desde /book-job** → Redirecciona a `/login` y regresa al paso actual del formulario

### Cambios por Archivo

#### 1. src/pages/Index.tsx (Landing público)
**Cambios:**
- "Registrarse" → Cambiar de `/auth/user` a `/login` con parámetro `?mode=signup`
- "Iniciar sesión" → Mantener en `/login` ✅
- "Ser Chambynauta" → Mantener en `/auth/provider` ✅

#### 2. src/pages/Login.tsx (Página de login de clientes)
**Cambios:**
- Agregar soporte para modo registro (`?mode=signup`)
- Añadir formulario de registro simple (nombre, email, teléfono, contraseña)
- El enlace "¿No tienes cuenta?" cambia a modo registro dentro de la misma página
- Manejar correctamente el `returnTo` para `/book-job`

#### 3. src/components/JobBookingForm.tsx
**Cambios:**
- Cambiar redirección de autenticación de `/auth/user` a `/login`
- Mantener la lógica de guardar el paso actual y datos del formulario
- Asegurar que el usuario regrese al paso donde se quedó después de autenticarse

#### 4. src/components/AuthModal.tsx
**Cambios:**
- El botón "Iniciar sesión / Registrarme" debe navegar a `/login` en lugar de `/auth/user`

#### 5. src/pages/UserOnboardingWizard.tsx
**Cambios:**
- Convertir a wizard solo de registro para clientes (eliminar modo login)
- Opcional: Mover esta lógica a Login.tsx y eliminar este archivo
- O mantenerlo para flujos de registro que requieran más pasos

#### 6. src/pages/provider-portal/ProviderOnboardingWizard.tsx
**Cambios:**
- Ya tiene simplificación de auth implementada (enlace de texto para login)
- Asegurar que el enlace "¿Ya tienes cuenta? Iniciar sesión" vaya a `/provider/login`
- No debe manejar login completo, solo mostrar enlace a la página de login

#### 7. src/pages/AuthCallback.tsx
**Cambios:**
- Ajustar la lógica de redirección post-autenticación
- Si viene de `/book-job`, regresar ahí con datos preservados
- Si es cliente nuevo, ir a `/user-landing` (no a wizard)
- Si es proveedor nuevo, ir a wizard de proveedor para completar perfil

#### 8. src/constants/routes.ts
**Cambios:**
- Agregar `USER_SIGNUP: '/signup'` si se decide separar registro de login
- O agregar constante para `LOGIN_SIGNUP_MODE: '/login?mode=signup'`

### Flujos Resultantes

```text
+------------------+     +-----------+     +----------------+
| Landing (/)      |     |  /login   |     | /user-landing  |
| - Iniciar sesión +---->+ (login o  +---->+ (cliente auth) |
| - Registrarse    +---->+ registro) |     +----------------+
+------------------+     +-----------+
                                |
                                v (si es nuevo)
                         +----------------+
                         | Crear cuenta   |
                         | (en /login)    |
                         +----------------+

+------------------+     +----------------+     +------------------+
| Provider Landing |     | /provider/login|     | /provider-portal |
| - Iniciar sesión +---->+ (solo login)   +---->+ (proveedor auth) |
+------------------+     +----------------+     +------------------+
        |
        v (nuevo proveedor)
+------------------+     +------------------+
| /auth/provider   |     | /provider-portal |
| (wizard signup)  +---->+ (después del     |
| solo registro    |     | onboarding)      |
+------------------+     +------------------+

+------------------+     +-----------+     +------------------+
| /book-job        |     |  /login   |     | /book-job        |
| (sin auth)       +---->+ (login o  +---->+ (retorna al paso |
| requiere auth    |     | registro) |     | donde se quedó)  |
+------------------+     +-----------+     +------------------+
```

### Detalles Técnicos

#### Login.tsx - Nuevo Diseño con Registro
```typescript
// Detectar modo desde URL
const [searchParams] = useSearchParams();
const initialMode = searchParams.get('mode') === 'signup' ? 'signup' : 'login';
const [mode, setMode] = useState<'login' | 'signup'>(initialMode);

// Formulario de registro
const [signupData, setSignupData] = useState({
  fullName: '',
  email: '',
  phone: '',
  password: ''
});

// Toggle entre modos
<p className="text-sm text-muted-foreground">
  {mode === 'login' ? (
    <>¿No tienes cuenta? <button onClick={() => setMode('signup')}>Regístrate</button></>
  ) : (
    <>¿Ya tienes cuenta? <button onClick={() => setMode('login')}>Inicia sesión</button></>
  )}
</p>
```

#### JobBookingForm.tsx - Cambio de Redirección
```typescript
// ANTES
navigate('/auth/user', { state: { returnTo: RETURN_PATH } });

// DESPUÉS
navigate('/login', { state: { returnTo: RETURN_PATH } });
```

#### AuthCallback.tsx - Lógica de Retorno
```typescript
// Prioridad para returnTo:
// 1. sessionStorage/localStorage (para /book-job)
// 2. Si es cliente nuevo → /user-landing (NO wizard)
// 3. Si es proveedor nuevo → /auth/provider (completar onboarding)
// 4. Default → landing correspondiente según rol
```

### Archivos a Modificar
1. `src/pages/Index.tsx` - Actualizar enlaces de navegación
2. `src/pages/Login.tsx` - Agregar modo registro
3. `src/components/JobBookingForm.tsx` - Cambiar redirección auth
4. `src/components/AuthModal.tsx` - Actualizar navegación
5. `src/pages/AuthCallback.tsx` - Ajustar lógica de redirección
6. `src/pages/provider-portal/ProviderOnboardingWizard.tsx` - Enlace a login real
7. `src/constants/routes.ts` - Agregar nuevas constantes si es necesario

### Orden de Implementación
1. Primero: Actualizar `Login.tsx` con soporte de registro
2. Segundo: Actualizar `JobBookingForm.tsx` y `AuthModal.tsx`
3. Tercero: Actualizar `AuthCallback.tsx` para flujos correctos
4. Cuarto: Actualizar `Index.tsx` y `ProviderOnboardingWizard.tsx`
5. Quinto: Pruebas de todos los flujos

### Resultado Esperado
- Usuarios que quieren iniciar sesión → Siempre ven página de login simple
- Usuarios que quieren registrarse como clientes → Registro simple en `/login?mode=signup`
- Usuarios que quieren ser proveedores → Wizard completo en `/auth/provider`
- Usuarios en `/book-job` → Regresan exactamente al paso donde estaban
