
# Plan: Sistema de Verificación de Proveedores con Portal de Admin y Mejoras UX

## Resumen de Requerimientos

El usuario solicita:
1. **Portal Admin para Verificación**: Cuando un proveedor complete documentos, crear un sistema donde admins puedan revisar, aprobar o rechazar documentos
2. **Tarjeta de Estado de Verificación**: En el portal de proveedores, mostrar una tarjeta visible con el estado actual de verificación
3. **Botones de Volver**: En la página de verificación del proveedor, agregar formas claras de salir/volver
4. **Logo Chamby en TopBar**: Agregar logo de Chamby en la izquierda del top bar del portal de proveedores
5. **Mover Toggle de Disponibilidad**: Mover el botón de disponibilidad del top bar a la tarjeta de bienvenida/perfil

---

## Análisis de la Arquitectura Actual

### Tablas Relevantes
- `provider_details`: Contiene `verification_status` (pending/verified/rejected), `admin_notes`
- `documents`: Contiene documentos con `verification_status`, `rejection_reason`, `reviewed_by`, `reviewed_at`
- `providers`: Contiene `verified` boolean

### Páginas Existentes
- `AdminDashboard.tsx`: Tiene tabs para "Trabajos" y "Disputas" - **agregar tab "Verificaciones"**
- `ProviderDashboardHome.tsx`: Muestra tarjeta de perfil - **agregar tarjeta de verificación y toggle de disponibilidad**
- `ProviderTopBar.tsx`: Tiene toggle de disponibilidad y logo - **mover toggle, agregar logo Chamby**
- `ProviderVerification.tsx`: Página de verificación - **agregar botón de volver**

---

## Cambios Detallados

### 1. Admin Dashboard - Nueva Tab "Verificaciones"

**Archivo**: `src/pages/AdminDashboard.tsx`

**Cambios**:
- Agregar nuevo estado para proveedores pendientes de verificación
- Agregar nueva tab "Verificaciones" al TabsList
- Crear contenido de la tab con lista de proveedores pendientes
- Para cada proveedor, mostrar:
  - Nombre, email, teléfono
  - Lista de documentos subidos con botón para ver cada uno
  - Estado actual de verificación
  - Botones: "Aprobar", "Rechazar" con campo para notas/razón
- Implementar funciones para aprobar/rechazar:
  - Actualizar `provider_details.verification_status`
  - Actualizar `providers.verified`
  - Actualizar `documents.verification_status` para cada documento
  - Guardar `admin_notes` con feedback

**Nuevo estado a agregar**:
```typescript
const [pendingProviders, setPendingProviders] = useState<ProviderVerification[]>([]);
```

**Nueva función fetchPendingVerifications**:
```typescript
const fetchPendingVerifications = async () => {
  const { data } = await supabase
    .from('provider_details')
    .select('*, providers!inner(*), users!inner(*)')
    .eq('verification_status', 'pending');
    
  // Fetch documents for each provider
  for (const provider of data) {
    const { data: docs } = await supabase
      .from('documents')
      .select('*')
      .eq('provider_id', provider.user_id);
    provider.documents = docs;
  }
};
```

---

### 2. Tarjeta de Estado de Verificación en Portal de Proveedores

**Archivo**: `src/pages/provider-portal/ProviderDashboardHome.tsx`

**Cambios**:
- Crear nueva tarjeta prominente debajo del hero que muestre:
  - Estado actual de verificación (Pendiente/Verificado/Rechazado)
  - Si fue rechazado: mostrar razón del rechazo y botón para corregir documentos
  - Si está pendiente: mensaje de "En revisión por el equipo Chamby"
  - Si está verificado: badge verde con check
- Agregar toggle de disponibilidad a la tarjeta de perfil hero

