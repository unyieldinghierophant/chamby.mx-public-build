/**
 * Pricing Engine — Single Source of Truth (v3)
 *
 * All monetary values stored in centavos (integer) to avoid
 * floating-point issues. Display helpers convert to MXN strings.
 *
 * Visit Fee v3: Client pays $429.00 total (includes IVA + Stripe).
 *   Provider net: $250.00 | Chamby net: $100.00
 *
 * Work Quotation Commission: 10% surcharge to client / 10% fee from provider.
 *   Visit fee ($429) is credited against the final work invoice.
 */

// ── IVA Rate ────────────────────────────────────────────────
export const VAT_RATE = 0.16;
export const VAT_LABEL = "IVA (16%)";

// ── Visit Fee Constants (pesos) ─────────────────────────────
/** Total the client pays for the visit (Phase 1) */
export const VISIT_FEE_CLIENT = 429.0;
/** What the provider receives from the visit fee */
export const VISIT_FEE_PROVIDER_NET = 250.0;
/** What Chamby keeps from the visit fee */
export const VISIT_FEE_CHAMBY_NET = 100.0;

// ── Visit Fee Constants (centavos) ──────────────────────────
export const VISIT_FEE_CLIENT_CENTS = 42_900;
export const VISIT_FEE_PROVIDER_NET_CENTS = 25_000;
export const VISIT_FEE_CHAMBY_NET_CENTS = 10_000;

// ── Legacy aliases (centavos) — used by existing code ───────
export const VISIT_BASE_CENTS = 35_000;          // $350.00 MXN (DB base)
export const VISIT_STRIPE_FEE_CENTS = 2_300;     // absorbed
export const VISIT_SUBTOTAL_CENTS = 37_300;       // base + stripe fee
export const VISIT_VAT_CENTS = 5_600;             // 16% of $350 base
export const VISIT_TOTAL_CENTS = VISIT_FEE_CLIENT_CENTS; // $429.00
export const VISIT_PROVIDER_NET_CENTS = VISIT_FEE_PROVIDER_NET_CENTS;
export const VISIT_PLATFORM_FEE_CENTS = VISIT_FEE_CHAMBY_NET_CENTS;

// ── Peso-denominated values (for DB columns stored in pesos) ──
export const VISIT_BASE_FEE = VISIT_BASE_CENTS / 100; // 350

// ── Work Quotation Commission ───────────────────────────────
/** 10% surcharge to client / 10% fee from provider */
export const SERVICE_COMMISSION_RATE = 0.10;

// ── Generic Helpers ─────────────────────────────────────────

/** Calculate VAT in centavos from a base amount in centavos */
export const calcVat = (baseCents: number): number =>
  Math.round(baseCents * VAT_RATE);

/** Calculate total (base + VAT) in centavos */
export const calcTotalWithVat = (baseCents: number): number =>
  baseCents + calcVat(baseCents);

/** Format centavos → "$429.00 MXN" */
export const formatMXN = (cents: number): string =>
  `$${(cents / 100).toFixed(2)} MXN`;

/** Format centavos → "$429.00" (no currency suffix) */
export const formatMXNShort = (cents: number): string =>
  `$${(cents / 100).toFixed(2)}`;

/** Format pesos (number) → "$429.00 MXN" */
export const formatPesosMXN = (pesos: number): string =>
  `$${pesos.toFixed(2)} MXN`;

/** Format pesos (number) → "$429.00" */
export const formatPesosShort = (pesos: number): string =>
  `$${pesos.toFixed(2)}`;

// ── Visit Pricing Bundle ────────────────────────────────────

export const getVisitPricing = () => ({
  base: VISIT_BASE_CENTS,
  stripeFee: VISIT_STRIPE_FEE_CENTS,
  subtotal: VISIT_SUBTOTAL_CENTS,
  vat: VISIT_VAT_CENTS,
  total: VISIT_FEE_CLIENT_CENTS,
  providerNet: VISIT_FEE_PROVIDER_NET_CENTS,
  platformFee: VISIT_FEE_CHAMBY_NET_CENTS,
});

// ── Invoice Helpers (pesos) ─────────────────────────────────

/** Calculate IVA in pesos from a subtotal in pesos */
export const calcInvoiceVat = (subtotalPesos: number): number =>
  Math.round(subtotalPesos * VAT_RATE * 100) / 100;

/** Calculate total in pesos (subtotal + IVA) */
export const calcInvoiceTotal = (subtotalPesos: number): number =>
  subtotalPesos + calcInvoiceVat(subtotalPesos);

// ── Work Quotation Calculator ───────────────────────────────

export interface FinalQuote {
  /** Provider's original price (pesos) */
  providerBasePrice: number;
  /** 10% surcharge applied to client (pesos) */
  clientSurcharge: number;
  /** Total client price before visit fee credit (pesos) */
  clientGrossTotal: number;
  /** Visit fee credit applied (pesos) */
  visitFeeCredit: number;
  /** Remaining amount client pays (pesos) — can be negative if visit fee > gross */
  clientAmountDue: number;
  /** Provider's net after 10% commission (pesos) */
  providerNet: number;
  /** Chamby's commission from the work (pesos) */
  chambyCommission: number;
}

/**
 * Calculate the final quote breakdown for a work invoice.
 *
 * - Adds 10% surcharge for the client.
 * - Credits the $429 visit fee against the client total.
 * - Subtracts 10% commission from the provider.
 *
 * @param providerBasePrice — The provider's quoted price in pesos
 */
export const calculateFinalQuote = (providerBasePrice: number): FinalQuote => {
  const clientSurcharge = Math.round(providerBasePrice * SERVICE_COMMISSION_RATE * 100) / 100;
  const clientGrossTotal = Math.round((providerBasePrice + clientSurcharge) * 100) / 100;
  const visitFeeCredit = VISIT_FEE_CLIENT;
  const clientAmountDue = Math.round((clientGrossTotal - visitFeeCredit) * 100) / 100;

  const chambyCommission = Math.round(providerBasePrice * SERVICE_COMMISSION_RATE * 100) / 100;
  const providerNet = Math.round((providerBasePrice - chambyCommission) * 100) / 100;

  return {
    providerBasePrice,
    clientSurcharge,
    clientGrossTotal,
    visitFeeCredit,
    clientAmountDue,
    providerNet,
    chambyCommission,
  };
};

// ── Pre-formatted Display Strings ───────────────────────────

export const VISIT_DISPLAY = {
  subtotal: formatMXN(VISIT_SUBTOTAL_CENTS),
  vat: formatMXN(VISIT_VAT_CENTS),
  total: formatMXN(VISIT_FEE_CLIENT_CENTS),         // "$429.00 MXN"
  providerNet: formatMXN(VISIT_FEE_PROVIDER_NET_CENTS),
  platformFee: formatMXN(VISIT_FEE_CHAMBY_NET_CENTS),
} as const;
