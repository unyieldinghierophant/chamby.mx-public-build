/**
 * Visit Fee Pricing — Single Source of Truth
 *
 * All monetary values are stored in centavos (integer) to avoid
 * floating-point rounding issues.  Display helpers convert to
 * human-readable MXN strings.
 *
 * Option A pricing model:
 *   Customer pays base + IVA.
 *   Provider payout is a fixed amount (does NOT include IVA).
 */

// ── Core constants (centavos) ───────────────────────────────
export const VISIT_BASE_FEE_CENTS    = 35_000;  // $350.00 MXN
export const IVA_RATE                = 0.16;
export const IVA_AMOUNT_CENTS        = 5_600;    // 16 % of 350
export const CUSTOMER_TOTAL_CENTS    = 40_600;   // $406.00 MXN
export const PROVIDER_PAYOUT_CENTS   = 25_000;   // $250.00 MXN (fixed)
export const CHAMBY_COMMISSION_CENTS = 10_000;   // $100.00 MXN (fixed)

// ── Derived display values (pesos, already formatted) ───────
export const VISIT_BASE_FEE    = VISIT_BASE_FEE_CENTS    / 100; // 350
export const IVA_AMOUNT        = IVA_AMOUNT_CENTS        / 100; // 56
export const CUSTOMER_TOTAL    = CUSTOMER_TOTAL_CENTS    / 100;  // 406
export const PROVIDER_PAYOUT   = PROVIDER_PAYOUT_CENTS   / 100;  // 250
export const CHAMBY_COMMISSION = CHAMBY_COMMISSION_CENTS / 100;  // 100

// ── Formatters ──────────────────────────────────────────────

/** Format centavos → "$350.00" */
export const formatCentavos = (centavos: number): string =>
  `$${(centavos / 100).toFixed(2)}`;

/** Format pesos → "$350.00" */
export const formatPesos = (pesos: number): string =>
  `$${pesos.toFixed(2)}`;

/** Format pesos → "$350.00 MXN" */
export const formatPesosMXN = (pesos: number): string =>
  `$${pesos.toFixed(2)} MXN`;

// ── Pre-formatted strings (most common usage) ───────────────
export const DISPLAY = {
  baseFee:         formatPesosMXN(VISIT_BASE_FEE),    // "$350.00 MXN"
  iva:             formatPesosMXN(IVA_AMOUNT),         // "$56.00 MXN"
  customerTotal:   formatPesosMXN(CUSTOMER_TOTAL),     // "$406.00 MXN"
  providerPayout:  formatPesosMXN(PROVIDER_PAYOUT),    // "$250.00 MXN"
  chambyFee:       formatPesosMXN(CHAMBY_COMMISSION),  // "$100.00 MXN"
} as const;
