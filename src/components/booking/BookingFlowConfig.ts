// Config-driven booking flow.
//
// Every service (handyman, plumbing, etc.) is one config object. The unified
// BookingFlow component renders the same 5-step form + summary + checkout;
// only the service-specific strings and option labels vary.
//
// When adding a new service: create a new `*_CONFIG` export below and wire it
// up in BookJob.tsx based on categorySlug. Do not fork BookingFlow.tsx.

export interface BookingFlowConfig {
  /** Identity used in logs / keys. */
  serviceKey: string;
  /** Key passed to useFormPersistence (scopes saved drafts per service). */
  persistenceKey: string;

  // ---- Step 1: description ----
  /** Rotating placeholders shown as hints above the description textarea. */
  descriptionPlaceholders: string[];
  /** Static placeholder shown inside the textarea itself. */
  descriptionInputPlaceholder: string;
  /** Autofill suggestions filtered against the user's typed text. */
  suggestions: string[];

  /**
   * Optional keyword → work type mapping. When a user's description matches
   * one of these keywords, the corresponding work type is auto-selected.
   * Services without work-type classification can omit this.
   */
  workTypeKeywords?: Record<string, string[]>;

  // ---- Label maps (used in rich description + summary) ----
  labels: {
    /** e.g. reparacion → "Reparación" (used in both description and summary) */
    workType: Record<string, string>;
    /** Used in the rich description sent to providers. e.g. small → "Pequeño (≤ 1 hora)" */
    jobSize: Record<string, string>;
    /** Used in the summary card. e.g. small → "Pequeño · ≤ 1 hora" */
    jobSizeSummary: Record<string, string>;
    /** Default summary label when jobSize is not set. */
    jobSizeSummaryDefault: string;
    /** e.g. client → "Cliente tiene materiales" */
    materials: Record<string, string>;
    /** e.g. yes → "Sí tiene herramientas" */
    tools: Record<string, string>;
    /** e.g. perforate → "Requiere perforar pared" */
    importantDetails: Record<string, string>;
    /** e.g. apartment → "Departamento" */
    access: Record<string, string>;
    /** e.g. morning → "Mañana (8–12)" */
    timeWindow: Record<string, string>;
  };

  /** Shown in the summary when workType is null. */
  fallbackCategoryLabel: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// Handyman config (migrated verbatim from the former HandymanBookingFlow)
// ─────────────────────────────────────────────────────────────────────────────

export const HANDYMAN_CONFIG: BookingFlowConfig = {
  serviceKey: "handyman",
  persistenceKey: "handyman-booking",

  descriptionPlaceholders: [
    "Colgar una TV en la pared",
    "Armar un mueble de IKEA",
    "Reparar una puerta que no cierra",
    "Instalar repisas flotantes",
    "Ajustar cerraduras de la casa",
  ],
  descriptionInputPlaceholder:
    "Ej: Necesito colgar una TV de 55 pulgadas en pared de concreto...",

  suggestions: [
    "Colgar una TV", "Armar un mueble", "Reparar una puerta",
    "Instalar repisas", "Ajustar cerraduras", "Colgar cuadros",
    "Armar estante", "Reparar closet", "Instalar cortinas",
    "Cambiar chapas", "Instalar espejos", "Reparar bisagras",
    "Instalar barras de cortina", "Armar gabinetes", "Reparar cajones",
    "Instalar mosquiteros", "Parchear agujeros en pared", "Cambiar manijas",
    "Instalar ganchos y organizadores", "Reparar molduras",
    "Instalar persianas", "Armar escritorio", "Reparar sillas",
    "Instalar repisas flotantes", "Reparar ventanas",
  ],

  workTypeKeywords: {
    armado: ["armar", "ensamblar", "montar", "mueble", "muebles", "cama", "escritorio", "librero", "estante", "gabinete"],
    reparacion: ["reparar", "arreglar", "componer", "ajustar", "bisagra", "manija", "puerta", "ventana", "cajón", "cajones", "silla"],
    instalacion: ["instalar", "colgar", "colocar", "poner", "cortina", "persiana", "repisa", "espejo", "cuadro", "tv", "televisión", "barra", "mosquitero", "gancho"],
    ajuste: ["ajustar", "manteni", "calibrar", "chapa", "cerradura"],
  },

  labels: {
    workType: {
      reparacion: "Reparación",
      instalacion: "Instalación",
      armado: "Armado",
      ajuste: "Ajuste / Mantenimiento",
    },
    jobSize: {
      small: "Pequeño (≤ 1 hora)",
      medium: "Mediano (1–3 horas)",
      large: "Grande (3+ horas)",
    },
    jobSizeSummary: {
      small: "Pequeño · ≤ 1 hora",
      medium: "Mediano · 1–3 horas",
      large: "Grande · 3+ horas",
    },
    jobSizeSummaryDefault: "Mediano · 1–3 horas",
    materials: {
      client: "Cliente tiene materiales",
      provider: "Proveedor trae materiales",
      unsure: "No está seguro",
    },
    tools: {
      yes: "Sí tiene herramientas",
      no: "No tiene herramientas",
      unsure: "No sabe cuáles se necesitan",
    },
    importantDetails: {
      perforate: "Requiere perforar pared",
      measure: "Requiere medir/nivelar",
      height: "Trabajo en altura",
      tight_space: "Espacio reducido",
      move_furniture: "Requiere mover muebles",
    },
    access: {
      apartment: "Departamento",
      house: "Casa",
      ground_floor: "Planta baja",
      stairs: "Escaleras",
      elevator: "Elevador",
      restricted_hours: "Horarios restringidos",
    },
    timeWindow: {
      morning: "Mañana (8–12)",
      midday: "Mediodía (12–15)",
      afternoon: "Tarde (15–19)",
      night: "Noche (19–21)",
    },
  },

  fallbackCategoryLabel: "Servicio general",
};

/**
 * Resolve the correct config for a given category slug. Unknown slugs fall
 * back to Handyman so the booking flow always renders something usable.
 */
export function getBookingConfig(categorySlug: string | undefined | null): BookingFlowConfig {
  // All current categories route through the Handyman flow. Wire additional
  // service configs here as they're built.
  void categorySlug;
  return HANDYMAN_CONFIG;
}
