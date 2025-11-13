# Stripe Test Mode Configuration ✅

## Status: SANDBOX MODE ACTIVE 🧪

All Stripe integrations are now configured to use **test keys** for sandbox testing.

## Configuration Summary

### Edge Functions Updated:
1. ✅ **create-visit-payment** - Uses `STRIPE_SECRET_KEY_test`
2. ✅ **stripe-webhook** - Uses `STRIPE_SECRET_KEY_test` and `STRIPE_WEBHOOK_SECRET_test` (optional)
3. ✅ **create-payment** - Uses `STRIPE_SECRET_KEY_test`
4. ✅ **create-visit-invoice** - Uses `STRIPE_SECRET_KEY_test`

### Test Keys Used:
- **Secret Key**: `STRIPE_SECRET_KEY_test` (from Supabase secrets)
- **Publishable Key**: `STRIPE_PUBLISHABLE_KEY_test` (from Supabase secrets)
- **Webhook Secret**: `STRIPE_WEBHOOK_SECRET_test` (optional - webhook verification can be skipped in sandbox)

## Testing Guidelines

### 1. Test Card Numbers
Use these Stripe test cards for payment testing:
- **Success**: `4242 4242 4242 4242`
- **Decline**: `4000 0000 0000 0002`
- **Authentication Required**: `4000 0025 0000 3155`

Any future expiry date and any 3-digit CVC will work.

### 2. Webhook Testing
For sandbox testing, webhook signature verification is **optional**:
- If `STRIPE_WEBHOOK_SECRET_test` is not set, webhooks will process without signature verification
- This allows testing with Stripe CLI or manual webhook triggers

To test webhooks locally:
```bash
stripe listen --forward-to https://uiyjmjibshnkhwewtkoz.supabase.co/functions/v1/stripe-webhook
```

### 3. Expected Behavior
✅ Stripe Dashboard shows "You're testing in a sandbox"
✅ All payments use test mode
✅ No real charges are made
✅ Test webhooks fire correctly
✅ Job creation → Payment → Notification flow works end-to-end

## Verification Checklist

- [x] All edge functions use `STRIPE_SECRET_KEY_test`
- [x] Webhook handler uses `STRIPE_SECRET_KEY_test`
- [x] Webhook signature verification is optional for sandbox
- [x] Console logs show "🧪 Using Stripe TEST mode (sandbox)"
- [ ] **USER ACTION**: Test a job request payment flow with test card
- [ ] **USER ACTION**: Verify Stripe Dashboard shows test transactions
- [ ] **USER ACTION**: Confirm webhooks fire (check edge function logs)

## Switching to Live Mode

When ready to go live:
1. Update secrets to use live keys (remove `_test` suffix references in code)
2. Create live webhook endpoint in Stripe Dashboard
3. Update `STRIPE_WEBHOOK_SECRET` with live webhook signing secret
4. Test thoroughly in production environment

## Logs to Monitor

Check these logs to verify sandbox mode:
- Edge Function logs: https://supabase.com/dashboard/project/uiyjmjibshnkhwewtkoz/functions
- Look for: `🧪 Using Stripe TEST mode (sandbox)`
- Stripe Dashboard: https://dashboard.stripe.com/test/payments
