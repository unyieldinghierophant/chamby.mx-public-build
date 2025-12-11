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

export interface VisitAuthorizationResult {
  success: boolean;
  error?: string;
  paymentIntentId?: string;
  paymentIntentStatus?: string;
  requiresAction?: boolean;
}

/**
 * Confirms a visit fee authorization using Stripe's confirmCardPayment.
 * This is for authorizing (not capturing) the $350 visit fee.
 * 
 * @param clientSecret - The PaymentIntent client_secret from create-visit-authorization
 * @returns Promise with success status and any error messages
 */
export const confirmVisitAuthorizationPayment = async (
  clientSecret: string
): Promise<VisitAuthorizationResult> => {
  try {
    if (!clientSecret) {
      return {
        success: false,
        error: "No se proporcionó el secreto de cliente",
      };
    }

    const stripe = await getStripe();
    
    if (!stripe) {
      return {
        success: false,
        error: "Error al cargar Stripe",
      };
    }

    // Use confirmPayment which handles various payment methods
    const { error, paymentIntent } = await stripe.confirmPayment({
      clientSecret,
      confirmParams: {
        return_url: `${window.location.origin}/visit-authorization-complete`,
      },
      redirect: "if_required",
    });

    if (error) {
      const stripeError = error as StripeError;
      return {
        success: false,
        error: stripeError.message || "Error al autorizar el pago",
      };
    }

    if (paymentIntent) {
      // For manual capture, 'requires_capture' means authorization was successful
      const isSuccessful = 
        paymentIntent.status === "requires_capture" || 
        paymentIntent.status === "succeeded" ||
        paymentIntent.status === "processing";
      
      return {
        success: isSuccessful,
        paymentIntentId: paymentIntent.id,
        paymentIntentStatus: paymentIntent.status,
        requiresAction: paymentIntent.status === "requires_action",
        error: paymentIntent.status === "requires_action" 
          ? "Se requiere autenticación adicional" 
          : undefined,
      };
    }

    return {
      success: false,
      error: "Estado de pago inesperado",
    };
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : "Ocurrió un error inesperado";
    return {
      success: false,
      error: errorMessage,
    };
  }
};

export { getStripe };
