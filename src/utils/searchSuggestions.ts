/**
 * Curated search suggestions engine for Chamby.
 *
 * – 130+ real-world job intents in natural Spanish (Guadalajara context)
 * – Tiered matching: prefix → contains → fuzzy (Levenshtein)
 * – Category-aware fallback when matches are sparse
 */

// ─── Category-tagged suggestions ──────────────────────────────────────────────

interface TaggedSuggestion {
  text: string;
  category: string;
}

const SUGGESTIONS: TaggedSuggestion[] = [
  // ── Fontanería ──
  { text: "Destapar mi baño", category: "fontaneria" },
  { text: "Destapar tubería", category: "fontaneria" },
  { text: "Destapar coladera", category: "fontaneria" },
  { text: "Destapar drenaje", category: "fontaneria" },
  { text: "Destapar WC", category: "fontaneria" },
  { text: "Reparar fuga de agua", category: "fontaneria" },
  { text: "Fuga en lavabo", category: "fontaneria" },
  { text: "Fuga en regadera", category: "fontaneria" },
  { text: "Fuga en tubería", category: "fontaneria" },
  { text: "Instalar boiler", category: "fontaneria" },
  { text: "Instalar calentador de agua", category: "fontaneria" },
  { text: "Instalar tinaco", category: "fontaneria" },
  { text: "Lavar tinaco", category: "fontaneria" },
  { text: "Reparar llave de agua", category: "fontaneria" },
  { text: "Cambiar llave mezcladora", category: "fontaneria" },
  { text: "Instalar bomba de agua", category: "fontaneria" },
  { text: "No tengo agua caliente", category: "fontaneria" },
  { text: "Poca presión de agua", category: "fontaneria" },
  { text: "Goteo en llave", category: "fontaneria" },
  { text: "Reparar WC", category: "fontaneria" },

  // ── Electricidad ──
  { text: "Instalar apagador", category: "electricidad" },
  { text: "Instalar contacto eléctrico", category: "electricidad" },
  { text: "Instalar lámpara", category: "electricidad" },
  { text: "Instalar ventilador de techo", category: "electricidad" },
  { text: "Instalar foco", category: "electricidad" },
  { text: "Reparar corto circuito", category: "electricidad" },
  { text: "No tengo luz", category: "electricidad" },
  { text: "Falla eléctrica", category: "electricidad" },
  { text: "Revisar tablero eléctrico", category: "electricidad" },
  { text: "Cambiar fusibles", category: "electricidad" },
  { text: "Cambiar breaker", category: "electricidad" },
  { text: "Enchufe no funciona", category: "electricidad" },
  { text: "Luz que parpadea", category: "electricidad" },
  { text: "Instalar timbre", category: "electricidad" },
  { text: "Cableado eléctrico", category: "electricidad" },

  // ── Jardinería ──
  { text: "Cortar el pasto", category: "jardineria" },
  { text: "Cortar árbol", category: "jardineria" },
  { text: "Podar árboles", category: "jardineria" },
  { text: "Podar arbustos", category: "jardineria" },
  { text: "Quitar un árbol", category: "jardineria" },
  { text: "Diseño de jardín", category: "jardineria" },
  { text: "Instalar sistema de riego", category: "jardineria" },
  { text: "Mantenimiento de jardín", category: "jardineria" },
  { text: "Plantar árboles", category: "jardineria" },
  { text: "Limpiar jardín", category: "jardineria" },
  { text: "Fumigar jardín", category: "jardineria" },
  { text: "Cortar césped", category: "jardineria" },
  { text: "Desmalezar terreno", category: "jardineria" },

  // ── Limpieza ──
  { text: "Limpieza de casa", category: "limpieza" },
  { text: "Limpieza profunda", category: "limpieza" },
  { text: "Limpieza de oficina", category: "limpieza" },
  { text: "Limpieza de alfombra", category: "limpieza" },
  { text: "Limpieza de vidrios", category: "limpieza" },
  { text: "Limpieza de cocina", category: "limpieza" },
  { text: "Limpieza de baño", category: "limpieza" },
  { text: "Limpieza después de obra", category: "limpieza" },
  { text: "Lavado de alfombra", category: "limpieza" },
  { text: "Lavado de colchón", category: "limpieza" },
  { text: "Lavado de muebles", category: "limpieza" },
  { text: "Lavado de cortinas", category: "limpieza" },
  { text: "Limpiar cochera", category: "limpieza" },
  { text: "Quitar basura", category: "limpieza" },
  { text: "Retiro de basura", category: "limpieza" },
  { text: "Llevarse basura", category: "limpieza" },
  { text: "Sacar basura", category: "limpieza" },
  { text: "Sacar escombro", category: "limpieza" },
  { text: "Retiro de escombro", category: "limpieza" },
  { text: "Sacar plantas", category: "limpieza" },
  { text: "Sacar llantas", category: "limpieza" },
  { text: "Sacar chatarra", category: "limpieza" },
  { text: "Retiro de chatarra", category: "limpieza" },

  // ── Handyman ──
  { text: "Colgar una TV", category: "handyman" },
  { text: "Colgar cuadros", category: "handyman" },
  { text: "Colgar repisas", category: "handyman" },
  { text: "Colgar espejo", category: "handyman" },
  { text: "Colgar cortinas", category: "handyman" },
  { text: "Instalar persianas", category: "handyman" },
  { text: "Armar muebles", category: "handyman" },
  { text: "Armar muebles de IKEA", category: "handyman" },
  { text: "Armar cama", category: "handyman" },
  { text: "Armar escritorio", category: "handyman" },
  { text: "Armar librero", category: "handyman" },
  { text: "Reparar puerta", category: "handyman" },
  { text: "Reparar ventana", category: "handyman" },
  { text: "Cambiar cerradura", category: "handyman" },
  { text: "Reparar bisagra", category: "handyman" },
  { text: "Reparar manija", category: "handyman" },
  { text: "Instalar chapa", category: "handyman" },
  { text: "Sellar ventana", category: "handyman" },
  { text: "Mover muebles", category: "handyman" },
  { text: "Arreglos menores", category: "handyman" },

  // ── Pintura ──
  { text: "Pintar pared", category: "pintura" },
  { text: "Pintar cuarto", category: "pintura" },
  { text: "Pintar recámara", category: "pintura" },
  { text: "Pintar sala", category: "pintura" },
  { text: "Pintar casa completa", category: "pintura" },
  { text: "Pintar fachada", category: "pintura" },
  { text: "Pintar exterior", category: "pintura" },
  { text: "Pintar interior", category: "pintura" },
  { text: "Retoques de pintura", category: "pintura" },
  { text: "Barnizar madera", category: "pintura" },
  { text: "Impermeabilizar techo", category: "pintura" },
  { text: "Pintar herrería", category: "pintura" },

  // ── Carpintería ──
  { text: "Reparar mueble de madera", category: "carpinteria" },
  { text: "Hacer closet a medida", category: "carpinteria" },
  { text: "Instalar piso laminado", category: "carpinteria" },
  { text: "Reparar piso de madera", category: "carpinteria" },
  { text: "Hacer puerta de madera", category: "carpinteria" },
  { text: "Reparar cajón", category: "carpinteria" },
  { text: "Hacer estante a medida", category: "carpinteria" },
  { text: "Instalar zoclo", category: "carpinteria" },

  // ── Mudanza ──
  { text: "Mudanza completa", category: "mudanza" },
  { text: "Mover refrigerador", category: "mudanza" },
  { text: "Mover lavadora", category: "mudanza" },
  { text: "Empacar para mudanza", category: "mudanza" },
  { text: "Acarreo de muebles", category: "mudanza" },

  // ── HVAC / Ventilación ──
  { text: "Instalar aire acondicionado", category: "hvac" },
  { text: "Reparar aire acondicionado", category: "hvac" },
  { text: "Mantenimiento de minisplit", category: "hvac" },
  { text: "Limpiar minisplit", category: "hvac" },
  { text: "Instalar ventilador", category: "hvac" },

  // ── Electrodomésticos ──
  { text: "Arreglar mi lavadora", category: "electrodomesticos" },
  { text: "Reparar lavadora", category: "electrodomesticos" },
  { text: "Reparar refrigerador", category: "electrodomesticos" },
  { text: "Reparar estufa", category: "electrodomesticos" },
  { text: "Reparar microondas", category: "electrodomesticos" },
  { text: "Reparar secadora", category: "electrodomesticos" },
  { text: "Instalar lavadora", category: "electrodomesticos" },
  { text: "Instalar secadora", category: "electrodomesticos" },

  // ── Auto y Lavado ──
  { text: "Lavar mi carro", category: "auto" },
  { text: "Lavado de auto completo", category: "auto" },
  { text: "Lavado interior de auto", category: "auto" },
  { text: "Lavado exterior de auto", category: "auto" },
  { text: "Aspirado de auto", category: "auto" },
  { text: "Encerado de auto", category: "auto" },
  { text: "Pulido de auto", category: "auto" },
  { text: "Detallado automotriz", category: "auto" },
  { text: "Cambiar batería de carro", category: "auto" },
  { text: "Cambiar llanta", category: "auto" },
];

