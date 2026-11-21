import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
const base = (process.env.HOMI_TEST_URL || process.argv[2] || "").replace(/\/$/, "");
if (!base) throw new Error("Usage: node scripts/location-test.mjs https://your-test-preview");
const stamp = Date.now(), point = { latitude: 23.2181, longitude: 77.4345, locationSource: "map", locationLabel: "QA location test, Arera Colony" };
async function api(actor, path, body, method = body ? "POST" : "GET") {
  const response = await fetch(base + path, { method, headers: { "Content-Type": "application/json", Origin: base, ...(actor?.cookie ? { Cookie: actor.cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const cookie = response.headers.get("set-cookie"); if (actor && cookie) actor.cookie = cookie.split(";")[0];
  return { status: response.status, data: await response.json() };
}
const profile = { name: "QA Location Worker", phone: "9999999995", city: "Bhopal", specialty: "Carpentry", available: true, experienceYears: 2, visitFee: 100, spokenLanguages: ["en", "hi"] };
async function worker(label, latitude, radius = 10, city = "Bhopal") {
  const actor = {};
  const response = await api(actor, "/api/auth", { ...profile, name: `QA Location ${label}`, action: "register", role: "worker", email: `homi-location-${stamp}-${label}@example.com`, password: "LocationTest123", city, ...point, latitude, serviceRadiusKm: radius });
  assert.equal(response.status, 200, JSON.stringify(response.data)); const user = (await api(actor, "/api/me")).data.user; actor.id = user.id; return actor;
}
const payload = { ...point, category: "Carpentry", description: "QA location test: darwaza band nahi hota", contactName: "QA Test Guest", contactPhone: "9999999999", address: "QA Test Address, Arera Colony", city: "Bhopal", clientKey: randomUUID() };
try {
  const noLocation = await api({}, "/api/auth", { ...profile, action: "register", role: "worker", email: `homi-location-${stamp}-missing@example.com`, password: "LocationTest123" }); assert.equal(noLocation.status, 400);
  const invalidRadius = await api({}, "/api/auth", { ...profile, ...point, action: "register", role: "worker", email: `homi-location-${stamp}-invalid@example.com`, password: "LocationTest123", serviceRadiusKm: 500 }); assert.equal(invalidRadius.status, 400);
  console.log("PASS: worker coordinates are required; excessive service radius is rejected");
  const near = await worker("near", 23.2241, 10);
  const farSameCity = await worker("far", 23.55, 25);
  const narrow = await worker("narrow", 23.2381, 1, "Neighbouring town");
  const guest = {};
  const missingPin = await api(guest, "/api/requests", { ...payload, latitude: null, longitude: null }); assert.equal(missingPin.status, 400);
  const outside = await api(guest, "/api/requests", { ...payload, latitude: 91 }); assert.equal(outside.status, 400);
  console.log("PASS: customer requests need valid India-region coordinates, no city-only fallback");
  const sent = await api(guest, "/api/requests", payload); assert.equal(sent.status, 201, JSON.stringify(sent.data)); const id = sent.data.id;
  const nearBoard = (await api(near, "/api/requests")).data.requests; const candidate = nearBoard.find(r => r.id === id); assert.ok(candidate); assert.ok(candidate.distanceKm >= 0.6 && candidate.distanceKm <= 0.8);
  assert.equal(candidate.latitude, null); assert.equal(candidate.longitude, null); assert.equal(candidate.locationLabel, null); assert.equal(candidate.customerPhone, ""); assert.equal(candidate.hasLocation, true);
  assert.ok(!(await api(farSameCity, "/api/requests")).data.requests.some(r => r.id === id)); assert.ok(!(await api(narrow, "/api/requests")).data.requests.some(r => r.id === id));
  assert.equal((await api(farSameCity, `/api/requests/${id}`, { action: "accept" }, "PATCH")).status, 403);
  assert.equal((await api(narrow, `/api/requests/${id}`, { action: "accept" }, "PATCH")).status, 403);
  const nearUpdates = (await api(near, "/api/notifications")).data.notifications; const farUpdates = (await api(farSameCity, "/api/notifications")).data.notifications;
  assert.ok(nearUpdates.some(n => n.requestId === id)); assert.ok(!farUpdates.some(n => n.requestId === id));
  console.log("PASS: same-city far workers cannot view or claim; notifications reach only in-range workers; candidate pins stay private");
  const directory = (await api({}, `/api/workers?lat=${point.latitude}&lon=${point.longitude}`)).data.workers;
  assert.ok(directory.some(w => w.id === near.id)); assert.ok(!directory.some(w => w.id === farSameCity.id)); assert.ok(!directory.some(w => w.id === narrow.id));
  assert.ok(directory.every(w => !("latitude" in w) && !("longitude" in w)));
  const targeted = await api(guest, "/api/requests", { ...payload, clientKey: randomUUID(), requestedWorkerId: farSameCity.id }); assert.equal(targeted.status, 400);
  console.log("PASS: nearby directory and preferred-worker booking enforce range without exposing worker base pins");
  const newRadius = await api(narrow, "/api/me", { ...profile, ...point, latitude: 23.2381, city: "Neighbouring town", serviceRadiusKm: 3 }, "PATCH"); assert.equal(newRadius.status, 200);
  assert.ok((await api(narrow, "/api/requests")).data.requests.some(r => r.id === id));
  console.log("PASS: radius updates work; a close worker across a city-name boundary can match by actual distance");
  assert.equal((await api(near, `/api/requests/${id}`, { action: "accept" }, "PATCH")).status, 200);
  const assigned = (await api(near, `/api/requests/${id}`)).data.request; assert.equal(assigned.latitude, point.latitude); assert.equal(assigned.longitude, point.longitude);
  assert.equal((await api(farSameCity, `/api/requests/${id}`)).status, 404);
  assert.equal((await api(near, "/api/me", { ...profile, ...point, latitude: 23.6, serviceRadiusKm: 10 }, "PATCH")).status, 200);
  assert.equal((await api(near, `/api/requests/${id}`)).status, 200);
  console.log("PASS: precise customer pin unlocks only after assignment; moving base does not orphan an assigned job");
  const open = await api(guest, "/api/requests", { ...payload, clientKey: randomUUID() }); assert.equal(open.status, 201);
  const changed = await api(guest, `/api/requests/${open.data.id}`, { ...point, latitude: 23.55, action: "location", address: "QA relocated address", city: "Bhopal" }, "PATCH"); assert.equal(changed.status, 200);
  assert.ok((await api(farSameCity, "/api/requests")).data.requests.some(r => r.id === open.data.id));
  assert.equal((await api(near, `/api/requests/${open.data.id}`, { ...point, action: "location", address: "Other home", city: "Bhopal" }, "PATCH")).status, 409);
  console.log("PASS: only the customer can move an open request; proximity matching refreshes for the new pin");
  console.log("ALL LOCATION TESTS PASSED");
} catch (error) { console.error(error); process.exit(1); }
