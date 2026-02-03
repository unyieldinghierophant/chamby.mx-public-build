

# Plan: Mostrar trabajos reales de la base de datos en el hero de proveedores

## Resumen
Modificar el componente `InteractiveHeroBackground` para que las tarjetas flotantes de trabajos ("Jardinería $450 Tlaquepaque") muestren datos reales de la base de datos en lugar de ejemplos inventados.

---

## Cambios a realizar

### 1. Crear un nuevo hook para obtener trabajos públicos
**Archivo nuevo:** `src/hooks/usePublicAvailableJobs.ts`

Este hook obtendrá los trabajos disponibles sin necesidad de autenticación (ya que el landing page puede ser visitado por usuarios no logueados).

- Consulta la tabla `jobs` filtrando por `status = 'active'` y `provider_id IS NULL`
- Selecciona solo los campos necesarios: `title`, `category`, `rate`, `location`
- Limita a los últimos 20 trabajos para no sobrecargar
- **No requiere autenticación** - usa la política RLS existente `jobs_new_select_active` que permite ver trabajos activos sin proveedor

### 2. Modificar el componente InteractiveHeroBackground
**Archivo:** `src/components/provider-portal/InteractiveHeroBackground.tsx`

**Cambios:**
1. Importar el nuevo hook `usePublicAvailableJobs`
2. Eliminar el array hardcodeado `JOB_TYPES`
3. Crear una función para extraer la ciudad de la dirección completa (ej: "Av Pablo Neruda 3117, Providencia 4a. Secc, 44639 Guadalajara, Jal., Mexico" → "Guadalajara")
4. Formatear el rate como precio (ej: `rate` → `$${rate}`)
5. Si no hay trabajos en la BD, mostrar un fallback mínimo o no mostrar tarjetas

**Formato de las tarjetas resultante:**
- Actual: `Jardinería · $450 Tlaquepaque` (datos falsos)
- Nuevo: `Instalación de enchufes · $1 Guadalajara` (datos reales)

---

## Detalles técnicos

### Extracción de ciudad
La dirección viene en formato: `"Calle, Colonia, CP Ciudad, Estado, País"`

Usaré una función que:
1. Divide la dirección por comas
2. Busca el segmento que contiene el código postal (5 dígitos seguidos de espacio y ciudad)
3. Extrae solo el nombre de la ciudad

```typescript
const extractCity = (location: string | null): string => {
  if (!location) return 'México';
  
  // Buscar patrón: "44639 Guadalajara" o similar
  const match = location.match(/\d{5}\s+([^,]+)/);
  if (match) return match[1].trim();
  
  // Fallback: último segmento antes del país
  const parts = location.split(',');
  if (parts.length >= 2) {
    const cityPart = parts[parts.length - 3] || parts[parts.length - 2];
    return cityPart.replace(/\d+/g, '').trim() || 'México';
  }
  
  return 'México';
};
```

### Hook público para trabajos

```typescript
export const usePublicAvailableJobs = () => {
  const [jobs, setJobs] = useState<PublicJob[]>([]);
  
  useEffect(() => {
    const fetchJobs = async () => {
      const { data } = await supabase
        .from('jobs')
        .select('title, category, rate, location')
        .eq('status', 'active')
        .is('provider_id', null)
        .order('created_at', { ascending: false })
        .limit(20);
      
      if (data) setJobs(data);
    };
    
    fetchJobs();
  }, []);
  
  return jobs;
};
```

---

## Archivos afectados

| Archivo | Acción |
|---------|--------|
| `src/hooks/usePublicAvailableJobs.ts` | Crear nuevo |
| `src/components/provider-portal/InteractiveHeroBackground.tsx` | Modificar |

---

## Consideraciones

1. **Performance:** El hook solo se ejecuta una vez al montar el componente, no en cada render
2. **Fallback:** Si no hay trabajos en la BD, las tarjetas simplemente no aparecerán (el componente sigue funcionando con los puntos brillantes)
3. **RLS:** La política `jobs_new_select_active` ya permite lectura pública de trabajos activos sin proveedor, por lo que no se requieren cambios de base de datos

