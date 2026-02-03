

# Plan: Agregar patrón de grid al Hero de usuarios

## Resumen
Agregar el mismo patrón de líneas de cuadrícula (grid) que tiene el hero de provider-landing al hero card de la página principal de usuarios.

---

## Cambio a realizar

### Archivo: `src/components/Hero.tsx`

Agregar un nuevo `<div>` con el patrón de grid justo después del overlay de gradiente animado y antes del contenido principal.

**Ubicación exacta:** Entre la línea 42 (cierre del div del gradiente animado) y la línea 44 (comentario "Main Content")

**Código a agregar:**

```tsx
{/* Grid pattern overlay */}
<div 
  className="absolute inset-0 opacity-[0.03] pointer-events-none"
  style={{
    backgroundImage: `
      linear-gradient(rgba(255,255,255,0.5) 1px, transparent 1px),
      linear-gradient(90deg, rgba(255,255,255,0.5) 1px, transparent 1px)
    `,
    backgroundSize: '60px 60px',
  }}
/>
```

---

## Detalles técnicos

| Propiedad | Valor | Descripción |
|-----------|-------|-------------|
| `opacity-[0.03]` | 3% | Muy sutil para no distraer del texto |
| `backgroundSize` | 60px x 60px | Tamaño de cada celda del grid |
| `linear-gradient` | blanco 50% transparencia | Líneas horizontales y verticales |
| `pointer-events-none` | - | No interfiere con interacciones |

---

## Resultado visual

El hero card de usuarios tendrá el mismo efecto visual sutil de cuadrícula que el hero de proveedores, manteniendo consistencia visual entre ambas páginas.

