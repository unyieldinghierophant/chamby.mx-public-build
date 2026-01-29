
# Plan: Configurar Toasts de Éxito con Duración Corta y Posición Superior

## Problema Identificado

Los mensajes de éxito (como "¡Email verificado!") permanecen demasiado tiempo en pantalla y aparecen en la parte inferior, bloqueando el botón de avance. El usuario necesita que:

1. Los mensajes duren máximo 2 segundos
2. Aparezcan en la parte superior de la pantalla  
3. Se puedan cerrar con un click

## Causa Raíz

El componente `Sonner` en `src/components/ui/sonner.tsx` no tiene configurada:
- La posición (por defecto es `bottom-right`)
- La duración por defecto (por defecto es ~4 segundos)
- El botón de cerrar (no está habilitado)

## Solución

### Archivo a Modificar

| Archivo | Cambios |
|---------|---------|
| `src/components/ui/sonner.tsx` | Agregar `position`, `duration` y `closeButton` al componente `Sonner` |

### Cambios Específicos

En `src/components/ui/sonner.tsx` líneas 10-24:

```typescript
return (
  <Sonner
    theme={theme as ToasterProps["theme"]}
    className="toaster group"
    position="top-center"
    duration={2000}
    closeButton
    toastOptions={{
      classNames: {
        toast:
          "group toast group-[.toaster]:bg-background group-[.toaster]:text-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
        description: "group-[.toast]:text-muted-foreground",
        actionButton: "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
        cancelButton: "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
        closeButton: "group-[.toast]:bg-background group-[.toast]:text-foreground",
      },
    }}
    {...props}
  />
);
```

## Parámetros Agregados

| Parámetro | Valor | Descripción |
|-----------|-------|-------------|
| `position` | `"top-center"` | Muestra los toasts centrados en la parte superior |
| `duration` | `2000` | Duración de 2 segundos (2000 ms) |
| `closeButton` | `true` | Agrega botón X para cerrar manualmente |

## Resultado Esperado

1. Todos los toasts de éxito (`toast.success`) aparecerán arriba de la pantalla, centrados
2. Se cerrarán automáticamente después de 2 segundos
3. El usuario podrá cerrarlos inmediatamente haciendo click en la X
4. Ya no bloquearán el botón de avance en el onboarding wizard

## Nota

Este cambio afecta globalmente a todos los toasts de la aplicación (éxito, error, info), lo cual es consistente con la experiencia de usuario. Los toasts de error también durarán 2 segundos, pero el usuario puede leerlos rápidamente o hacer click para cerrarlos antes.
