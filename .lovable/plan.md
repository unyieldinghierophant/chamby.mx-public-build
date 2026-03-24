
## Fix: icono de “Electrodomésticos” sigue mostrando el de aire acondicionado

### Causa real
No parece ser un problema de caché. En `src/components/CategoryTabs.tsx` la categoría visible de **Electrodomésticos** usa el slug `'aire-acondicionado'`, pero en `SLUG_ICON_MAP` ese slug todavía apunta a:

```ts
'aire-acondicionado': categoryAC
```

O sea: aunque el texto ya dice “Electrodomésticos”, el código sigue renderizando el icono viejo de aire acondicionado.

### Cambio a hacer
**Archivo:** `src/components/CategoryTabs.tsx`

1. Cambiar el mapeo del slug `'aire-acondicionado'` para que use `categoryElectrodomesticos` en vez de `categoryAC`.
2. Mantener el label visible como **Electrodomésticos**.
3. Dejar el hero actual igual, a menos que quieras también cambiar la imagen grande del bloque inferior.
4. Limpiar imports/preload si `categoryAC` deja de usarse como icono.

### Implementación esperada
Quedaría así conceptualmente:

```ts
const SLUG_ICON_MAP = {
  ...
  'aire-acondicionado': categoryElectrodomesticos,
  ...
}
```

### Por qué esto lo arregla
La UI no decide el icono por el texto “Electrodomésticos”; lo decide por el slug. Y hoy ese slug sigue conectado al asset equivocado.

### Alcance
- No hace falta cambiar sitemap, base de datos ni backend.
- No es un bug del navegador.
- Es un bug de mapeo en frontend, localizado en un solo archivo.

### Verificación
Después del cambio, la pestaña que hoy dice **Electrodomésticos** debe mostrar el nuevo icono que subiste, sin depender de limpiar caché otra vez.

### Detalle técnico
Hoy existen dos rutas de icono en el mismo archivo:
- `'aire-acondicionado' -> categoryAC`
- `'electrodomesticos' -> categoryElectrodomesticos`

Pero la categoría visible en `VISIBLE_SLUGS_ORDERED` usa `'aire-acondicionado'`, no `'electrodomesticos'`. Por eso nunca se está usando el icono nuevo.
