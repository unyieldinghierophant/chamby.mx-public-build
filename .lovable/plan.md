
# Plan: Hacer íconos de categoría 100% más grandes

## Problema Confirmado

Verifiqué visualmente que los íconos se ven pequeños. El código ya tiene imágenes de 128x128px (`w-32 h-32`) pero están siendo **recortados** por contenedores con `overflow: hidden` implícito.

La cadena de recorte:
- **TabsList**: `overflow-x-auto` recorta verticalmente
- **motion.div wrapper**: Sin `overflow-visible`
- **TabsTrigger**: Hereda restricciones de overflow

## Solución

Agregar `overflow-visible` en TODOS los niveles de la cadena de contenedores:

### Cambios en `src/components/CategoryTabs.tsx`:

**1. TabsList (línea 108)**
```tsx
// ANTES
className="... overflow-x-auto scrollbar-hide pl-0"

// DESPUÉS  
className="... overflow-x-auto overflow-y-visible scrollbar-hide pl-0 py-6"
```
- Agregar `overflow-y-visible` para permitir desborde vertical
- Agregar `py-6` para dar espacio a los íconos que sobresalen

**2. motion.div wrapper (línea 122)**
```tsx
// ANTES
className="flex-shrink-0"

// DESPUÉS
className="flex-shrink-0 overflow-visible"
```

**3. TabsTrigger (líneas 126-133)**
```tsx
// Agregar overflow-visible a las clases
className={cn(
  "... overflow-visible"
)}
```

## Detalle Técnico

| Contenedor | Tamaño | Contenido |
|------------|--------|-----------|
| motion.div (botón) | 64x64px (móvil) | Mantiene tamaño |
| img (ícono) | 128x128px | 2x más grande, desborda |
| Resultado | Ícono "flota" sobre el botón | Sin afectar layout |

## Resultado Esperado

Los íconos serán visualmente el doble de grandes, "flotando" sobre sus contenedores sin alterar el espaciado entre categorías.
