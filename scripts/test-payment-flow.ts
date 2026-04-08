#!/usr/bin/env -S deno run --allow-net --allow-env --allow-read

/**
 * test-payment-flow.ts
 * ─────────────────────────────────────────────────────────────────────────────
 * End-to-end payment flow test for Chamby.
 * Runs against LIVE Supabase project in Stripe TEST mode.
 *
 * Usage:
 *   SUPABASE_URL=https://uiyjmjibshnkhwewtkoz.supabase.co \
 *   SUPABASE_SERVICE_ROLE_KEY=<service_role_key> \
 *   STRIPE_SECRET_KEY=sk_test_... \
 *   CLIENT_EMAIL=testclient@example.com \
 *   CLIENT_PASSWORD=testpass123 \
 *   PROVIDER_EMAIL=testprovider@example.com \
 *   PROVIDER_PASSWORD=testpass123 \
 *   deno run --allow-net --allow-env scripts/test-payment-flow.ts [scenario]
 *
 * Scenarios:
 *   happy_path          Full flow: book → pay hold → assign → on_site → quote → accept → pay invoice → complete
 *   quote_rejection     Book → pay hold → assign → on_site → quote → REJECT → check $250 to provider
 *   dispute             Full flow up to invoice paid → open dispute → admin resolve
 *
 * NOTE: You need a test client user and provider user already created in Supabase Auth.
 *       The provider must be assigned to jobs manually (or have a real assignment flow).
 */

// ─── Config ──────────────────────────────────────────────────────────────────
const SUPABASE_URL       = Deno.env.get("SUPABASE_URL") ?? "https://uiyjmjibshnkhwewtkoz.supabase.co";
const SERVICE_ROLE_KEY   = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const STRIPE_SECRET_KEY  = Deno.env.get("STRIPE_SECRET_KEY") ?? "";
const CLIENT_EMAIL       = Deno.env.get("CLIENT_EMAIL") ?? "";
const CLIENT_PASSWORD    = Deno.env.get("CLIENT_PASSWORD") ?? "";
const PROVIDER_EMAIL     = Deno.env.get("PROVIDER_EMAIL") ?? "";
const PROVIDER_PASSWORD  = Deno.env.get("PROVIDER_PASSWORD") ?? "";

const SCENARIO = Deno.args[0] ?? "happy_path";

