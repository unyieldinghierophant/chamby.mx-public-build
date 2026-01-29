
# Plan: Agregar Gradiente Animado Sutil al Hero de /user-landing

## Objetivo
Agregar un gradiente animado sutil en tonos azules de la paleta Chamby al fondo del hero section en la página `/user-landing`, sin reducir la legibilidad del texto blanco.

---

## Análisis Actual

El hero section usa el componente `InteractiveHeroBackground` que tiene:
- Gradiente base: `bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,40%)]`
- Overlay radial para profundidad
- Grid pattern sutil
- Puntos flotantes y tarjetas de trabajo

**Paleta de Chamby (tonos azules):**
- Primary: `hsl(214 80% 41%)` - Azul principal
- Primary Light: `hsl(214 80% 55%)` - Azul claro
- Primary Dark: `hsl(214 80% 30%)` - Azul oscuro
- También: `hsl(221 83% 40%)` ya usado en el gradiente actual

---

## Cambios Propuestos

### Archivo: `src/components/provider-portal/InteractiveHeroBackground.tsx`

Agregar una capa de gradiente animado sutil entre el gradiente base y los overlays. El gradiente:

1. **Animación suave de 20-30 segundos** - Muy lenta para no distraer
2. **Baja opacidad (10-20%)** - Para no afectar legibilidad
3. **Múltiples tonos azules de la paleta** - Primary, primary-light, primary-dark
4. **Movimiento radial** - Simula una aurora o nebulosa suave

**Nueva capa a agregar (después de línea 336, antes de las overlays):**

```tsx
{/* Animated gradient overlay - subtle blue aurora effect */}
<div 
  className="absolute inset-0 opacity-20 animate-gradient-shift"
  style={{
    background: `
      radial-gradient(ellipse 80% 50% at 20% 40%, hsl(214 80% 55% / 0.4), transparent 50%),
      radial-gradient(ellipse 60% 40% at 80% 60%, hsl(214 80% 30% / 0.3), transparent 50%),
      radial-gradient(ellipse 50% 60% at 50% 80%, hsl(221 83% 45% / 0.25), transparent 45%)
    `,
    backgroundSize: '200% 200%',
  }}
/>
```

### Archivo: `tailwind.config.ts`

El `animate-gradient-shift` ya existe con duración de `3000s` (línea 214), lo cual es perfecto para una animación muy lenta y sutil.

---

## Visualización del Resultado

```text
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│    ┌─────────────────────────────────────────────────────────┐  │
│    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░░▓▓▓▓░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░▓▓▓▓▓▓░░░ SOLUCIONA EN ░░░░░░░░░░░░░░░░░▒▒▒░░░░░░░ │  │
│    │ ░░░░░▓▓▓▓░░░░ MINUTOS NO ░░░░░░░░░░░░░░░░░░▒▒▒▒▒░░░░░░ │  │
│    │ ░░░░░░░░░░░░░░ EN DÍAS. ░░░░░░░░░░░░░░░░░░░░▒▒▒░░░░░░░ │  │
│    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░░░░░░░░░░ [Buscar Servicio →] ░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░░░░░░░░░░░░░░░░░░▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░░░░░░░░░░░░░░░░░▒▒▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    │ ░░░░░░░░░░░░░░░░░░░░░▒▒▒░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░░ │  │
│    └─────────────────────────────────────────────────────────┘  │
│                                                                 │
│    ▓▓▓ = Gradiente azul claro (primary-light) - esquina sup izq│
│    ▒▒▒ = Gradiente azul oscuro (primary-dark) - zonas sutiles  │
│    ░░░ = Color base primary                                     │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Archivo a Modificar

| Archivo | Cambio |
|---------|--------|
| `src/components/provider-portal/InteractiveHeroBackground.tsx` | Agregar capa de gradiente animado sutil entre el gradiente base y los overlays |

---

## Detalles Técnicos

**Posición en el componente (después de línea 336):**
```tsx
{/* Deep blue gradient base */}
<div className="absolute inset-0 bg-gradient-to-br from-primary via-primary to-[hsl(221,83%,40%)]" />

{/* NEW: Animated gradient overlay - subtle blue aurora */}
<div 
  className="absolute inset-0 opacity-15 pointer-events-none"
  style={{
    background: `
      radial-gradient(ellipse 80% 50% at 20% 40%, hsl(214 80% 55% / 0.5), transparent 50%),
      radial-gradient(ellipse 60% 40% at 80% 60%, hsl(214 80% 30% / 0.4), transparent 50%),
      radial-gradient(ellipse 50% 60% at 50% 85%, hsl(221 83% 45% / 0.35), transparent 45%)
    `,
    backgroundSize: '200% 200%',
    animation: 'gradient-shift 25s ease-in-out infinite',
  }}
/>

{/* Subtle radial overlay for depth */}
<div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.2)_100%)]" />
```

**Propiedades clave:**
- `opacity-15` - Muy sutil para no afectar legibilidad
- Tres elipses radiales en diferentes posiciones y tamaños
- Animación de 25 segundos, muy lenta
- Usa exactamente los colores de la paleta Chamby
- `pointer-events-none` para no interferir con interacciones

---

## Resultado Esperado

1. **Efecto visual sutil** - Una especie de "aurora" o "nebulosa" muy suave que se mueve lentamente
2. **Legibilidad intacta** - El texto blanco sigue siendo perfectamente legible
3. **Consistencia de marca** - Solo usa tonos azules de la paleta Chamby
4. **Rendimiento** - Animación CSS pura, sin impacto en rendimiento
5. **Responsivo** - Funciona igual en mobile y desktop

