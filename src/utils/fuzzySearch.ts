export interface SearchableService {
  id: string;
  name: string;
  category: string;
  keywords: string[];
}

export const services: SearchableService[] = [
  {
    id: "limpieza",
    name: "Limpieza del hogar",
    category: "Limpieza",
    keywords: ["limpieza", "limpiar", "hogar", "casa", "domestica", "cleaning"]
  },
  {
    id: "plomeria",
    name: "Plomería",
    category: "Reparaciones",
    keywords: ["plomeria", "plomero", "tuberia", "agua", "baño", "cocina", "fuga"]
  },
  {
    id: "electricidad",
    name: "Electricidad",
    category: "Reparaciones",
    keywords: ["electricidad", "electricista", "luz", "cables", "instalacion"]
  },
  {
    id: "jardineria",
    name: "Jardinería",
    category: "Jardinería", 
    keywords: ["jardin", "jardineria", "plantas", "poda", "jardinero", "verde"]
  },
  {
    id: "pintura",
    name: "Pintura",
    category: "Reparaciones",
    keywords: ["pintura", "pintar", "pared", "color", "brocha"]
  },
  {
    id: "carpinteria",
    name: "Carpintería",
    category: "Reparaciones", 
    keywords: ["carpinteria", "carpintero", "madera", "muebles", "reparar"]
  }
];

export function fuzzySearch(query: string, services: SearchableService[]): SearchableService[] {
  if (!query.trim()) return services;
  
  const normalizedQuery = query.toLowerCase().trim();
  
  return services
    .map(service => ({
      service,
      score: calculateScore(normalizedQuery, service)
    }))
    .filter(item => item.score > 0)
    .sort((a, b) => b.score - a.score)
    .map(item => item.service);
}

function calculateScore(query: string, service: SearchableService): number {
  let score = 0;
  const queryWords = query.split(/\s+/);
  
  // Check exact matches in name
  if (service.name.toLowerCase().includes(query)) {
    score += 100;
  }
  
  // Check exact matches in category
  if (service.category.toLowerCase().includes(query)) {
    score += 80;
  }
  
  // Check keywords
  service.keywords.forEach(keyword => {
    if (keyword.includes(query)) {
      score += 60;
    }
    
    // Check partial matches for each query word
    queryWords.forEach(word => {
      if (word.length > 2 && keyword.includes(word)) {
        score += 30;
      }
    });
  });
  
  // Check fuzzy matches (character similarity)
  queryWords.forEach(word => {
    service.keywords.forEach(keyword => {
      const similarity = calculateSimilarity(word, keyword);
      if (similarity > 0.6) {
        score += Math.floor(similarity * 20);
      }
    });
  });
  
  return score;
}

function calculateSimilarity(a: string, b: string): number {
  const longer = a.length > b.length ? a : b;
  const shorter = a.length > b.length ? b : a;
  
  if (longer.length === 0) return 1.0;
  
  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix = Array(str2.length + 1).fill(null).map(() => Array(str1.length + 1).fill(null));
  
  for (let i = 0; i <= str1.length; i++) {
    matrix[0][i] = i;
  }
  
  for (let j = 0; j <= str2.length; j++) {
    matrix[j][0] = j;
  }
  
  for (let j = 1; j <= str2.length; j++) {
    for (let i = 1; i <= str1.length; i++) {
      if (str1[i - 1] === str2[j - 1]) {
        matrix[j][i] = matrix[j - 1][i - 1];
      } else {
        matrix[j][i] = Math.min(
          matrix[j - 1][i - 1] + 1, // substitution
          matrix[j][i - 1] + 1,     // insertion
          matrix[j - 1][i] + 1      // deletion
        );
      }
    }
  }
  
  return matrix[str2.length][str1.length];
}