

## Fix: Banners flotantes sobre el hero

**Problema**: Los banners (ClientActiveJobBanner y SearchingJobBanner) están en el flujo del documento entre el header y el hero, empujando el hero hacia abajo y creando un gap visible.

**Solución**: Convertir el contenedor de banners en un elemento posicionado de forma fija (fixed), justo debajo del header, que flote sobre el hero sin afectar el layout.

### Cambio en `src/pages/UserLanding.tsx`

Líneas 243-247 — cambiar el div contenedor de:
```tsx
<div className="pt-16 md:pt-20 px-4 space-y-2 relative z-40">
```
A:
```tsx
<div className="fixed top-16 md:top-20 left-0 right-0 px-4 space-y-2 z-40 pointer-events-none [&>*]:pointer-events-auto">
```

Y mover el `pt-16 md:pt-20` al hero section (línea 250) para que el hero siga respetando el espacio del header:
```tsx
<section className="relative min-h-[70vh] ... pt-16 md:pt-20 ...">
```

Resultado: los banners flotan sobre el hero como una capa superpuesta, sin empujar contenido.

