/**
 * pricingConfig.ts — Single Source of Truth for all Chamby pricing.
 * ALL values in integer centavos. Never use floating-point for money.
 */

export const PRICING = {
  VISIT_FEE: {
    CLIENT_TOTAL_CENTS: 42_900,      // $429.00 MXN — what client pays
    BASE_AMOUNT_CENTS: 35_000,       // $350.00 MXN
    IVA_AMOUNT_CENTS: 5_600,         // $56.00 (16% of base)
    STRIPE_ABSORBED_CENTS: 2_300,    // ~$23.00 (difference to reach $429)
    PROVIDER_SHARE_CENTS: 25_000,    // $250.00 to provider
    CHAMBY_SHARE_CENTS: 10_000,      // $100.00 to Chamby
    CURRENCY: 'mxn' as const,
    IS_REFUNDABLE_ON_COMPLETION: true,
  },
  COMMISSION: {
    CLIENT_SURCHARGE_RATE: 0.10,     // 10% added to provider quote
    PROVIDER_DEDUCTION_RATE: 0.10,   // 10% deducted from provider quote
    IVA_RATE: 0.16,
    STRIPE_FEE_RATE: 0.036,         // ~3.6% estimate for display
    STRIPE_FEE_FIXED_CENTS: 300,    // $3.00 MXN fixed component
  },
} as const;

/** Given provider's quote in centavos, return full breakdown */
export function calculateJobPayment(providerQuoteCents: number) {
  const clientSurcharge = Math.round(providerQuoteCents * PRICING.COMMISSION.CLIENT_SURCHARGE_RATE);
  const providerDeduction = Math.round(providerQuoteCents * PRICING.COMMISSION.PROVIDER_DEDUCTION_RATE);
  const chambyGrossMargin = clientSurcharge + providerDeduction;
  const subtotalBeforeIVA = providerQuoteCents + clientSurcharge;
  const ivaAmount = Math.round(subtotalBeforeIVA * PRICING.COMMISSION.IVA_RATE);
  const estimatedStripeFee = Math.round(subtotalBeforeIVA * PRICING.COMMISSION.STRIPE_FEE_RATE) + PRICING.COMMISSION.STRIPE_FEE_FIXED_CENTS;
  const clientTotal = subtotalBeforeIVA + ivaAmount + estimatedStripeFee;
  const clientTotalRounded = Math.round(clientTotal / 100) * 100;
  const providerPayout = providerQuoteCents - providerDeduction;

  return {
    providerQuoteCents,
    clientSurcharge,
    providerDeduction,
    chambyGrossMargin,
    subtotalBeforeIVA,
    ivaAmount,
    estimatedStripeFee,
    clientTotal: clientTotalRounded,
    providerPayout,
  };
}
// Verification:
// calculateJobPayment(100_000) → client $1,313, provider $900, chamby $200
// calculateJobPayment(500_000) → client $6,566, provider $4,500, chamby $1,000
// calculateJobPayment(1_000_000) → client $13,132, provider $9,000, chamby $2,000

export function formatMXN(centavos: number): string {
  return '$' + (centavos / 100).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

// ── Backward-compatible helpers used across UI ──────────────
export const VAT_LABEL = "IVA (16%)";
export const VISIT_BASE_FEE = PRICING.VISIT_FEE.BASE_AMOUNT_CENTS / 100; // 350 (pesos)

export const VISIT_DISPLAY = {
  subtotal: formatMXN(PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS - PRICING.VISIT_FEE.IVA_AMOUNT_CENTS), // pre-IVA
  vat: formatMXN(PRICING.VISIT_FEE.IVA_AMOUNT_CENTS),
  total: formatMXN(PRICING.VISIT_FEE.CLIENT_TOTAL_CENTS),
  providerNet: formatMXN(PRICING.VISIT_FEE.PROVIDER_SHARE_CENTS),
  platformFee: formatMXN(PRICING.VISIT_FEE.CHAMBY_SHARE_CENTS),
} as const;

/** Calculate IVA in pesos from a subtotal in pesos */
export const calcInvoiceVat = (subtotalPesos: number): number =>
  Math.round(subtotalPesos * PRICING.COMMISSION.IVA_RATE * 100) / 100;

/** Format pesos → "$350.00" */
export const formatPesosShort = (pesos: number): string =>
  `$${pesos.toFixed(2)}`;
