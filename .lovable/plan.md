
# Plan: Hacer los íconos de categoría 100% más grandes

## Problema Identificado

Los íconos no se ven más grandes porque están siendo **recortados** por varios contenedores padres que tienen `overflow: hidden` o similares:

1. **TabsList** (`overflow-x-auto`) - necesario para scroll pero corta verticalmente
2. **TabsTrigger** - tiene overflow implícito
3. **motion.div wrapper** - no tiene `overflow-visible`

El código actual ya tiene la imagen a `w-32 h-32` (128px) dentro de un contenedor de `w-16 h-16` (64px), pero las imágenes se están recortando en lugar de desbordar.

## Solución

Agregar `overflow-visible` y ajustar estilos en toda la cadena de contenedores para permitir que los íconos se desborden visualmente sin afectar el layout de los botones.

### Cambios en `src/components/CategoryTabs.tsx`:

1. **TabsList**: Cambiar de `overflow-x-auto` a `overflow-x-auto overflow-y-visible` para permitir desborde vertical mientras mantiene scroll horizontal

2. **motion.div wrapper** (línea 110-122): Agregar `overflow-visible` al contenedor de cada categoría

3. **TabsTrigger**: Agregar `overflow-visible` explícitamente en las clases

4. **Agregar padding vertical al TabsList**: Para dar espacio visual a los íconos que sobresalen (`py-4`)

### Código específico:

```tsx
// Línea 108 - TabsList
<TabsList ref={tabsListRef} className="w-full h-auto bg-transparent p-0 py-4 flex justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto overflow-y-visible scrollbar-hide pl-0">

// Línea 122 - motion.div wrapper  
className="flex-shrink-0 overflow-visible"

// Líneas 126-133 - TabsTrigger
className={cn(
  "flex flex-col items-center gap-2 md:gap-3 p-2 md:p-3",
  "data-[state=active]:bg-transparent data-[state=active]:text-primary",
  "text-muted-foreground bg-transparent",
  "rounded-none h-auto min-w-[70px] md:min-w-[90px]",
  "hover:text-primary transition-all duration-300",
  "border-b-0 shadow-none overflow-visible"  // <-- agregar overflow-visible
)}
```

## Resultado Esperado

Los íconos de las categorías serán el doble de su tamaño actual (128x128px en móvil, 160x160px en desktop) mientras los botones mantienen su tamaño original (64x64px / 80x80px). Los íconos "flotarán" visualmente sobre sus contenedores.
