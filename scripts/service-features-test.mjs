import assert from "node:assert/strict";
import sharp from "sharp";
import { randomUUID } from "node:crypto";
const base = (process.env.HOMI_TEST_URL || process.argv[2] || "").replace(/\/$/, "");
if (!base) throw new Error("Usage: node scripts/service-features-test.mjs https://your-test-preview");
const stamp = Date.now(), actors = {}, coordinates = { latitude: 23.2181, longitude: 77.4345, locationSource: "map", locationLabel: "QA feature location" };
async function api(actor, path, body, method = body ? "POST" : "GET") {
  const response = await fetch(base + path, { method, headers: { Origin: base, "Content-Type": "application/json", ...(actor?.cookie ? { Cookie: actor.cookie } : {}) }, ...(body ? { body: JSON.stringify(body) } : {}) });
  const cookie = response.headers.get("set-cookie"); if (actor && cookie) actor.cookie = cookie.split(";")[0]; return { status: response.status, data: await response.json() };
}
async function register(role, label) {
  const actor = {}; const response = await api(actor, "/api/auth", { action: "register", role, name: `QA Feature ${label}`, email: `homi-smoke-${stamp}-feature-${label}@example.com`, phone: "9999999995", password: "FeatureTest123", city: "Bhopal", specialty: "Carpentry", ...coordinates, serviceRadiusKm: 10 });
  assert.equal(response.status, 200, JSON.stringify(response.data)); actor.id = (await api(actor, "/api/me")).data.user.id; actors[label] = actor; return actor;
}
async function action(actor, id, body, status = 200) { const response = await api(actor, `/api/requests/${id}`, body, "PATCH"); assert.equal(response.status, status, JSON.stringify(response.data)); return response; }
async function upload(actor, id, images) { const form = new FormData(); images.forEach((image, i) => form.append("photos", new Blob([image.data], { type: image.type }), `photo-${i}.${image.ext}`)); const response = await fetch(`${base}/api/requests/${id}/photos`, { method: "POST", headers: { Origin: base, Cookie: actor.cookie }, body: form }); return { status: response.status, data: await response.json() }; }
function slot(hours) { const local = new Date(Date.now() + hours * 3600000 + 330 * 60000).toISOString(); return { date: local.slice(0, 10), time: local.slice(11, 16) }; }
try {
  const customer = await register("customer", "customer"), worker = await register("worker", "worker"), outsider = await register("worker", "outsider");
  async function job(label) { const response = await api(customer, "/api/requests", { ...coordinates, category: "Carpentry", description: `QA feature ${label}, sofa; repair`, contactName: "QA Feature Customer", contactPhone: "9999999999", address: "QA feature address, near mandir", city: "Bhopal", requestedWorkerId: worker.id, clientKey: randomUUID() }); assert.equal(response.status, 201, JSON.stringify(response.data)); return response.data.id; }
  const id = await job("photos");
  const jpeg = await sharp({ create: { width: 2200, height: 1000, channels: 3, background: "#91aa73" } }).jpeg().withExif({ IFD0: { Artist: "Private test camera" }, IFD3: { GPSLatitudeRef: "N", GPSLatitude: "23/1 13/1 0/1", GPSLongitudeRef: "E", GPSLongitude: "77/1 26/1 0/1" } }).toBuffer();
  const png = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#edcfa0" } }).png().toBuffer();
  const webp = await sharp({ create: { width: 300, height: 200, channels: 3, background: "#afc3dd" } }).webp().toBuffer();
  const files = [{ data: jpeg, type: "image/jpeg", ext: "jpg" }, { data: png, type: "image/png", ext: "png" }, { data: webp, type: "image/webp", ext: "webp" }];
  const saved = await upload(customer, id, files); assert.equal(saved.status, 201, JSON.stringify(saved.data)); assert.equal(saved.data.photos.length, 3); const photoId = saved.data.photos[0].id;
  const picture = await fetch(`${base}/api/requests/${id}/photos/${photoId}`, { headers: { Cookie: customer.cookie } }); assert.equal(picture.status, 200); assert.equal(picture.headers.get("content-type"), "image/jpeg"); assert.match(picture.headers.get("cache-control"), /no-store/);
  const metadata = await sharp(Buffer.from(await picture.arrayBuffer())).metadata(); assert.equal(metadata.format, "jpeg"); assert.ok(metadata.width <= 1600); assert.equal(metadata.exif, undefined);
  assert.equal((await upload(customer, id, files)).data.photos.length, 3);
  const extra = await sharp({ create: { width: 100, height: 100, channels: 3, background: "red" } }).png().toBuffer(); assert.equal((await upload(customer, id, [{ data: extra, type: "image/png", ext: "png" }])).status, 409);
  assert.equal((await upload(customer, id, [{ data: Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"><script>alert(1)</script></svg>'), type: "image/jpeg", ext: "jpg" }])).status, 400);
  assert.equal((await upload(customer, id, [{ data: Buffer.alloc(5 * 1024 * 1024 + 1), type: "image/jpeg", ext: "jpg" }])).status, 413);
  assert.equal((await api(worker, `/api/requests/${id}/photos`)).status, 404); assert.equal((await fetch(`${base}/api/requests/${id}/photos/${photoId}`)).status, 401);
  console.log("PASS: private PostgreSQL photos, safe re-encoding, EXIF removal, duplicate handling, image and quota limits");
  await action(worker, id, { action: "accept" }); assert.equal((await api(worker, `/api/requests/${id}/photos`)).data.photos.length, 3); assert.equal((await upload(worker, id, [files[0]])).status, 403); assert.equal((await api(outsider, `/api/requests/${id}/photos`)).status, 404);
  assert.equal((await fetch(`${base}/api/requests/${id}/photos/${photoId}`, { method: "DELETE", headers: { Origin: base, Cookie: worker.cookie } })).status, 404);
  const removed = await fetch(`${base}/api/requests/${id}/photos/${photoId}`, { method: "DELETE", headers: { Origin: base, Cookie: customer.cookie } }); assert.equal(removed.status, 200); assert.equal((await fetch(`${base}/api/requests/${id}/photos/${photoId}`, { headers: { Cookie: worker.cookie } })).status, 404);
  console.log("PASS: photos unlock for assigned worker only; deletion is owner-only");
  await action(worker, id, { action: "quote", amount: 600, note: "All labour included" }); await action(customer, id, { action: "approve_quote", quotedAmount: 60000 }); await action(worker, id, { action: "on_the_way" }, 409);
  const time = slot(3); await action(worker, id, { action: "propose_visit", ...time, visitVersion: 0 }); await action(worker, id, { action: "confirm_visit", visitVersion: 1 }, 403); await action(customer, id, { action: "confirm_visit", visitVersion: 0 }, 409); await action(customer, id, { action: "confirm_visit", visitVersion: 1 });
  const visit = (await api(customer, `/api/requests/${id}`)).data.request; assert.equal(visit.visitStatus, "confirmed"); assert.equal(new Date(visit.visitStartsAt).toISOString(), new Date(`${time.date}T${time.time}:00+05:30`).toISOString());
  const calendar = await fetch(`${base}/api/requests/${id}/calendar`, { headers: { Cookie: customer.cookie } }); assert.equal(calendar.status, 200); const ics = await calendar.text(); assert.match(ics, /BEGIN:VCALENDAR/); assert.match(ics, /DTSTART:\d{8}T\d{6}Z/); assert.match(ics, /sofa\\; repair/); assert.equal((await fetch(`${base}/api/requests/${id}/calendar`, { headers: { Cookie: outsider.cookie } })).status, 404);
  console.log("PASS: bilateral India-time visits, stale/self-approval rejection, protected calendar download");
  const second = await job("conflict"); await action(worker, second, { action: "accept" }); await action(worker, second, { action: "propose_visit", ...time, visitVersion: 0 }, 409);
  await action(worker, id, { action: "propose_visit", ...slot(6), visitVersion: 1 }); await action(worker, second, { action: "propose_visit", ...time, visitVersion: 0 }, 409); await action(customer, id, { action: "decline_visit", visitVersion: 2 }); assert.equal((await api(customer, `/api/requests/${id}`)).data.request.visitStatus, "confirmed");
  const third = await job("race"); await action(worker, third, { action: "accept" }); const raceSlot = slot(9); await action(worker, second, { action: "propose_visit", ...raceSlot, visitVersion: 0 }); await action(worker, third, { action: "propose_visit", ...raceSlot, visitVersion: 0 });
  const confirmations = await Promise.all([api(customer, `/api/requests/${second}`, { action: "confirm_visit", visitVersion: 1 }, "PATCH"), api(customer, `/api/requests/${third}`, { action: "confirm_visit", visitVersion: 1 }, "PATCH")]); assert.deepEqual(confirmations.map(result => result.status).sort(), [200, 409]);
  console.log("PASS: overlapping confirmed slots rejected, old slot kept during rescheduling, concurrent confirmation safe");
  const search = await api(customer, `/api/requests?page=1&q=${encodeURIComponent(`#${id}`)}&scope=active`); assert.equal(search.data.requests.length, 1); assert.equal(search.data.requests[0].id, id);
  assert.equal((await api(outsider, `/api/requests?page=1&q=${id}`)).data.requests.length, 0); assert.equal((await api(customer, "/api/requests?page=-1")).status, 400); assert.equal((await api(customer, "/api/requests?page=1&service=Electrical")).data.requests.length, 0);
  const ordered = await api(worker, "/api/requests?page=1&scope=active&sort=visit"); assert.equal(ordered.status, 200); assert.equal(ordered.data.requests[0].id, id); assert.ok(ordered.data.counts.active >= 3);
  console.log("PASS: scoped server search, service filters, pagination validation and upcoming-visit sorting");
  await action(worker, id, { action: "on_the_way" }); await action(worker, id, { action: "start" }); await action(worker, id, { action: "finish" }); await action(customer, id, { action: "confirm_complete" }); assert.equal((await upload(customer, id, [files[0]])).status, 409);
  const events = (await api(customer, `/api/requests/${id}`)).data.events; assert.ok(events.some(event => event.kind === "photo_added")); assert.ok(events.some(event => event.kind === "accepted")); assert.ok(events.some(event => event.kind === "visit_confirmed"));
  console.log("PASS: features preserve the existing job lifecycle and audit history"); console.log("ALL SERVICE FEATURE TESTS PASSED");
} catch (error) { console.error(error); process.exit(1); }
