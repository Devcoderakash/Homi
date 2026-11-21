import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { writeFileSync } from "node:fs";

const base = (process.env.HOMI_TEST_URL || process.argv[2] || "").replace(/\/$/, "");
if (!base) throw new Error("Usage: node scripts/smoke-test.mjs https://your-test-preview");
const stamp = Date.now();
const accounts = [];
function actor() { return { cookie: "" }; }
async function api(person, path, body, method = body ? "POST" : "GET") {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: base, ...(person?.cookie ? { Cookie: person.cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const cookie = response.headers.get("set-cookie"); if (person && cookie) person.cookie = cookie.split(";")[0];
  const data = await response.json();
  return { status: response.status, data };
}
const TEST_PASS = process.env.TEST_PASSWORD || ("qa-pass-" + randomUUID());
const NEW_TEST_PASS = process.env.NEW_TEST_PASSWORD || ("new-qa-pass-" + randomUUID());

async function register(label, role = "worker", city = "Bhopal") {
  const person = actor(); const email = `homi-smoke-${stamp}-${label}@example.com`;
  const response = await api(person, "/api/auth", { action: "register", role, name: `QA Test ${label}`, email, phone: "9999999995", password: TEST_PASS, city, specialty: "Carpentry", ...(role === "worker" ? { latitude: city === "Delhi" ? 28.6139 : 23.2241, longitude: city === "Delhi" ? 77.2090 : 77.4345, locationSource: "map", locationLabel: `QA work location, ${city}`, serviceRadiusKm: 10 } : {}) });
  assert.equal(response.status, 200, JSON.stringify(response.data)); const me = await api(person, "/api/me"); person.id = me.data.user.id; person.email = email; accounts.push(email); return person;
}
async function patch(person, id, body, expected = 200) { const result = await api(person, `/api/requests/${id}`, body, "PATCH"); assert.equal(result.status, expected, JSON.stringify(result.data)); return result; }
const requestPayload = { category: "Carpentry", description: "दरवाज़ा बंद नहीं होता — QA integration test", contactName: "QA Test Guest", contactPhone: "९९९९९९९९९९", address: "QA test address near mandir", city: "भोपाल", language: "hi", latitude: 23.2181, longitude: 77.4345, locationLabel: "QA test service location, Bhopal", locationSource: "map", clientKey: randomUUID() };

try {
  assert.equal((await api(actor(), "/api/requests")).status, 401);
  const worker = await register("worker"); const competitor = await register("competitor"); const distant = await register("distant", "worker", "Delhi"); const outsider = await register("outsider", "customer");
  const profile = { name: "QA Test Carpenter", phone: "9999999995", city: "Bhopal", specialty: "Carpentry", bio: "QA profile, not a real service provider.", experienceYears: 4, visitFee: 149, spokenLanguages: ["en", "hi"], available: true };
  assert.equal((await api(worker, "/api/me", profile, "PATCH")).status, 200);
  const directory = await api(actor(), "/api/workers?city=Bhopal&service=Carpentry"); const publicWorker = directory.data.workers.find(item => item.id === worker.id);
  assert.ok(publicWorker); assert.equal(publicWorker.visitFee, 14900); assert.ok(!("phone" in publicWorker)); assert.ok(!("email" in publicWorker));
  console.log("PASS: real worker profiles, saved settings and private public-directory data");
  const guest = actor(); const sent = await api(guest, "/api/requests", { ...requestPayload, requestedWorkerId: worker.id }); assert.equal(sent.status, 201, JSON.stringify(sent.data)); const id = sent.data.id;
  const beforeUpgrade = await api(guest, "/api/me"); guest.id = beforeUpgrade.data.user.id;
  const upgradedEmail = `homi-smoke-${stamp}-guest@example.com`; accounts.push(upgradedEmail);
  const upgrade = await api(guest, "/api/auth", { action: "register", role: "customer", name: "QA Test Customer", email: upgradedEmail, phone: "9999999999", password: TEST_PASS }); assert.equal(upgrade.status, 200);
  assert.equal((await api(guest, "/api/me")).data.user.id, guest.id); assert.equal((await api(guest, "/api/requests")).data.requests[0].id, id);
  assert.equal((await api(guest, "/api/requests", { ...requestPayload, requestedWorkerId: worker.id })).data.id, id);
  console.log("PASS: no-signup Hindi request, guest upgrade preserves history, duplicate submit is safe");
  const candidate = await api(worker, `/api/requests/${id}`); assert.equal(candidate.status, 200); assert.equal(candidate.data.request.customerPhone, ""); assert.equal(candidate.data.request.customerEmail, ""); assert.equal(candidate.data.request.address, "Bhopal");
  assert.equal((await api(competitor, `/api/requests/${id}`)).status, 404); assert.equal((await api(distant, `/api/requests/${id}`)).status, 404); assert.equal((await api(outsider, `/api/requests/${id}`)).status, 404);
  assert.equal((await api(worker, `/api/requests/${id}/messages`, { body: "Not assigned yet" })).status, 403);
  await patch(competitor, id, { action: "accept" }, 403); await patch(worker, id, { action: "accept" });
  assert.equal((await api(worker, `/api/requests/${id}`)).data.request.customerPhone, "+919999999999");
  console.log("PASS: chosen-worker targeting, city matching, ownership checks and contact unlocking");
  assert.equal((await api(worker, `/api/requests/${id}/messages`, { body: "Namaste, I can visit today." })).status, 201);
  assert.equal((await api(guest, `/api/requests/${id}/messages`, { body: "धन्यवाद, पहले कीमत बता दें।" })).status, 201);
  assert.equal((await api(outsider, `/api/requests/${id}/messages`, { body: "Not my job" })).status, 403);
  const chat = await api(guest, `/api/requests/${id}`); assert.equal(chat.data.messages.length, 2); assert.match(chat.data.messages[1].body, /धन्यवाद/);
  await patch(worker, id, { action: "on_the_way" }, 409);
  await patch(worker, id, { action: "quote", amount: 500, note: "Door alignment and labour, all included." });
  await patch(guest, id, { action: "approve_quote", quotedAmount: 40000 }, 409);
  await patch(guest, id, { action: "approve_quote", quotedAmount: 50000 });
  await patch(worker, id, { action: "on_the_way" }, 409);
  const visitLocal = new Date(Date.now() + 2 * 3600000 + 330 * 60000).toISOString();
  await patch(worker, id, { action: "propose_visit", date: visitLocal.slice(0, 10), time: visitLocal.slice(11, 16), visitVersion: 0 });
  await patch(worker, id, { action: "confirm_visit", visitVersion: 1 }, 403);
  await patch(guest, id, { action: "confirm_visit", visitVersion: 1 });
  await patch(worker, id, { action: "on_the_way" }); await patch(worker, id, { action: "start" }); await patch(worker, id, { action: "finish" });
  assert.equal((await api(guest, `/api/requests/${id}`)).data.request.status, "awaiting_confirmation");
  await patch(worker, id, { action: "confirm_complete" }, 409); await patch(guest, id, { action: "confirm_complete" });
  await patch(guest, id, { action: "payment", method: "upi" }); await patch(worker, id, { action: "payment_received" });
  assert.equal((await api(guest, `/api/requests/${id}/review`, { rating: 5, comment: "समय पर काम किया। QA test review." })).status, 201);
  assert.equal((await api(guest, `/api/requests/${id}/review`, { rating: 4 })).status, 409);
  const complete = await api(guest, `/api/requests/${id}`); assert.equal(complete.data.request.status, "completed"); assert.equal(complete.data.request.paymentStatus, "received"); assert.equal(complete.data.request.reviewRating, 5); assert.ok(complete.data.events.some(event => event.kind === "payment_received"));
  assert.equal((await api(actor(), `/api/workers/${worker.id}`)).data.worker.rating, 5);
  console.log("PASS: private chat, exact quote approval, customer-confirmed completion, direct-payment record and unique review");
  const updates = await api(worker, "/api/notifications"); assert.ok(updates.data.unread > 0); assert.ok(updates.data.notifications.some(item => item.kind === "review"));
  assert.equal((await api(worker, "/api/notifications", { all: true })).status, 200); assert.equal((await api(worker, "/api/notifications")).data.unread, 0);
  console.log("PASS: persistent in-app updates and read state");
  const race = await api(guest, "/api/requests", { ...requestPayload, clientKey: randomUUID() }); assert.equal(race.status, 201); const raceId = race.data.id;
  const results = await Promise.all([api(worker, `/api/requests/${raceId}`, { action: "accept" }, "PATCH"), api(competitor, `/api/requests/${raceId}`, { action: "accept" }, "PATCH")]); assert.deepEqual(results.map(r => r.status).sort(), [200, 409]);
  await patch(guest, raceId, { action: "cancel" });
  console.log("PASS: transactional double-claim protection and cancellation");
  assert.equal((await api(worker, "/api/me", { ...profile, available: false }, "PATCH")).status, 200);
  assert.ok(!(await api(actor(), "/api/workers?city=Bhopal")).data.workers.some(item => item.id === worker.id));
  assert.equal((await api(worker, "/api/me", profile, "PATCH")).status, 200);
  const oldCookie = worker.cookie;
  assert.equal((await api(worker, "/api/me", { action: "password", currentPassword: TEST_PASS, newPassword: NEW_TEST_PASS }, "PATCH")).status, 200);
  assert.equal((await api({ cookie: oldCookie }, "/api/me")).data.user, null);
  assert.equal((await api(actor(), "/api/auth", { action: "login", email: worker.email, password: TEST_PASS })).status, 401);
  assert.equal((await api(worker, "/api/auth", { action: "login", email: worker.email, password: NEW_TEST_PASS })).status, 200);
  assert.equal((await api(worker, "/api/auth/logout", {})).status, 200); assert.equal((await api(worker, "/api/me")).data.user, null);
  console.log("PASS: worker availability, password rotation, old-session revocation and logout");
  const csrf = await fetch(base + "/api/requests", { method: "POST", headers: { Origin: "https://unrelated.example", "Content-Type": "application/json" }, body: "{}" }); assert.equal(csrf.status, 403);
  console.log("PASS: cross-origin mutation protection");
  writeFileSync("/tmp/homi-smoke-accounts.json", JSON.stringify({ accounts, stamp, jobId: id }));
  console.log("ALL FULL-STACK TESTS PASSED");
} catch (error) { writeFileSync("/tmp/homi-smoke-accounts.json", JSON.stringify({ accounts, stamp })); console.error(error); process.exit(1); }