// ── Generic high-conversion fallbacks ────────────────────────────────────────
const GENERIC_FALLBACKS: string[] = [
  "Reparación del hogar",
  "Limpieza de casa",
  "Instalar algo en mi casa",
  "Arreglo urgente",
  "Servicio de plomería",
];

// ── Normalize text (remove accents, lowercase) ──────────────────────────────
function normalize(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

// ── Levenshtein distance ────────────────────────────────────────────────────
function levenshtein(a: string, b: string): number {
  const m = a.length;
  const n = b.length;
  if (m === 0) return n;
  if (n === 0) return m;

  let prev = Array.from({ length: n + 1 }, (_, i) => i);
  let curr = new Array(n + 1);

  for (let i = 1; i <= m; i++) {
    curr[0] = i;
    for (let j = 1; j <= n; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      curr[j] = Math.min(
        prev[j] + 1,       // deletion
        curr[j - 1] + 1,   // insertion
        prev[j - 1] + cost  // substitution
      );
    }
    [prev, curr] = [curr, prev];
  }
  return prev[n];
}

// ── Scoring ─────────────────────────────────────────────────────────────────

interface ScoredSuggestion {
  text: string;
  category: string;
  score: number;
}

function scoreSuggestion(query: string, suggestion: TaggedSuggestion): number {
  const q = normalize(query);
  const t = normalize(suggestion.text);
  const words = q.split(/\s+/).filter(w => w.length > 0);

  let score = 0;

  // Tier 1 – Full prefix match (highest priority)
  if (t.startsWith(q)) {
    score += 1000;
  }

  // Tier 2 – Contains full query
  if (t.includes(q)) {
    score += 500;
  }

  // Tier 3 – Individual word matching
  for (const word of words) {
    if (word.length < 2) continue;

    // Prefix match on any word in the suggestion
    const suggestionWords = t.split(/\s+/);
    for (const sw of suggestionWords) {
      if (sw.startsWith(word)) {
        score += 200;
        break;
      }
    }

    // Contains match
    if (t.includes(word)) {
      score += 100;
    }

    // Fuzzy match for each word against suggestion words
    for (const sw of suggestionWords) {
      if (sw.length < 3) continue;
      const dist = levenshtein(word, sw);
      const maxLen = Math.max(word.length, sw.length);
      const similarity = 1 - dist / maxLen;
      if (similarity >= 0.6) {
        score += Math.round(similarity * 80);
      }
    }
  }

  return score;
}

// ── Public API ──────────────────────────────────────────────────────────────

export interface SearchSuggestion {
  text: string;
  category: string;
}

export function getSearchSuggestions(query: string, limit = 8): SearchSuggestion[] {
  if (!query || query.trim().length < 2) return [];

  // Score all suggestions
  const scored: ScoredSuggestion[] = SUGGESTIONS
    .map(s => ({ ...s, score: scoreSuggestion(query, s) }))
    .filter(s => s.score > 0)
    .sort((a, b) => b.score - a.score);

  const results: SearchSuggestion[] = scored
    .slice(0, limit)
    .map(({ text, category }) => ({ text, category }));

  // Fallback A: Fill with related items from inferred category
  if (results.length < limit && scored.length > 0) {
    const topCategory = scored[0].category;
    const existing = new Set(results.map(r => r.text));

    const related = SUGGESTIONS
      .filter(s => s.category === topCategory && !existing.has(s.text))
      .slice(0, limit - results.length)
      .map(({ text, category }) => ({ text, category }));

    results.push(...related);
  }

  // Fallback B: If still nearly empty, show generic suggestions
  if (results.length < 2) {
    const existing = new Set(results.map(r => r.text));
    const generics = GENERIC_FALLBACKS
      .filter(t => !existing.has(t))
      .slice(0, limit - results.length)
      .map(text => ({ text, category: "general" }));
    results.push(...generics);
  }

  return results.slice(0, limit);
}