// ─── Stripe test card (succeeds immediately) ──────────────────────────────────
const STRIPE_TEST_CARD = {
  number: "4242424242424242",
  exp_month: 12,
  exp_year: 2026,
  cvc: "123",
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function log(tag: string, msg: string, data?: unknown) {
  const icon = tag === "PASS" ? "✅" : tag === "FAIL" ? "❌" : tag === "INFO" ? "ℹ️ " : "🔷";
  const detail = data ? `\n   ${JSON.stringify(data, null, 2).split("\n").join("\n   ")}` : "";
  console.log(`${icon} [${tag}] ${msg}${detail}`);
}

function assert(condition: boolean, msg: string, data?: unknown) {
  if (!condition) {
    log("FAIL", msg, data);
    Deno.exit(1);
  }
  log("PASS", msg);
}

// Supabase REST helper
async function sbAdmin(path: string, method = "GET", body?: unknown) {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/${path}`, {
    method,
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Authorization": `Bearer ${SERVICE_ROLE_KEY}`,
      "Content-Type": "application/json",
      "Prefer": method === "POST" ? "return=representation" : "return=minimal",
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

// Supabase Edge Function caller
async function invokeEdge(fn: string, token: string, body: unknown) {
  const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${token}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });
  const text = await res.text();
  try { return { status: res.status, data: JSON.parse(text) }; }
  catch { return { status: res.status, data: text }; }
}

// Auth: sign in and get access token
async function signIn(email: string, password: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: {
      "apikey": SERVICE_ROLE_KEY,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ email, password }),
  });
  const data = await res.json();
  if (!data.access_token) throw new Error(`Sign in failed for ${email}: ${JSON.stringify(data)}`);
  return data.access_token;
}

// Stripe API helper
async function stripe(path: string, method = "GET", params?: Record<string, string>) {
  const url = `https://api.stripe.com/v1/${path}`;
  const res = await fetch(url, {
    method,
    headers: {
      "Authorization": `Bearer ${STRIPE_SECRET_KEY}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: params ? new URLSearchParams(params).toString() : undefined,
  });
  return res.json();
}

// Wait helper
const wait = (ms: number) => new Promise(r => setTimeout(r, ms));

// ─── Validation ────────────────────────────────────────────────────────────────

function validateConfig() {
  const missing = [];
  if (!SERVICE_ROLE_KEY) missing.push("SUPABASE_SERVICE_ROLE_KEY");
  if (!STRIPE_SECRET_KEY) missing.push("STRIPE_SECRET_KEY");
  if (!CLIENT_EMAIL)      missing.push("CLIENT_EMAIL");
  if (!CLIENT_PASSWORD)   missing.push("CLIENT_PASSWORD");
  if (!PROVIDER_EMAIL)    missing.push("PROVIDER_EMAIL");
  if (!PROVIDER_PASSWORD) missing.push("PROVIDER_PASSWORD");

  if (missing.length > 0) {
    console.error(`\n❌ Missing required env vars:\n  ${missing.join("\n  ")}\n`);
    console.error("See usage at the top of this file.");
    Deno.exit(1);
  }

  if (!STRIPE_SECRET_KEY.startsWith("sk_test_")) {
    console.error("❌ STRIPE_SECRET_KEY must be a test key (sk_test_...)");
    Deno.exit(1);
  }
}

// ─── Test scenarios ────────────────────────────────────────────────────────────

async function setupTestJob(clientToken: string, clientId: string): Promise<string> {
  // Create a job directly via DB (bypasses booking UI)
  const { data: jobs, status } = await sbAdmin("jobs?select=id", "POST", {
    client_id: clientId,
    title: "[TEST] Reparación de prueba",
    category: "Plomería",
    description: "Job creado por test-payment-flow.ts",
    location: "Av. Chapultepec 123, Guadalajara",
    status: "draft",
    visit_fee_paid: false,
  });

  if (status !== 201) throw new Error(`Failed to create test job: ${JSON.stringify(jobs)}`);
  const jobId = Array.isArray(jobs) ? jobs[0].id : jobs.id;
  log("INFO", `Test job created: ${jobId}`);
  return jobId;
}

async function getUserId(token: string): Promise<string> {
  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    headers: { "Authorization": `Bearer ${token}`, "apikey": SERVICE_ROLE_KEY },
  });
  const data = await res.json();
  return data.id;
}

async function assignProviderToJob(jobId: string, providerId: string) {
  await sbAdmin(`jobs?id=eq.${jobId}`, "PATCH", {
    provider_id: providerId,
    status: "assigned",
  });
  log("INFO", `Provider ${providerId} assigned to job ${jobId}`);
}

async function setJobStatus(jobId: string, status: string) {
  await sbAdmin(`jobs?id=eq.${jobId}`, "PATCH", { status });
  log("INFO", `Job ${jobId} → status: ${status}`);
}

async function simulateStripeCheckout(sessionId: string): Promise<string> {
  // In test mode we can confirm the PaymentIntent behind the Checkout Session directly.
  // 1. Get the session to find the payment_intent
  const session = await stripe(`checkout/sessions/${sessionId}`);
  const piId = session.payment_intent;
  assert(!!piId, `Session has a payment_intent`, { piId });

  // 2. Attach test card as payment method
  const pm = await stripe("payment_methods", "POST", {
    type: "card",
    "card[number]": STRIPE_TEST_CARD.number,
    "card[exp_month]": String(STRIPE_TEST_CARD.exp_month),
    "card[exp_year]": String(STRIPE_TEST_CARD.exp_year),
    "card[cvc]": STRIPE_TEST_CARD.cvc,
  });
  assert(pm.id?.startsWith("pm_"), "Test payment method created", { pmId: pm.id });

  // 3. Confirm the PaymentIntent
  const confirmed = await stripe(`payment_intents/${piId}/confirm`, "POST", {
    payment_method: pm.id,
    return_url: "https://chamby.mx/active-jobs",
  });

  const validStatuses = ["requires_capture", "succeeded"];
  assert(
    validStatuses.includes(confirmed.status),
    `PaymentIntent confirmed (status: ${confirmed.status})`,
    { piId, status: confirmed.status }
  );

  return piId;
}

// ─── Scenario: Happy Path ──────────────────────────────────────────────────────

async function runHappyPath() {
  console.log("\n" + "═".repeat(60));
  console.log("  SCENARIO: Happy Path");
  console.log("  Book → Pay Hold → Assign → On Site → Quote → Accept →");
  console.log("  Pay Invoice → Mark Done → Client Confirms → Settlement");
  console.log("═".repeat(60) + "\n");

  // 1. Sign in
  log("INFO", "Signing in as client + provider...");
  const clientToken   = await signIn(CLIENT_EMAIL, CLIENT_PASSWORD);
  const providerToken = await signIn(PROVIDER_EMAIL, PROVIDER_PASSWORD);
  const clientId      = await getUserId(clientToken);
  const providerId    = await getUserId(providerToken);
  log("PASS", "Auth OK", { clientId, providerId });

  // 2. Create test job
  const jobId = await setupTestJob(clientToken, clientId);

  // 3. Create visit payment (get Checkout Session URL)
  log("INFO", "Calling create-visit-payment...");
  const { data: visitPayData, status: visitPayStatus } = await invokeEdge(
    "create-visit-payment", clientToken, { jobId }
  );
  assert(visitPayStatus === 200, "create-visit-payment returned 200", visitPayData);
  assert(!!visitPayData.sessionId, "Got checkout session ID", { sessionId: visitPayData.sessionId });
  const visitSessionId = visitPayData.sessionId;

  // 4. Simulate Stripe checkout for visit fee (hold)
  log("INFO", "Simulating Stripe checkout for visit fee...");
  const visitPiId = await simulateStripeCheckout(visitSessionId);

  // 5. Check payment intent status — should be requires_capture (hold)
  const pi = await stripe(`payment_intents/${visitPiId}`);
  assert(pi.status === "requires_capture", "Visit fee is a HOLD (requires_capture)", { status: pi.status });

  // 6. Wait for webhook to process (webhook updates job status)
  log("INFO", "Waiting 3s for webhook to fire...");
  await wait(3000);

  // 7. Verify job updated
  const { data: [job1] } = await sbAdmin(`jobs?id=eq.${jobId}&select=status,visit_fee_paid,stripe_visit_payment_intent_id`);
  assert(job1.status === "searching", "Job status → searching", job1);
  assert(job1.visit_fee_paid === true, "visit_fee_paid = true", job1);
  assert(!!job1.stripe_visit_payment_intent_id, "stripe_visit_payment_intent_id set", job1);

  // 8. Verify payment ledger
  const { data: [payment1] } = await sbAdmin(`payments?job_id=eq.${jobId}&type=eq.visit_fee&select=status`);
  assert(payment1.status === "authorized", "Payment ledger: status = authorized", payment1);

  // 9. Assign provider & move to on_site (simulating admin/auto-assign)
  await assignProviderToJob(jobId, providerId);
  await setJobStatus(jobId, "on_site");

  // 10. Provider submits quote
  log("INFO", "Provider submitting quote ($1,500 MXN)...");
  const { data: quoteData, status: quoteStatus } = await invokeEdge(
    "submit-quote", providerToken, { job_id: jobId, provider_quote_cents: 150000 }
  );
  assert(quoteStatus === 200, "submit-quote returned 200", quoteData);
  assert(!!quoteData.invoice_id, "Invoice created", { invoiceId: quoteData.invoice_id });
  const invoiceId = quoteData.invoice_id;
  log("INFO", "Quote breakdown", quoteData.breakdown);

  // 11. Verify job is quoted
  const { data: [job2] } = await sbAdmin(`jobs?id=eq.${jobId}&select=status`);
  assert(job2.status === "quoted", "Job status → quoted", job2);

  // 12. Client accepts quote
  log("INFO", "Client accepting quote...");
  const { data: acceptData, status: acceptStatus } = await invokeEdge(
    "respond-to-quote", clientToken, { job_id: jobId, invoice_id: invoiceId, action: "accept" }
  );
  assert(acceptStatus === 200, "respond-to-quote (accept) returned 200", acceptData);

  // 13. Verify job/invoice state
  const { data: [job3] } = await sbAdmin(`jobs?id=eq.${jobId}&select=status`);
  assert(job3.status === "quote_accepted", "Job status → quote_accepted", job3);
  const { data: [inv1] } = await sbAdmin(`invoices?id=eq.${invoiceId}&select=status`);
  assert(inv1.status === "accepted", "Invoice status → accepted", inv1);

  // 14. Client pays invoice
  log("INFO", "Calling create-invoice-payment...");
  const { data: invPayData, status: invPayStatus } = await invokeEdge(
    "create-invoice-payment", clientToken, { invoice_id: invoiceId }
  );
  assert(invPayStatus === 200, "create-invoice-payment returned 200", invPayData);
  assert(!!invPayData.sessionId, "Got invoice checkout session", { sessionId: invPayData.sessionId });

  // 15. Simulate paying the invoice
  log("INFO", "Simulating invoice payment...");
  const invoicePiId = await simulateStripeCheckout(invPayData.sessionId);
  const invoicePi = await stripe(`payment_intents/${invoicePiId}`);
  assert(invoicePi.status === "succeeded", "Invoice PaymentIntent succeeded", { status: invoicePi.status });

  // 16. Wait for webhook
  log("INFO", "Waiting 3s for webhook...");
  await wait(3000);

  // 17. Verify invoice paid + job in_progress
  const { data: [job4] } = await sbAdmin(`jobs?id=eq.${jobId}&select=status`);
  assert(job4.status === "in_progress", "Job status → in_progress", job4);
  const { data: [inv2] } = await sbAdmin(`invoices?id=eq.${invoiceId}&select=status`);
  assert(inv2.status === "paid", "Invoice status → paid", inv2);

  // 18. Provider marks done (requires completion_status = "in_progress")
  // First set completion_status directly since we bypassed normal flow
  await sbAdmin(`jobs?id=eq.${jobId}`, "PATCH", { completion_status: "in_progress" });

  log("INFO", "Provider marking job done...");
  const { data: doneData, status: doneStatus } = await invokeEdge(
    "complete-job", providerToken, { job_id: jobId, action: "provider_mark_done" }
  );
  assert(doneStatus === 200, "complete-job (provider_mark_done) returned 200", doneData);

  // 19. Client confirms
  log("INFO", "Client confirming job completion...");
  const { data: confirmData, status: confirmStatus } = await invokeEdge(
    "complete-job", clientToken, { job_id: jobId, action: "client_confirm" }
  );
  assert(confirmStatus === 200, "complete-job (client_confirm) returned 200", confirmData);
  log("INFO", "Settlement result", confirmData.settlement);

  // 20. Verify final state
  const { data: [jobFinal] } = await sbAdmin(`jobs?id=eq.${jobId}&select=status,completion_status`);
  assert(jobFinal.status === "completed", "Job status → completed", jobFinal);
  assert(jobFinal.completion_status === "completed", "completion_status → completed", jobFinal);

  // 21. Check visit fee was CANCELLED (not charged)
  const visitPiFinal = await stripe(`payment_intents/${visitPiId}`);
  assert(visitPiFinal.status === "canceled", "Visit fee hold CANCELLED (client not charged)", { status: visitPiFinal.status });

  // 22. Check provider payout row
  const { data: payouts } = await sbAdmin(`payouts?job_id=eq.${jobId}&select=status,amount,stripe_transfer_id`);
  assert(payouts.length > 0, "Payout record created", payouts);
  log("INFO", "Payout record", payouts[0]);

  console.log("\n" + "═".repeat(60));
  console.log("  ✅ HAPPY PATH COMPLETE");
  console.log("═".repeat(60) + "\n");
}

// ─── Scenario: Quote Rejection ─────────────────────────────────────────────────

async function runQuoteRejection() {
  console.log("\n" + "═".repeat(60));
  console.log("  SCENARIO: Quote Rejection");
  console.log("  Book → Pay Hold → Quote → REJECT → $250 to provider, hold captured");
  console.log("═".repeat(60) + "\n");

  const clientToken   = await signIn(CLIENT_EMAIL, CLIENT_PASSWORD);
  const providerToken = await signIn(PROVIDER_EMAIL, PROVIDER_PASSWORD);
  const clientId      = await getUserId(clientToken);
  const providerId    = await getUserId(providerToken);
  log("PASS", "Auth OK", { clientId, providerId });

  const jobId = await setupTestJob(clientToken, clientId);

  // Pay visit fee
  const { data: visitPayData } = await invokeEdge("create-visit-payment", clientToken, { jobId });
  assert(!!visitPayData.sessionId, "Got session for visit fee");
  const visitPiId = await simulateStripeCheckout(visitPayData.sessionId);

  const pi = await stripe(`payment_intents/${visitPiId}`);
  assert(pi.status === "requires_capture", "Visit fee is a hold", { status: pi.status });

  await wait(3000);
  const { data: [job1] } = await sbAdmin(`jobs?id=eq.${jobId}&select=status,visit_fee_paid`);
  assert(job1.status === "searching", "Job → searching after payment", job1);

  // Assign + on_site
  await assignProviderToJob(jobId, providerId);
  await setJobStatus(jobId, "on_site");

  // Provider submits quote
  const { data: quoteData } = await invokeEdge(
    "submit-quote", providerToken, { job_id: jobId, provider_quote_cents: 200000 }
  );
  assert(!!quoteData.invoice_id, "Invoice created", { invoiceId: quoteData.invoice_id });
  const invoiceId = quoteData.invoice_id;

  // Client REJECTS
  log("INFO", "Client rejecting quote...");
  const { data: rejectData, status: rejectStatus } = await invokeEdge(
    "respond-to-quote", clientToken, {
      job_id: jobId, invoice_id: invoiceId,
      action: "reject", rejection_reason: "Precio muy alto"
    }
  );
  assert(rejectStatus === 200, "respond-to-quote (reject) returned 200", rejectData);

  // Wait for settlement
  await wait(2000);

  // Check visit fee hold was CAPTURED (not cancelled — on rejection Chamby keeps the money)
  const visitPiFinal = await stripe(`payment_intents/${visitPiId}`);
  assert(
    visitPiFinal.status === "succeeded",
    "Visit fee hold CAPTURED after rejection (status: succeeded)",
    { status: visitPiFinal.status }
  );

  // Check payout to provider ($250)
  const { data: payouts } = await sbAdmin(`payouts?job_id=eq.${jobId}&select=status,amount,payout_type`);
  const visitFeePayout = payouts.find((p: any) => p.payout_type === "visit_fee_settlement");
  assert(!!visitFeePayout, "Visit fee settlement payout created", payouts);
  assert(visitFeePayout.amount === 250, "Provider gets $250 MXN", visitFeePayout);

  console.log("\n" + "═".repeat(60));
  console.log("  ✅ QUOTE REJECTION SCENARIO COMPLETE");
  console.log("═".repeat(60) + "\n");
}

// ─── Scenario: Dispute ─────────────────────────────────────────────────────────

async function runDispute() {
  console.log("\n" + "═".repeat(60));
  console.log("  SCENARIO: Dispute");
  console.log("  Full flow → invoice paid → client opens dispute");
  console.log("═".repeat(60) + "\n");

  const clientToken   = await signIn(CLIENT_EMAIL, CLIENT_PASSWORD);
  const providerToken = await signIn(PROVIDER_EMAIL, PROVIDER_PASSWORD);
  const clientId      = await getUserId(clientToken);
  const providerId    = await getUserId(providerToken);

  const jobId = await setupTestJob(clientToken, clientId);

  // Pay visit fee
  const { data: vpd } = await invokeEdge("create-visit-payment", clientToken, { jobId });
  await simulateStripeCheckout(vpd.sessionId);
  await wait(3000);

  // Assign + quote + accept + pay invoice
  await assignProviderToJob(jobId, providerId);
  await setJobStatus(jobId, "on_site");
  const { data: qd } = await invokeEdge("submit-quote", providerToken, { job_id: jobId, provider_quote_cents: 100000 });
  await invokeEdge("respond-to-quote", clientToken, { job_id: jobId, invoice_id: qd.invoice_id, action: "accept" });
  const { data: ipd } = await invokeEdge("create-invoice-payment", clientToken, { invoice_id: qd.invoice_id });
  await simulateStripeCheckout(ipd.sessionId);
  await wait(3000);

  // Verify invoice paid
  const { data: [inv] } = await sbAdmin(`invoices?id=eq.${qd.invoice_id}&select=status`);
  assert(inv.status === "paid", "Invoice paid before dispute", inv);

  // Client opens dispute
  log("INFO", "Client opening dispute...");
  const { data: dispData, status: dispStatus } = await invokeEdge(
    "open-dispute", clientToken, {
      job_id: jobId,
      reason_code: "bad_service",
      reason_text: "El técnico no terminó el trabajo correctamente",
    }
  );
  assert(dispStatus === 200, "open-dispute returned 200", dispData);
  assert(!!dispData.dispute_id, "Dispute ID returned", dispData);

  // Verify job has open dispute
  const { data: [jobD] } = await sbAdmin(`jobs?id=eq.${jobId}&select=has_open_dispute,dispute_status`);
  assert(jobD.has_open_dispute === true, "job.has_open_dispute = true", jobD);
  assert(jobD.dispute_status === "open", "job.dispute_status = open", jobD);

  // Verify client can't confirm completion while dispute is open
  log("INFO", "Verifying client cannot confirm while dispute is open...");
  await sbAdmin(`jobs?id=eq.${jobId}`, "PATCH", { completion_status: "provider_marked_done" });
  const { data: badConfirm, status: badStatus } = await invokeEdge(
    "complete-job", clientToken, { job_id: jobId, action: "client_confirm" }
  );
  assert(badStatus !== 200, "complete-job blocked while dispute is open", { status: badStatus, data: badConfirm });

  log("INFO", `Dispute ID: ${dispData.dispute_id} — resolve via admin dashboard`);

  console.log("\n" + "═".repeat(60));
  console.log("  ✅ DISPUTE SCENARIO COMPLETE");
  console.log("  → Go to admin dashboard to resolve the dispute");
  console.log(`  → Dispute ID: ${dispData.dispute_id}`);
  console.log("═".repeat(60) + "\n");
}

// ─── Cleanup helper ────────────────────────────────────────────────────────────

async function cleanup(jobId: string) {
  log("INFO", `Cleaning up test job ${jobId}...`);
  await sbAdmin(`payments?job_id=eq.${jobId}`, "DELETE");
  await sbAdmin(`payouts?job_id=eq.${jobId}`, "DELETE");
  await sbAdmin(`invoices?job_id=eq.${jobId}`, "DELETE");
  await sbAdmin(`messages?job_id=eq.${jobId}`, "DELETE");
  await sbAdmin(`disputes?job_id=eq.${jobId}`, "DELETE");
  await sbAdmin(`jobs?id=eq.${jobId}`, "DELETE");
  log("INFO", "Cleanup done");
}

// ─── Main ──────────────────────────────────────────────────────────────────────

validateConfig();

console.log(`\n${"─".repeat(60)}`);
console.log(`  Chamby Payment Flow Test`);
console.log(`  Scenario: ${SCENARIO}`);
console.log(`  Supabase: ${SUPABASE_URL}`);
console.log(`  Stripe: ${STRIPE_SECRET_KEY.slice(0, 14)}...`);
console.log(`${"─".repeat(60)}\n`);

switch (SCENARIO) {
  case "happy_path":
    await runHappyPath();
    break;
  case "quote_rejection":
    await runQuoteRejection();
    break;
  case "dispute":
    await runDispute();
    break;
  default:
    console.error(`Unknown scenario: ${SCENARIO}`);
    console.error("Valid: happy_path, quote_rejection, dispute");
    Deno.exit(1);
}