**Nueva tarjeta de verificación**:
```tsx
{/* Verification Status Card */}
<Card className={cn(
  "border-2",
  verificationStatus === 'verified' && "border-green-500/50 bg-green-500/5",
  verificationStatus === 'pending' && "border-yellow-500/50 bg-yellow-500/5",
  verificationStatus === 'rejected' && "border-red-500/50 bg-red-500/5"
)}>
  <CardHeader>
    <CardTitle className="flex items-center gap-2">
      {verificationStatus === 'verified' && <CheckCircle className="text-green-600" />}
      {verificationStatus === 'pending' && <Clock className="text-yellow-600" />}
      {verificationStatus === 'rejected' && <XCircle className="text-red-600" />}
      Estado de Verificación
    </CardTitle>
  </CardHeader>
  <CardContent>
    {/* Status message and actions */}
  </CardContent>
</Card>
```

---

### 3. Toggle de Disponibilidad en Tarjeta de Perfil

**Archivo**: `src/pages/provider-portal/ProviderDashboardHome.tsx`

Agregar dentro de la tarjeta hero de perfil:
```tsx
<div className="flex items-center gap-3 mt-4 p-3 bg-background/50 rounded-lg">
  <Switch
    id="availability"
    checked={isAvailable}
    onCheckedChange={setIsAvailable}
  />
  <Label htmlFor="availability" className="cursor-pointer">
    <span className={isAvailable ? "text-green-600 font-medium" : "text-muted-foreground"}>
      {isAvailable ? "Disponible para trabajos" : "No disponible"}
    </span>
  </Label>
</div>
```

---

### 4. Logo Chamby en TopBar

**Archivo**: `src/components/provider-portal/ProviderTopBar.tsx`

**Cambios**:
- Importar logo de Chamby
- Agregar logo en el lado izquierdo
- Remover el switch de disponibilidad (se mueve al dashboard)

```tsx
import chambyLogo from "@/assets/chamby-logo-new-horizontal.png";

// En el return:
<header className="h-16 border-b border-border bg-card px-4 lg:px-6 flex items-center justify-between sticky top-0 z-10">
  <div className="flex items-center gap-4">
    <img src={chambyLogo} alt="Chamby" className="h-10" />
  </div>
  {/* Resto del header sin el switch */}
</header>
```

---

### 5. Botón Volver en Página de Verificación

**Archivo**: `src/pages/provider-portal/ProviderVerification.tsx`

**Cambios**:
- Agregar botón de volver en el header
- Importar componente BackButton o crear botón con navegación

```tsx
import { ArrowLeft } from "lucide-react";

// En el header:
<div className="flex items-center gap-4">
  <Button 
    variant="ghost" 
    size="icon"
    onClick={() => navigate('/provider-portal')}
  >
    <ArrowLeft className="h-5 w-5" />
  </Button>
  <div>
    <h1 className="text-3xl font-bold text-foreground">Verificación</h1>
    <p className="text-muted-foreground">...</p>
  </div>
</div>
```

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/AdminDashboard.tsx` | Agregar tab "Verificaciones" con lista de proveedores pendientes, botones aprobar/rechazar |
| `src/pages/provider-portal/ProviderDashboardHome.tsx` | Agregar tarjeta de estado de verificación, toggle de disponibilidad en hero |
| `src/components/provider-portal/ProviderTopBar.tsx` | Agregar logo Chamby, remover toggle de disponibilidad |
| `src/pages/provider-portal/ProviderVerification.tsx` | Agregar botón de volver al dashboard |

---

## Flujo de Datos

```text
┌─────────────────────────────────────────────────────────────────────┐
│                    FLUJO DE VERIFICACIÓN                            │
├─────────────────────────────────────────────────────────────────────┤
│                                                                     │
│  1. PROVEEDOR COMPLETA ONBOARDING                                   │
│     └─> Sube documentos (INE, carta, foto)                          │
│     └─> documents.verification_status = 'pending'                   │
│     └─> provider_details.verification_status = 'pending'            │
│                                                                     │
│  2. ADMIN VE EN DASHBOARD                                           │
│     └─> Tab "Verificaciones" muestra proveedores pendientes         │
│     └─> Puede ver cada documento (signed URL)                       │
│     └─> Botones "Aprobar" / "Rechazar"                              │
│                                                                     │
│  3. ADMIN APRUEBA                                                   │
│     └─> provider_details.verification_status = 'verified'           │
│     └─> providers.verified = true                                   │
│     └─> documents.verification_status = 'verified'                  │
│                                                                     │
│  4. ADMIN RECHAZA                                                   │
│     └─> provider_details.verification_status = 'rejected'           │
│     └─> provider_details.admin_notes = 'razón del rechazo'          │
│     └─> documents.verification_status = 'rejected'                  │
│     └─> documents.rejection_reason = 'razón específica'             │
│                                                                     │
│  5. PROVEEDOR VE EN SU DASHBOARD                                    │
│     └─> Tarjeta de verificación muestra estado actual               │
│     └─> Si rechazado: ve razón y puede corregir                     │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Diseño UI del Admin - Tab Verificaciones

