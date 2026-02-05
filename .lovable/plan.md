
# Plan: Corregir Search Bar en User Landing para Usuarios Logueados

## Problema Identificado
El usuario logueado ve un botón "Buscar Servicio" en lugar del nuevo search bar interactivo con borde gradient en la página `/user-landing`. El componente `HeroSearchBar` existe y está importado, pero no se muestra correctamente.

## Diagnóstico
Después de revisar el código:
- `HeroSearchBar.tsx` existe y está correctamente implementado con el borde gradient rotativo
- `UserLanding.tsx` importa y usa `HeroSearchBar` en línea 276
- Sin embargo, el usuario sigue viendo un botón en lugar del search bar

Posibles causas:
1. El archivo `UserLanding.tsx` podría no estar actualizado (caché o sincronización)
2. Podría haber un error de renderizado silencioso en el componente

## Solución

### 1. Verificar y Re-escribir UserLanding.tsx
Asegurar que el componente `HeroSearchBar` esté correctamente integrado, removiendo cualquier posible código duplicado o conflicto

### 2. Mejorar HeroSearchBar con mejor visibilidad
Asegurar que el search bar sea prominente y visible:
- Fondo blanco sólido para contraste en el hero azul
- Tamaño apropiado (h-14 como está actualmente)
- Borde gradient visible

### 3. Remover cualquier Button legacy
Verificar que no haya ningún `<Button>` de "Buscar Servicio" en el hero del UserLanding

## Cambios Específicos

### src/pages/UserLanding.tsx
- Confirmar que usa `HeroSearchBar` y no un botón
- Verificar que no hay condicionalmente un botón mostrándose
- Asegurar que el import está correcto: `import { HeroSearchBar } from "@/components/HeroSearchBar";`

### src/components/HeroSearchBar.tsx  
- Verificar exportaciones (named y default)
- Asegurar visibilidad del componente con estilos apropiados

## Verificación Visual
El search bar en el hero debería verse así:
- Caja de input blanca con borde gradient rotativo
- Placeholder con animación de typing
- Icono de búsqueda a la izquierda
- Botón con flecha a la derecha
- Dropdown de sugerencias al hacer click/focus

## Archivos a Revisar/Modificar
1. `src/pages/UserLanding.tsx` - Confirmar uso de HeroSearchBar
2. `src/components/HeroSearchBar.tsx` - Verificar exportaciones correctas
