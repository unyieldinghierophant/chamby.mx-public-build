/**
 * Job Payment Status Utilities
 * 
 * This module provides helper functions to compute the payment status of a job
 * based on database fields only (no direct Stripe calls).
 * 
 * Fields used:
 * - jobs.stripe_visit_payment_intent_id
 * - jobs.visit_fee_paid
 * - invoices.status (when joined)
 */

export type VisitFeeStatus = 
  | 'not_authorized'      // No PaymentIntent created
  | 'authorized'          // PaymentIntent created but not captured
  | 'captured'            // visit_fee_paid = true
  | 'unknown';

export type InvoiceStatus = 
  | 'none'                // No invoice exists
  | 'draft'               // Invoice created but not sent
  | 'sent'                // Invoice sent to client
  | 'pending'             // Invoice pending payment
  | 'paid'                // Invoice paid
  | 'failed'              // Payment failed
  | 'unknown';

export interface JobPaymentStatus {
  visitFee: VisitFeeStatus;
  invoice: InvoiceStatus;
}

export interface JobPaymentFields {
  stripe_visit_payment_intent_id?: string | null;
  visit_fee_paid?: boolean | null;
}

export interface InvoicePaymentFields {
  status?: string | null;
}

/**
 * Compute the visit fee status from job fields
 */
export function getVisitFeeStatus(job: JobPaymentFields): VisitFeeStatus {
  // If visit_fee_paid is true, the fee was captured
  if (job.visit_fee_paid === true) {
    return 'captured';
  }
  
  // If there's a PaymentIntent ID but not paid, it's authorized
  if (job.stripe_visit_payment_intent_id) {
    return 'authorized';
  }
  
  // No PaymentIntent means not authorized
  return 'not_authorized';
}

/**
 * Compute the invoice status from invoice fields
 */
export function getInvoiceStatus(invoice?: InvoicePaymentFields | null): InvoiceStatus {
  if (!invoice || !invoice.status) {
    return 'none';
  }
  
  const status = invoice.status.toLowerCase();
  
  switch (status) {
    case 'draft':
      return 'draft';
    case 'sent':
    case 'pending':
      return 'pending';
    case 'paid':
      return 'paid';
    case 'failed':
      return 'failed';
    default:
      return 'unknown';
  }
}

/**
 * Get complete payment status for a job
 */
export function getJobPaymentStatus(
  job: JobPaymentFields,
  invoice?: InvoicePaymentFields | null
): JobPaymentStatus {
  return {
    visitFee: getVisitFeeStatus(job),
    invoice: getInvoiceStatus(invoice)
  };
}

/**
 * Customer-facing labels for visit fee status
 */
export function getVisitFeeLabel(status: VisitFeeStatus, role: 'customer' | 'provider'): string {
  if (role === 'customer') {
    switch (status) {
      case 'captured':
        return 'Visita pagada';
      case 'authorized':
        return 'Visita autorizada';
      case 'not_authorized':
        return 'Pago pendiente';
      default:
        return 'Estado desconocido';
    }
  } else {
    // Provider labels
    switch (status) {
      case 'captured':
        return 'Pago confirmado';
      case 'authorized':
        return 'Pago asegurado';
      case 'not_authorized':
        return 'Pago no asegurado';
      default:
        return 'Estado desconocido';
    }
  }
}

/**
 * Customer-facing labels for invoice status
 */
export function getInvoiceLabel(status: InvoiceStatus, role: 'customer' | 'provider'): string {
  if (role === 'customer') {
    switch (status) {
      case 'none':
        return '';
      case 'draft':
        return 'Cotización en preparación';
      case 'pending':
        return 'Factura pendiente';
      case 'paid':
        return 'Factura pagada';
      case 'failed':
        return 'Pago fallido';
      default:
        return '';
    }
  } else {
    // Provider labels
    switch (status) {
      case 'none':
        return '';
      case 'draft':
        return 'Cotización borrador';
      case 'pending':
        return 'Factura enviada';
      case 'paid':
        return 'Factura pagada';
      case 'failed':
        return 'Pago fallido';
      default:
        return '';
    }
  }
}
