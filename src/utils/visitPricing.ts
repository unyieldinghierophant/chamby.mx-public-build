/**
 * Visit Fee Pricing — Re-exports from canonical pricing engine.
 *
 * This file exists for backward compatibility. All constants
 * are derived from `src/lib/pricing.ts` (single source of truth).
 *
 * Pricing model v3:
 *   Customer pays $429.00 MXN total (visit fee including IVA + Stripe).
 *   Provider payout: $250.00 | Chamby commission: $100.00.
 */

import {
  VISIT_BASE_CENTS,
  VISIT_STRIPE_FEE_CENTS,
  VISIT_SUBTOTAL_CENTS,
  VAT_RATE,
  VISIT_VAT_CENTS,
  VISIT_FEE_CLIENT_CENTS,
  VISIT_FEE_PROVIDER_NET_CENTS,
  VISIT_FEE_CHAMBY_NET_CENTS,
  formatMXNShort,
  formatPesosMXN as _formatPesosMXN,
} from '@/lib/pricing';

// ── Core constants (centavos) — re-exported ─────────────────
export const VISIT_BASE_FEE_CENTS    = VISIT_BASE_CENTS;
export const STRIPE_FEE_CENTS        = VISIT_STRIPE_FEE_CENTS;
export const SUBTOTAL_CENTS          = VISIT_SUBTOTAL_CENTS;
export { VAT_RATE as IVA_RATE };
export const IVA_AMOUNT_CENTS        = VISIT_VAT_CENTS;
export const CUSTOMER_TOTAL_CENTS    = VISIT_FEE_CLIENT_CENTS;   // $429.00
export const PROVIDER_PAYOUT_CENTS   = VISIT_FEE_PROVIDER_NET_CENTS;
export const CHAMBY_COMMISSION_CENTS = VISIT_FEE_CHAMBY_NET_CENTS;

// ── Derived display values (pesos) ──────────────────────────
export const SUBTOTAL         = SUBTOTAL_CENTS         / 100;
export const IVA_AMOUNT       = IVA_AMOUNT_CENTS       / 100;
export const CUSTOMER_TOTAL   = CUSTOMER_TOTAL_CENTS   / 100; // 429
export const PROVIDER_PAYOUT  = PROVIDER_PAYOUT_CENTS  / 100; // 250
export const CHAMBY_COMMISSION = CHAMBY_COMMISSION_CENTS / 100; // 100

// ── Formatters ──────────────────────────────────────────────

/** Format centavos → "$429.00" */
export const formatCentavos = (centavos: number): string =>
  formatMXNShort(centavos);

/** Format pesos → "$429.00" */
export const formatPesos = (pesos: number): string =>
  `$${pesos.toFixed(2)}`;

/** Format pesos → "$429.00 MXN" */
export const formatPesosMXN = (pesos: number): string =>
  _formatPesosMXN(pesos);

// ── Pre-formatted strings ───────────────────────────────────
export const DISPLAY = {
  subtotal:        formatPesosMXN(SUBTOTAL),
  iva:             formatPesosMXN(IVA_AMOUNT),
  customerTotal:   formatPesosMXN(CUSTOMER_TOTAL),      // "$429.00 MXN"
  providerPayout:  formatPesosMXN(PROVIDER_PAYOUT),
  chambyFee:       formatPesosMXN(CHAMBY_COMMISSION),
} as const;
