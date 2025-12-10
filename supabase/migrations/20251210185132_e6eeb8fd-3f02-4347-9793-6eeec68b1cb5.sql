-- Reset corrupt visit_fee_paid flags where no PaymentIntent exists
-- This fixes jobs that were incorrectly marked as paid without actual payment
UPDATE jobs 
SET visit_fee_paid = false, updated_at = now()
WHERE visit_fee_paid = true 
AND stripe_visit_payment_intent_id IS NULL;