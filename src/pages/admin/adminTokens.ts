// Chamby admin design tokens — matches the Chamby brand palette
// (primary blue #1456DB, secondary orange #E86C25).
export const A = {
  bg: '#FAFAF8',
  surface: '#FFFFFF',
  border: '#E8E7E4',
  borderHover: '#D4D3D0',
  textPrimary: '#1A1A18',
  textSecondary: '#6B6A66',
  textTertiary: '#9C9B97',
  accent: '#1456DB',        // Chamby primary blue
  accentLight: '#E6EEFB',   // light blue surface for selected rows / chips
  accentText: '#0F47B8',    // readable blue for text on accentLight
  brandOrange: '#E86C25',   // Chamby secondary, reserved for hero accents
  rowHover: '#F5F5F2',
  fontSans: "'DM Sans', sans-serif",
  fontMono: "'DM Mono', monospace",
} as const;

export const ADMIN_ID = '30c2aa13-4338-44ca-8c74-d60421ed9bfc';

export type AdminView =
  | 'resumen' | 'trabajos' | 'reagendamientos'
  | 'disputas' | 'cancelaciones'
  | 'usuarios' | 'proveedores' | 'pagos' | 'soporte'
  | 'registro' | 'configuracion';

// Status pill config
export const STATUS_PILLS: Record<string, { bg: string; text: string; dot: string; label: string }> = {
  draft:          { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: 'Borrador' },
  searching:      { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'Buscando' },
  pending:        { bg: '#FDF6E8', text: '#7A5A12', dot: '#A67B1A', label: 'Pendiente' },
  assigned:       { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'Asignado' },
  on_site:        { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'En sitio' },
  quoted:         { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'Cotizado' },
  quote_accepted: { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Aceptado' },
  quote_rejected: { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Rechazado' },
  job_paid:       { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Pagado' },
  in_progress:    { bg: '#EBF4FF', text: '#1E4E7A', dot: '#2563EB', label: 'En progreso' },
  provider_done:  { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Terminado' },
  completed:      { bg: '#E8F0EB', text: '#1E4A2F', dot: '#2B5A3D', label: 'Completado' },
  cancelled:      { bg: '#FBF0EE', text: '#922E24', dot: '#C4473A', label: 'Cancelado' },
  disputed:       { bg: '#FBF0F6', text: '#7A2C54', dot: '#B24B8A', label: 'En disputa' },
  no_match:       { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: 'Sin match' },
};

export function statusPill(status: string) {
  return STATUS_PILLS[status] ?? { bg: '#F0EFEC', text: '#6B6A66', dot: '#9C9B97', label: status };
}

export function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'ahora';
  if (mins < 60) return `hace ${mins} min`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `hace ${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `hace ${days}d`;
}

export function fmtMXN(cents: number): string {
  return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(cents / 100);
}

export function fmtDate(iso: string | null): string {
  if (!iso) return '—';
  return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export const DOT_COLORS: Record<string, string> = {
  dispute_opened:     '#C4473A',
  late_cancellation:  '#A67B1A',
  cancellation_request: '#A67B1A',
  reschedule_request: '#2563EB',
};
export function dotColor(type: string): string {
  return DOT_COLORS[type] ?? '#2B5A3D';
}

export const startOfWeek = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d.toISOString();
};

export const startOfMonth = () => {
  const d = new Date();
  d.setDate(1);
  d.setHours(0, 0, 0, 0);
  return d.toISOString();
};
