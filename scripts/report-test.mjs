import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";
const base = (process.env.HOMI_TEST_URL || process.argv[2] || "").replace(/\/$/, "");
if (!base) throw new Error("Usage: node scripts/report-test.mjs https://your-test-preview");
const stamp = Date.now(), point = { latitude: 23.2181, longitude: 77.4345, locationSource: "map", locationLabel: "QA report test location" };
async function api(actor, path, body, method = body ? "POST" : "GET") {
  const response = await fetch(base + path, { method, headers: { Origin: base, "Content-Type": "application/json", ...(actor?.cookie ? { Cookie: actor.cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const cookie = response.headers.get("set-cookie"); if (actor && cookie) actor.cookie = cookie.split(";")[0];
  return { status: response.status, data: await response.json() };
}
async function register(role, label) {
  const actor = {}, email = `homi-smoke-${stamp}-report-${label}@example.com`;
  const response = await api(actor, "/api/auth", { action: "register", role, name: `QA Report ${label}`, email, phone: "9999999995", password: "ReportTest123", city: "Bhopal", specialty: "Carpentry", ...point, serviceRadiusKm: 10 });
  assert.equal(response.status, 200, JSON.stringify(response.data)); actor.id = (await api(actor, "/api/me")).data.user.id; actor.email = email; return actor;
}
async function action(actor, id, body, expected = 200) { const response = await api(actor, `/api/requests/${id}`, body, "PATCH"); assert.equal(response.status, expected, JSON.stringify(response.data)); }
try {
  assert.equal((await api({}, "/api/overview")).status, 401);
  const customer = await register("customer", "customer"), worker = await register("worker", "worker"), outsider = await register("customer", "outsider");
  async function job(title, amount, index, complete = true) {
    const response = await api(customer, "/api/requests", { ...point, category: "Carpentry", description: title, contactName: "QA Report Customer", contactPhone: "9999999999", address: "QA private receipt address", city: "Bhopal", requestedWorkerId: worker.id, clientKey: randomUUID() });
    assert.equal(response.status, 201, JSON.stringify(response.data)); const id = response.data.id;
    assert.equal((await api(customer, `/api/requests/${id}/receipt`)).status, 409);
    await action(worker, id, { action: "accept" }); await action(worker, id, { action: "quote", amount, note: "Repair and labour included" }); await action(customer, id, { action: "approve_quote", quotedAmount: Math.round(amount * 100) });
    const local = new Date(Date.now() + (24 + index * 3) * 3600000 + 330 * 60000).toISOString();
    await action(worker, id, { action: "propose_visit", date: local.slice(0, 10), time: local.slice(11, 16), visitVersion: 0 }); await action(customer, id, { action: "confirm_visit", visitVersion: 1 });
    if (complete) { await action(worker, id, { action: "on_the_way" }); await action(worker, id, { action: "start" }); await action(worker, id, { action: "finish" }); await action(customer, id, { action: "confirm_complete" }); }
    return id;
  }
  const paid = await job('=HYPERLINK("https://example.invalid") QA report test', 450.50, 0);
  await action(customer, paid, { action: "payment", method: "cash" }); await action(worker, paid, { action: "payment_received" });
  const reported = await job("QA customer-reported UPI work", 600, 1); await action(customer, reported, { action: "payment", method: "upi" });
  const unpaid = await job("QA unpaid completed work", 250, 2);
  const upcoming = await job("QA upcoming visit", 700, 3, false);
  const summary = await api(worker, "/api/overview"); assert.equal(summary.status, 200, JSON.stringify(summary.data));
  assert.deepEqual(summary.data.totals, { requests: 4, active: 1, completed: 3, agreedAmount: 130050, acknowledgedAmount: 45050, outstandingAmount: 85000, reportedAmount: 60000 });
  assert.equal(summary.data.months.length, 6); assert.equal(summary.data.months.at(-1).amount, 45050); assert.equal(summary.data.months.at(-1).jobs, 1);
  assert.equal(summary.data.visits[0].id, upcoming); assert.deepEqual(summary.data.outstanding.map(row => row.id).sort(), [reported, unpaid].sort());
  assert.ok(summary.data.recent.every(row => !("address" in row) && !("customerPhone" in row) && !("latitude" in row)));
  const customerSummary = await api(customer, "/api/overview"); assert.deepEqual(customerSummary.data.totals, summary.data.totals);
  const empty = await api(outsider, "/api/overview"); assert.equal(empty.data.totals.requests, 0); assert.equal(empty.data.recent.length, 0);
  console.log("PASS: private account summaries, accurate paise totals, real monthly acknowledgement data and upcoming visits");
  const received = await api(customer, `/api/requests/${paid}/receipt`); assert.equal(received.status, 200); assert.equal(received.data.receipt.amount, 45050); assert.equal(received.data.receipt.paymentStatus, "received"); assert.ok(received.data.receipt.paidAt); assert.equal(received.data.receipt.isDemo, false);
  assert.equal((await api(worker, `/api/requests/${paid}/receipt`)).status, 200); assert.equal((await api(outsider, `/api/requests/${paid}/receipt`)).status, 404); assert.equal((await api({}, `/api/requests/${paid}/receipt`)).status, 401);
  assert.equal((await api(customer, `/api/requests/${reported}/receipt`)).data.receipt.paymentStatus, "reported"); assert.equal((await api(customer, `/api/requests/${unpaid}/receipt`)).data.receipt.paymentStatus, "unpaid"); assert.equal((await api(customer, `/api/requests/${upcoming}/receipt`)).status, 409);
  const text = await fetch(base + `/api/requests/${unpaid}/receipt?format=text&lang=hi`, { headers: { Cookie: customer.cookie } }); assert.equal(text.status, 200); const receiptText = await text.text(); assert.match(receiptText, /भुगतान दर्ज नहीं/); assert.match(receiptText, /GST/); assert.match(text.headers.get("cache-control"), /no-store/); assert.match(text.headers.get("content-disposition"), /attachment/);
  console.log("PASS: participant-only service receipts, explicit unpaid/reported/acknowledged status and Hindi download");
  const csv = await fetch(base + "/api/overview?format=csv&lang=en", { headers: { Cookie: worker.cookie } }); assert.equal(csv.status, 200); const records = await csv.text(); assert.match(records, /"'=HYPERLINK/); assert.match(records, /"450\.50"/); assert.match(records, /Job status/); assert.match(csv.headers.get("cache-control"), /no-store/);
  assert.equal((await fetch(base + "/api/overview?format=csv")).status, 401);
  console.log("PASS: scoped CSV download, formula-injection protection and explicit monetary units");
  writeFileSync("/tmp/homi-report-test.json", JSON.stringify({ customerEmail: customer.email, workerEmail: worker.email, paidId: paid, unpaidId: unpaid, reportedId: reported, upcomingId: upcoming }));
  console.log("ALL REPORT AND RECEIPT TESTS PASSED");
} catch (error) { console.error(error); process.exit(1); }