```text
┌────────────────────────────────────────────────────────────────────┐
│  [← ] Panel de Administración                    [💰 Payouts]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  [ Trabajos (45) ] [ Disputas (2) ] [ Verificaciones (3) 🔴 ]      │
│                                                                    │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  👤 Juan Pérez García                              PENDIENTE │  │
│  │  📧 juan@email.com  📞 33 1234 5678                          │  │
│  │                                                              │  │
│  │  Documentos:                                                 │  │
│  │  ✓ Foto de Rostro         [Ver]                             │  │
│  │  ✓ INE Frente             [Ver]                             │  │
│  │  ✓ INE Reverso            [Ver]                             │  │
│  │  ✓ Carta de Antecedentes  [Ver]                             │  │
│  │                                                              │  │
│  │  Notas para el proveedor (opcional):                        │  │
│  │  ┌────────────────────────────────────────────────────────┐ │  │
│  │  │                                                        │ │  │
│  │  └────────────────────────────────────────────────────────┘ │  │
│  │                                                              │  │
│  │  [ ✓ Aprobar Proveedor ]    [ ✗ Rechazar ]                  │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Diseño UI del Provider Dashboard - Tarjeta de Verificación

```text
┌────────────────────────────────────────────────────────────────────┐
│  [Logo Chamby]                           [Avatar ▼ Proveedor]      │
├────────────────────────────────────────────────────────────────────┤
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │                        [Avatar]                              │  │
│  │                    ¡Hola, Juan! ✓                            │  │
│  │                 Plomero profesional                          │  │
│  │                                                              │  │
│  │     ⭐ 4.8 (23)  |  ✓ 45 trabajos  |  📍 Guadalajara        │  │
│  │                                                              │  │
│  │  ┌─────────────────────────────────────────────────────────┐│  │
│  │  │  [🟢] Disponible para trabajos                          ││  │
│  │  └─────────────────────────────────────────────────────────┘│  │
│  │                                                              │  │
│  │                   [ ⚙️ Editar Perfil ]                       │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  🕐 Estado de Verificación                         PENDIENTE │  │
│  ├──────────────────────────────────────────────────────────────┤  │
│  │  Tu perfil está siendo revisado por el equipo de Chamby.    │  │
│  │  Te notificaremos cuando tengamos una respuesta.            │  │
│  │                                                              │  │
│  │  Documentos enviados: 4/4 ✓                                  │  │
│  │                                                              │  │
│  │         [ Ver detalles de verificación → ]                   │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                    │
└────────────────────────────────────────────────────────────────────┘
```

---

## Resultado Esperado

1. **Admin puede revisar proveedores**: Nueva tab en Admin Dashboard muestra todos los proveedores pendientes de verificación con sus documentos y permite aprobar/rechazar con feedback
2. **Proveedor ve su estado**: Tarjeta prominente en su dashboard muestra si está pendiente, verificado o rechazado con razón
3. **Navegación clara**: Botón de volver en página de verificación para regresar al dashboard
4. **Logo visible**: Logo de Chamby aparece en el top bar del portal de proveedores
5. **Toggle de disponibilidad mejor ubicado**: Dentro de la tarjeta de perfil para mayor visibilidad
