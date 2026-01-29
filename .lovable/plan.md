
# Plan: Mejorar Logo y Vista Previa de Fotos en Onboarding Wizard

## Problemas Identificados

### 1. Logo Muy Pequeño
**Ubicación**: `src/pages/provider-portal/ProviderOnboardingWizard.tsx` línea 666
**Estado actual**: El logo tiene `h-20` (80px)
**Solución**: Aumentar a `h-32` (128px) para mayor visibilidad

### 2. Texto se Sale de Vista en Previa de Foto
**Ubicación**: `src/components/provider-portal/DocumentCaptureDialog.tsx` líneas 494-537
**Problema**: 
- La imagen tiene `aspect-[3/4]` fijo con `object-cover`
- En pantallas pequeñas, esto empuja el texto y botones fuera de la vista
- No hay scroll y el DialogContent no se ajusta al contenido

**Solución**: 
- Limitar altura máxima de la imagen con `max-h-[50vh]`
- Usar `object-contain` en lugar de `object-cover` para mostrar toda la imagen
- Hacer el contenedor scrollable con `overflow-y-auto` y `max-h-[85vh]`

### 3. Falta Funcionalidad de Ampliar Foto
**Problema**: El usuario no puede hacer click para ampliar la foto capturada
**Solución**: Agregar un estado y modal para vista ampliada con botón X para cerrar

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/pages/provider-portal/ProviderOnboardingWizard.tsx` | Aumentar tamaño del logo de `h-20` a `h-32` |
| `src/components/provider-portal/DocumentCaptureDialog.tsx` | Ajustar imagen a pantalla, agregar modal de zoom |

---

## Cambios Detallados

### 1. Logo Más Grande (ProviderOnboardingWizard.tsx)

**Línea 666** - Cambiar:
```tsx
// ANTES
<img src={chambyLogo} alt="Chamby" className="h-20" />

// DESPUÉS
<img src={chambyLogo} alt="Chamby" className="h-32" />
```

### 2. Ajustar Vista Previa de Imagen (DocumentCaptureDialog.tsx)

**Línea 378** - Hacer DialogContent scrollable:
```tsx
// ANTES
<DialogContent className="sm:max-w-md p-0 overflow-hidden">

// DESPUÉS  
<DialogContent className="sm:max-w-md p-0 max-h-[90vh] overflow-y-auto">
```

**Líneas 495-501** - Ajustar imagen para que quepa en pantalla:
```tsx
// ANTES
{mode === 'preview' && capturedImage && (
  <div className="relative">
    <img
      src={capturedImage}
      alt="Captured"
      className="w-full aspect-[3/4] object-cover"
    />

// DESPUÉS
{mode === 'preview' && capturedImage && (
  <div className="relative">
    <div 
      className="relative cursor-pointer"
      onClick={() => setShowZoom(true)}
    >
      <img
        src={capturedImage}
        alt="Captured"
        className="w-full max-h-[50vh] object-contain bg-black/5"
      />
      <div className="absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity bg-black/20">
        <span className="text-white text-sm font-medium bg-black/50 px-3 py-1 rounded-full">
          Toca para ampliar
        </span>
      </div>
    </div>
```

### 3. Agregar Modal de Zoom (DocumentCaptureDialog.tsx)

Agregar nuevo estado al inicio del componente:
```tsx
const [showZoom, setShowZoom] = useState(false);
```

Agregar modal de zoom al final del componente (antes del cierre de Dialog):
```tsx
{/* Modal de Zoom */}
{showZoom && capturedImage && (
  <div 
    className="fixed inset-0 z-[100] bg-black/95 flex items-center justify-center"
    onClick={() => setShowZoom(false)}
  >
    <button
      onClick={() => setShowZoom(false)}
      className="absolute top-4 right-4 z-10 w-10 h-10 rounded-full bg-white/20 flex items-center justify-center text-white hover:bg-white/30 transition-colors"
    >
      <X className="w-6 h-6" />
    </button>
    <img
      src={capturedImage}
      alt="Ampliación"
      className="max-w-full max-h-full object-contain p-4"
      onClick={(e) => e.stopPropagation()}
    />
  </div>
)}
```

---

## Resumen Visual de Cambios

```text
┌─────────────────────────────────────────┐
│         ANTES                           │
├─────────────────────────────────────────┤
│  Logo pequeño (h-20 = 80px)             │
│  Imagen fija aspect-[3/4] con overflow  │
│  Texto y botones fuera de vista         │
│  No hay opción de ampliar foto          │
└─────────────────────────────────────────┘

┌─────────────────────────────────────────┐
│         DESPUÉS                         │
├─────────────────────────────────────────┤
│  Logo grande (h-32 = 128px)             │
│  Imagen con max-h-[50vh] y contain      │
│  Todo el contenido visible en pantalla  │
│  Click en foto abre vista ampliada      │
│  Botón X para cerrar la ampliación      │
└─────────────────────────────────────────┘
```

---

## Resultado Esperado

1. El logo de Chamby será más visible y prominente
2. La vista previa de la foto se ajustará a la pantalla sin cortar texto ni botones
3. El usuario podrá hacer click en la foto para ampliarla a pantalla completa
4. Un botón X claro permitirá cerrar la vista ampliada
5. Tocar fuera de la imagen también cerrará el zoom
