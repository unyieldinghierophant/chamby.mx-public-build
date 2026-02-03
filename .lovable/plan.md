
# Plan: Arreglar Iconos de Categoría, Clicks, y Espaciado

## Problemas Identificados

Analicé la captura de pantalla y el código actual:

1. **Los íconos siguen pequeños**: El `overflow-visible` no funciona porque el contenedor padre Hero tiene `overflow-hidden` (línea 17 de Hero.tsx). La solución es usar `transform: scale()` que ignora los límites de overflow
2. **Clicks no funcionan**: El z-index de los botones es bajo y las áreas de hover/motion pueden interferir
3. **Falta espacio a la izquierda de Handyman**: El TabsList tiene `pl-0` que elimina todo el padding izquierdo

---

## Cambios a Realizar en `src/components/CategoryTabs.tsx`

### 1. Hacer los íconos 100% más grandes con CSS Transform

Usar `transform: scale(2)` en lugar de hacer la imagen más grande. Los transforms CSS ignoran el overflow de los contenedores padres.

**Antes:**
```tsx
<img 
  src={category.icon} 
  className="w-32 h-32 md:w-40 md:h-40 object-contain"
/>
```

**Después:**
```tsx
<img 
  src={category.icon} 
  alt={category.name} 
  className="w-16 h-16 md:w-20 md:h-20 object-contain transform scale-[2]"
  style={{ imageRendering: 'auto' }}
/>
```

Esto hace que la imagen sea del mismo tamaño base que su contenedor pero se escala visualmente al doble.

### 2. Arreglar los clicks con z-index y pointer-events

**En TabsList (línea 108):**
- Agregar `relative z-20` para establecer contexto de apilamiento
- Agregar `pl-4` para dar espacio a Handyman en móvil

**En motion.div wrapper (línea 110-122):**
- Agregar `relative z-10` para asegurar clics

**En TabsTrigger:**
- Agregar `cursor-pointer relative z-10` para asegurar que sea clickeable

### 3. Agregar más espacio a la izquierda de Handyman

Cambiar `pl-0` a `pl-4` en el TabsList para dar ~1cm de margen en móvil.

---

## Código Específico

### Línea 108 - TabsList:
```tsx
<TabsList ref={tabsListRef} className="w-full h-auto bg-transparent p-0 py-6 flex justify-start md:justify-center gap-6 md:gap-10 overflow-x-auto overflow-y-visible scrollbar-hide pl-4 relative z-20">
```

### Línea 122 - motion.div wrapper:
```tsx
className="flex-shrink-0 overflow-visible relative z-10"
```

### Líneas 126-133 - TabsTrigger:
```tsx
className={cn(
  "flex flex-col items-center gap-2 md:gap-3 p-2 md:p-3",
  "data-[state=active]:bg-transparent data-[state=active]:text-primary",
  "text-muted-foreground bg-transparent",
  "rounded-none h-auto min-w-[70px] md:min-w-[90px]",
  "hover:text-primary transition-all duration-300",
  "border-b-0 shadow-none overflow-visible cursor-pointer relative z-10"
)}
```

### Líneas 140-145 - Imagen con scale:
```tsx
<img 
  src={category.icon} 
  alt={category.name} 
  className="w-16 h-16 md:w-20 md:h-20 object-contain transform scale-[2]"
  style={{ imageRendering: 'auto' }}
/>
```

---

## Por Qué Esto Funcionará

| Problema | Solución | Por qué funciona |
|----------|----------|------------------|
| Íconos recortados | `transform: scale(2)` | Los transforms CSS no afectan el layout y no respetan overflow |
| Clicks no funcionan | `z-index` y `relative` | Crea contexto de apilamiento propio |
| Falta espacio izquierdo | `pl-4` en TabsList | Agrega ~16px de padding (1cm aprox) |

## Resultado Esperado

- Íconos visualmente 2x más grandes (128x128px en móvil, 160x160px en desktop)
- Todos los botones clickeables consistentemente en móvil y desktop
- Handyman con ~1cm de espacio desde el borde izquierdo de la pantalla
