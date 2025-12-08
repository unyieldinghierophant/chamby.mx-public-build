# Stripe LIVE Mode Configuration ✅

## Status: LIVE MODE ACTIVE 🔴

All Stripe integrations are configured to use **live keys** for production.

## Configuration Summary

### Edge Functions:
1. ✅ **create-visit-payment** - Uses `STRIPE_SECRET_KEY` (LIVE)
2. ✅ **stripe-webhook** - Uses `STRIPE_SECRET_KEY` and `STRIPE_WEBHOOK_SECRET` (LIVE)
3. ✅ **create-visit-invoice** - Uses `STRIPE_SECRET_KEY` (LIVE)
4. ✅ **create-connect-account** - Uses `STRIPE_SECRET_KEY` (LIVE)

### Keys Used:
- **Secret Key**: `STRIPE_SECRET_KEY` (Supabase secrets)
- **Webhook Secret**: `STRIPE_WEBHOOK_SECRET` (Supabase secrets)

### Visit Fee:
- **Amount**: $350 MXN

## Payment Flows

### 1. Visit Fee Payment
- Client requests a service → Redirected to Stripe Checkout
- Amount: **$350 MXN**
- On success: Job status updated to 'active', `visit_fee_paid` set to true

### 2. Invoice Payment
- Provider creates invoice with line items
- Client receives notification with payment link
- Chamby commission: **15%** automatically calculated
- On success: Invoice marked as 'paid', job marked as 'completed'

### 3. Provider Onboarding (Stripe Connect)
- Provider initiates onboarding → Redirected to Stripe Express onboarding
- Account type: Express (Mexico)
- Capabilities: card_payments, transfers

## Webhook Events Handled

| Event | Action |
|-------|--------|
| `checkout.session.completed` | Updates job as paid, sends notifications |
| `payment_intent.succeeded` | Marks invoice as paid, completes job |
| `payment_intent.payment_failed` | Marks invoice as failed |

## Webhook Configuration

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/stripe-webhook`
3. Select events:
   - `checkout.session.completed`
   - `payment_intent.succeeded`
   - `payment_intent.payment_failed`
4. Copy the signing secret to `STRIPE_WEBHOOK_SECRET` in Supabase secrets

## Expected Behavior

✅ Stripe Dashboard shows LIVE mode
✅ Real charges are made
✅ Visit fee is $350 MXN
✅ 15% commission calculated on invoices
✅ Webhooks update job/invoice status
✅ Provider Connect onboarding works

## Logs to Monitor

- Edge Function logs: https://supabase.com/dashboard/project/uiyjmjibshnkhwewtkoz/functions
- Look for: `🔴 Using Stripe LIVE mode (production)`
- Stripe Dashboard: https://dashboard.stripe.com/payments
