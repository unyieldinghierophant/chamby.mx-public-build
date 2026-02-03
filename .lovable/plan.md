

# Plan: Ajustar iconos de categorías y mejorar scroll horizontal

## Resumen
Hacer los iconos de las categorías 50% más grandes (sin cambiar los botones), asegurar que el primer botón (Handyman) sea completamente visible, y mostrar una barra de scroll siempre visible para indicar que hay más contenido.

---

## Cambios a realizar

### Archivo: `src/components/CategoryTabs.tsx`

**1. Aumentar tamaño de iconos 50%**

Los iconos actuales son `w-20 h-20` (móvil) y `w-28 h-28` (desktop). 50% más grande será:
- Móvil: `w-20 h-20` → `w-[7.5rem] h-[7.5rem]` (30 = 120px, que es 50% más que 80px)
- Desktop: `w-28 h-28` → `w-[10.5rem] h-[10.5rem]` (42 = 168px, que es 50% más que 112px)

Ubicación: Línea 94-95
```tsx
// Antes
className="w-20 h-20 md:w-28 md:h-28 flex items-center justify-center"

// Después
className="w-[7.5rem] h-[7.5rem] md:w-[10.5rem] md:h-[10.5rem] flex items-center justify-center overflow-visible"
```

**2. Permitir que los iconos desborden sin ser cortados**

Agregar `overflow-visible` al contenedor de cada tab para que los iconos más grandes no se corten:
- Línea 81: Agregar `overflow-visible` al `motion.div` wrapper

**3. Barra de scroll siempre visible**

Actualmente usa `scrollbar-thin scrollbar-thumb-muted-foreground/30` que puede no ser siempre visible. Agregar estilos CSS personalizados para garantizar visibilidad.

Ubicación: Línea 67
```tsx
// Modificar la clase del TabsList
className="w-full h-auto bg-background p-3 md:p-4 rounded-2xl flex gap-4 md:gap-6 overflow-x-auto scrollbar-always-visible pb-4"
```

**4. Asegurar que Handyman sea visible al inicio**

El contenedor actual puede estar cortando el primer elemento. Necesitamos:
- Agregar padding izquierdo al contenedor del scroll
- Cambiar de `overflow-hidden` a permitir que el primer elemento sea visible

### Archivo: `src/index.css`

Agregar estilos CSS para la barra de scroll siempre visible:

```css
/* Always visible scrollbar for category tabs */
.scrollbar-always-visible::-webkit-scrollbar {
  height: 6px;
  display: block;
}

.scrollbar-always-visible::-webkit-scrollbar-track {
  background: hsl(var(--muted));
  border-radius: 3px;
}

.scrollbar-always-visible::-webkit-scrollbar-thumb {
  background: hsl(var(--muted-foreground) / 0.4);
  border-radius: 3px;
}

.scrollbar-always-visible::-webkit-scrollbar-thumb:hover {
  background: hsl(var(--muted-foreground) / 0.6);
}

/* Firefox */
.scrollbar-always-visible {
  scrollbar-width: thin;
  scrollbar-color: hsl(var(--muted-foreground) / 0.4) hsl(var(--muted));
}
```

---

## Resumen de cambios

| Propiedad | Antes | Después |
|-----------|-------|---------|
| Iconos móvil | 80px (w-20) | 120px (w-[7.5rem]) |
| Iconos desktop | 112px (w-28) | 168px (w-[10.5rem]) |
| Overflow iconos | contenido | visible |
| Scrollbar | semi-transparente | siempre visible |
| Primer botón | puede estar cortado | completamente visible |

---

## Resultado esperado

- Los iconos de categoría serán 50% más grandes mientras los botones mantienen el mismo tamaño base
- El botón de Handyman será completamente visible al cargar la página
- Una barra de scroll siempre visible indicará al usuario que puede desplazarse horizontalmente

