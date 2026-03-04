/**
 * jobStateMachine.ts — Single Source of Truth for all job statuses.
 * Every query, badge, and transition MUST import from here.
 */

export const JOB_STATES = {
  PENDING: 'pending',
  SEARCHING: 'searching',
  ASSIGNED: 'assigned',
  ON_SITE: 'on_site',
  QUOTED: 'quoted',
  QUOTE_ACCEPTED: 'quote_accepted',
  QUOTE_REJECTED: 'quote_rejected',
  JOB_PAID: 'job_paid',
  IN_PROGRESS: 'in_progress',
  PROVIDER_DONE: 'provider_done',
  COMPLETED: 'completed',
  CANCELLED: 'cancelled',
  DISPUTED: 'disputed',
  NO_MATCH: 'no_match',
} as const;

export type JobStatus = typeof JOB_STATES[keyof typeof JOB_STATES];

export const TERMINAL_STATES: JobStatus[] = ['completed', 'cancelled'];

export const CLIENT_ACTIVE_STATES: JobStatus[] = [
  'pending', 'searching', 'assigned', 'on_site', 'quoted',
  'quote_accepted', 'job_paid', 'in_progress', 'provider_done',
];

export const PROVIDER_ACTIVE_STATES: JobStatus[] = [
  'assigned', 'on_site', 'quoted', 'quote_accepted',
  'job_paid', 'in_progress', 'provider_done',
];

export const VALID_TRANSITIONS: Record<string, string[]> = {
  pending:         ['searching', 'cancelled'],
  searching:       ['assigned', 'no_match', 'cancelled'],
  assigned:        ['on_site', 'cancelled', 'disputed'],
  on_site:         ['quoted', 'disputed'],
  quoted:          ['quote_accepted', 'quote_rejected', 'disputed'],
  quote_accepted:  ['job_paid', 'cancelled'],
  quote_rejected:  ['cancelled'],
  job_paid:        ['in_progress'],
  in_progress:     ['provider_done', 'disputed'],
  provider_done:   ['completed', 'disputed'],
  completed:       [],
  cancelled:       [],
  no_match:        ['cancelled'],
  disputed:        ['completed', 'cancelled'],
};

export function canTransition(from: string, to: string): boolean {
  return (VALID_TRANSITIONS[from] || []).includes(to);
}

export function isTerminal(status: string): boolean {
  return TERMINAL_STATES.includes(status as JobStatus);
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    pending: 'Pendiente',
    searching: 'Buscando proveedor',
    assigned: 'Proveedor asignado',
    on_site: 'En sitio',
    quoted: 'Cotizado',
    quote_accepted: 'Cotización aceptada',
    quote_rejected: 'Cotización rechazada',
    job_paid: 'Pagado',
    in_progress: 'En progreso',
    provider_done: 'Trabajo terminado',
    completed: 'Completado',
    cancelled: 'Cancelado',
    disputed: 'En disputa',
    no_match: 'Sin proveedor',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    pending: 'bg-gray-100 text-gray-700',
    searching: 'bg-blue-100 text-blue-700',
    assigned: 'bg-indigo-100 text-indigo-700',
    on_site: 'bg-purple-100 text-purple-700',
    quoted: 'bg-yellow-100 text-yellow-700',
    quote_accepted: 'bg-emerald-100 text-emerald-700',
    quote_rejected: 'bg-red-100 text-red-700',
    job_paid: 'bg-green-100 text-green-700',
    in_progress: 'bg-orange-100 text-orange-700',
    provider_done: 'bg-teal-100 text-teal-700',
    completed: 'bg-green-200 text-green-800',
    cancelled: 'bg-red-200 text-red-800',
    disputed: 'bg-red-100 text-red-700',
    no_match: 'bg-gray-200 text-gray-600',
  };
  return colors[status] || 'bg-gray-100 text-gray-700';
}

/** Structured config for badge rendering (border included) */
export const JOB_STATUS_CONFIG: Record<string, { bg: string; text: string; border: string }> = {
  pending:         { bg: 'bg-gray-100', text: 'text-gray-700', border: 'border-gray-300' },
  searching:       { bg: 'bg-blue-100', text: 'text-blue-700', border: 'border-blue-300' },
  assigned:        { bg: 'bg-indigo-100', text: 'text-indigo-700', border: 'border-indigo-300' },
  on_site:         { bg: 'bg-purple-100', text: 'text-purple-700', border: 'border-purple-300' },
  quoted:          { bg: 'bg-yellow-100', text: 'text-yellow-700', border: 'border-yellow-300' },
  quote_accepted:  { bg: 'bg-emerald-100', text: 'text-emerald-700', border: 'border-emerald-300' },
  quote_rejected:  { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  job_paid:        { bg: 'bg-green-100', text: 'text-green-700', border: 'border-green-300' },
  in_progress:     { bg: 'bg-orange-100', text: 'text-orange-700', border: 'border-orange-300' },
  provider_done:   { bg: 'bg-teal-100', text: 'text-teal-700', border: 'border-teal-300' },
  completed:       { bg: 'bg-green-200', text: 'text-green-800', border: 'border-green-400' },
  cancelled:       { bg: 'bg-red-200', text: 'text-red-800', border: 'border-red-400' },
  disputed:        { bg: 'bg-red-100', text: 'text-red-700', border: 'border-red-300' },
  no_match:        { bg: 'bg-gray-200', text: 'text-gray-600', border: 'border-gray-300' },
};

/** System messages for chat when transitioning */
export const SYSTEM_MESSAGES: Record<string, { emoji: string; text: string }> = {
  searching:       { emoji: '🔍', text: 'Estamos buscando un proveedor disponible' },
  assigned:        { emoji: '✅', text: 'El proveedor aceptó el trabajo' },
  on_site:         { emoji: '📌', text: 'El proveedor llegó al sitio' },
  quoted:          { emoji: '🧾', text: 'El proveedor envió una cotización' },
  quote_accepted:  { emoji: '👍', text: 'La cotización fue aceptada' },
  quote_rejected:  { emoji: '👎', text: 'La cotización fue rechazada' },
  job_paid:        { emoji: '💳', text: 'El pago del trabajo fue confirmado' },
  in_progress:     { emoji: '🛠️', text: 'El trabajo comenzó' },
  provider_done:   { emoji: '✔️', text: 'El proveedor marcó el trabajo como terminado' },
  completed:       { emoji: '🎉', text: 'El trabajo fue completado correctamente' },
  cancelled:       { emoji: '❌', text: 'El trabajo fue cancelado' },
  no_match:        { emoji: '⏰', text: 'No se encontró proveedor disponible' },
  disputed:        { emoji: '⚠️', text: 'Se abrió una disputa sobre este trabajo' },
};
