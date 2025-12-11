import { loadStripe, Stripe, StripeError } from "@stripe/stripe-js";

// Stripe publishable key for Chamby (LIVE mode)
const STRIPE_PUBLISHABLE_KEY = "pk_live_51S97FmEZPwoUz41xy5reckT8yeYIP9xrJp1PRzJfarAIt5W57Y3ezZH09REHJNIbNK1oSvb8aHbdMEOad8ZraLq800FTBvPswi";

let stripePromise: Promise<Stripe | null> | null = null;

const getStripe = () => {
  if (!stripePromise) {
    stripePromise = loadStripe(STRIPE_PUBLISHABLE_KEY);
  }
  return stripePromise;
};

export interface ConfirmPaymentResult {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
  paymentIntentStatus?: string;
}

/**
 * Confirms an invoice payment using Stripe's confirmCardPayment.
 * Does NOT modify any backend data - only handles the client-side payment confirmation.
 * 
 * @param clientSecret - The PaymentIntent client_secret from the backend
 * @returns Promise with success status and any error messages
 */
export const confirmInvoicePayment = async (
  clientSecret: string
): Promise<ConfirmPaymentResult> => {
  try {
    if (!clientSecret) {
      return {
        success: false,
        error: "No client secret provided",
      };
    }

    const stripe = await getStripe();
    
    if (!stripe) {
      return {
        success: false,
        error: "Failed to load Stripe",
      };
    }

    // Use confirmPayment which handles various payment methods
    const { error, paymentIntent } = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/invoice-payment-complete`,
      },
      redirect: "if_required",
    });

    if (error) {
      // Handle different error types
      const stripeError = error as StripeError;
      return {
        success: false,
        error: stripeError.message || "Payment failed",
      };
    }

    if (paymentIntent) {
      return {
        success: paymentIntent.status === "succeeded" || paymentIntent.status === "processing",
        paymentIntentId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
        error: paymentIntent.status === "requires_action" 
          ? "Additional authentication required" 
          : undefined,
      };
    }

    return {
      success: false,
      error: "Unexpected payment state",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
};

/**
 * Alternative method using confirmCardPayment specifically for card payments.
 * Use this if you want to collect card details manually.
 */
export const confirmCardPayment = async (
  clientSecret: string,
  cardElement?: unknown
): Promise<ConfirmPaymentResult> => {
  try {
    const stripe = await getStripe();
    
    if (!stripe) {
      return {
        success: false,
        error: "Failed to load Stripe",
      };
    }

    const { error, paymentIntent } = await stripe.confirmCardPayment(clientSecret);

    if (error) {
      return {
        success: false,
        error: error.message || "Card payment failed",
      };
    }

    if (paymentIntent) {
      return {
        success: paymentIntent.status === "succeeded",
        paymentIntentId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
      };
    }

    return {
      success: false,
      error: "Unexpected payment state",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "An unexpected error occurred";
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export { getStripe };
