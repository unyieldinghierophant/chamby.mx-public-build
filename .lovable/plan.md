

# Plan: Arreglar Animaciones y Carga del Landing Page

## Problemas Identificados

| Problema | Causa | Solución |
|----------|-------|----------|
| Fuente parpadea/cambia | Sin preload de la fuente Made Dillan | Agregar preload en index.html |
| Skeleton muy lento (800ms) | Delay artificial innecesario | Reducir a 0ms (sin skeleton artificial) |
| "Cosa blanca" en esquina | Corner glow effects muy grandes | Eliminar los corner glow effects |
| Partículas no visibles | Posicionamiento con % no funciona bien | Usar posición absoluta con left/top en px y z-index alto |
| Animaciones categorías no visibles | Animaciones muy sutiles | Hacer animaciones más obvias con mayor delay y movimiento |

---

## Archivos a Modificar

| Archivo | Cambios |
|---------|---------|
| `index.html` | Agregar preload de la fuente Made Dillan |
| `src/components/Hero.tsx` | Eliminar skeleton artificial, mostrar contenido inmediatamente |
| `src/components/HeroParticles.tsx` | Rediseñar partículas para que sean visibles, eliminar corner glows |
| `src/components/CategoryTabs.tsx` | Mejorar animaciones para que sean más obvias |
| `src/components/LandingPageSkeleton.tsx` | Mantener pero no usar (para futura referencia) |

---

## Cambios Detallados

### 1. Preload de Fuente (index.html)

Agregar en el `<head>` para cargar la fuente antes del render:
```html
<link rel="preload" href="/fonts/MADE_Dillan_PERSONAL_USE.otf" as="font" type="font/otf" crossorigin>
```

### 2. Eliminar Skeleton Artificial (Hero.tsx)

Eliminar el estado `isLoading` y el delay de 800ms. La página debe cargar inmediatamente sin esperar artificialmente:

- Eliminar `const [isLoading, setIsLoading] = useState(true);`
- Eliminar el `useEffect` con el timer
- Eliminar el `if (isLoading) return <LandingPageSkeleton />;`
- Eliminar la importación de `LandingPageSkeleton`

### 3. Rediseñar Partículas (HeroParticles.tsx)

Problemas actuales:
- Corner glows causan la "cosa blanca" en la esquina
- Las partículas usan posicionamiento % que no se renderiza bien
- z-index no está definido, quedan detrás del contenido

Nueva implementación:
- Eliminar TODOS los corner glow effects
- Usar partículas con posición CSS `left` y `top` en vez de transform
- Agregar z-index para que aparezcan sobre el fondo pero debajo del texto
- Reducir blur y aumentar opacidad para mejor visibilidad
- Usar colores más brillantes (white con mayor opacidad)

```tsx
export const HeroParticles = () => {
  const particles = useMemo(() => {
    return Array.from({ length: 30 }, (_, i) => ({
      id: i,
      left: Math.random() * 100,
      top: Math.random() * 100,
      size: Math.random() * 8 + 4, // 4-12px
      duration: Math.random() * 3 + 4, // 4-7s
      delay: Math.random() * 2,
    }));
  }, []);

  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none z-[1]">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full bg-white"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.size,
            height: p.size,
            boxShadow: '0 0 8px 2px rgba(255,255,255,0.6)',
          }}
          animate={{
            y: [-10, 10, -10],
            opacity: [0.4, 0.8, 0.4],
            scale: [0.8, 1.2, 0.8],
          }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: "easeInOut",
          }}
        />
      ))}
    </div>
  );
};
```

### 4. Mejorar Animaciones de Categorías (CategoryTabs.tsx)

Hacer las animaciones más visibles:

- Aumentar el delay entre categorías de `0.1s` a `0.15s`
- Aumentar el movimiento inicial de `x: -30` a `x: -50`
- Aumentar `y: 20` a `y: 30`
- Aumentar duración de `0.5s` a `0.6s`
- Para los service pills, aumentar `x: -20` a `x: -40`

Cambios en la animación de categorías:
```tsx
initial={{ opacity: 0, x: -50, y: 30 }}
animate={isVisible ? { 
  opacity: 1, 
  x: 0, 
  y: parallaxOffset,
} : {}}
transition={{
  delay: index * 0.15, // Más lento
  duration: 0.6, // Más duración
  ease: "easeOut",
}}
```

Cambios en service pills:
```tsx
variants={{
  hidden: { opacity: 0, x: -40, scale: 0.85 },
  visible: { 
    opacity: 1, 
    x: 0, 
    scale: 1,
    transition: { duration: 0.4, ease: "easeOut" }
  }
}}
```

---

## Estructura Visual de las Partículas

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│       ●            ●                  ●           ●            │
│                ●          HERO CARD          ●                  │
│    ●                                                    ●       │
│          ●    "Encuentra a los mejores..."    ●                │
│                     ●                                           │
│     ●                        ●                      ●          │
│              ●          [Search Bar]        ●                   │
│                   ●                    ●                        │
│         ●                 ●                    ●                │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘

● = Partícula flotante blanca con glow suave
   - Flotan verticalmente arriba/abajo
   - Pulse de opacidad (más brillantes y menos brillantes)
   - Distribuidas aleatoriamente por toda el área
```

---

## Resultado Esperado

1. **Sin parpadeo de fuente**: La fuente Made Dillan se precarga antes del render
2. **Carga instantánea**: No hay delay artificial, el contenido aparece inmediatamente
3. **Partículas visibles**: 30 partículas blancas brillantes flotando sobre el hero card
4. **Sin "cosa blanca"**: Los corner glow effects eliminados
5. **Animaciones de categorías obvias**: Las categorías entran una por una de izquierda a derecha con movimiento más pronunciado
6. **Service pills animados**: Los botones de servicio también entran con animación visible

---

## Compatibilidad Mobile/Desktop

- Las partículas usan posicionamiento relativo (%) que funciona en todos los tamaños
- Las animaciones de framer-motion son consistentes en todos los dispositivos
- El z-index asegura que las partículas aparezcan correctamente en ambas vistas

