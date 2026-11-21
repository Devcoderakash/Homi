import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";

const base = process.argv[2] || "http://localhost:4000";
const stamp = Date.now();

async function api(actor, path, body, method) {
  const headers = { Accept: "application/json" };
  if (actor.cookie) headers.Cookie = actor.cookie;
  const opts = { method: method || (body ? "POST" : "GET"), headers };
  if (body) {
    headers["Content-Type"] = "application/json";
    opts.body = JSON.stringify(body);
  }
  const res = await fetch(base + path, opts);
  const setCookie = res.headers.get("set-cookie");
  if (setCookie) {
    const sessionPart = setCookie.split(";")[0];
    actor.cookie = sessionPart;
  }
  const text = await res.text();
  let data = {};
  try { data = JSON.parse(text); } catch { data = { text }; }
  return { status: res.status, data };
}

function actor() {
  return { cookie: null, id: null, email: null };
}

async function register(label, role, city = "Bhopal", extra = {}) {
  const person = actor();
  const email = `homi-mkt-${stamp}-${label}@example.com`;
  const res = await api(person, "/api/auth", {
    action: "register",
    role,
    name: `Mkt Test ${label}`,
    email,
    phone: "9876543210",
    password: "Password123!",
    city,
    specialty: "Plumbing",
    latitude: 23.2599,
    longitude: 77.4126,
    locationLabel: "Arera Colony, Bhopal",
    serviceRadiusKm: 15,
    ...extra,
  });
  assert.equal(res.status, 200, `Registration failed for ${label}: ${JSON.stringify(res.data)}`);
  const me = await api(person, "/api/me");
  person.id = me.data.user.id;
  person.email = email;
  return person;
}

async function main() {
  console.log(`Starting Admin-Controlled Marketplace End-to-End Test on ${base}...`);

  // 1. Setup actors: Customer, Worker 1, Worker 2 (Competitor), Admin
  const customer = await register("customer", "customer");
  const worker1 = await register("worker1", "worker");
  const worker2 = await register("worker2", "worker");

  // Admin actor (use default seed credentials or register admin)
  const admin = actor();
  let adminLogin = await api(admin, "/api/auth", {
    action: "login",
    email: "admin@homi.demo",
    password: "adminpassword",
  });

  // If demo admin not seeded with that password, register or use admin role
  if (adminLogin.status !== 200) {
    const adminReg = await register("adminuser", "admin");
    admin.cookie = adminReg.cookie;
    admin.id = adminReg.id;
  }
  console.log("PASS: 1. Customer, Workers and Admin actors initialized");

  // 2. Customer submits a new service request
  const requestPayload = {
    category: "Plumbing",
    description: "Water leaking under the kitchen sink — urgent repair needed",
    contactName: "Mkt Test Customer",
    contactPhone: "9876543210",
    address: "E-4 Arera Colony, Bhopal",
    city: "Bhopal",
    language: "en",
    latitude: 23.2241,
    longitude: 77.4345,
    locationLabel: "Arera Colony, Bhopal",
    locationSource: "map",
    clientKey: randomUUID(),
  };

  const createRes = await api(customer, "/api/requests", requestPayload);
  assert.equal(createRes.status, 201, `Create request failed: ${JSON.stringify(createRes.data)}`);
  const requestId = createRes.data.id;
  assert.ok(requestId > 0);

  // Verify initial status is strictly PENDING_ADMIN_REVIEW
  const custCheck = await api(customer, `/api/requests/${requestId}`);
  assert.equal(custCheck.status, 200);
  assert.equal(custCheck.data.request.status, "pending_admin_review", "Initial status MUST be pending_admin_review");
  console.log(`PASS: 2. Customer created request #${requestId} with initial status: pending_admin_review`);

  // 3. Verify request is NOT visible to workers before admin approval
  const workerJobsBefore = await api(worker1, "/api/v1/worker/jobs");
  assert.equal(workerJobsBefore.status, 200);
  const jobsBeforeList = workerJobsBefore.data.jobs || workerJobsBefore.data.data || [];
  const foundBefore = jobsBeforeList.find(j => j.id === requestId);
  assert.ok(!foundBefore, "Worker must NOT see unapproved request in jobs feed");
  console.log("PASS: 3. Unapproved request is invisible to workers");

  // 4. Admin reviews request and approves & publishes it
  const adminReqList = await api(admin, "/api/v1/admin/requests?status=pending_admin_review");
  assert.equal(adminReqList.status, 200);
  const requestsList = adminReqList.data.requests || adminReqList.data.data?.requests || [];
  const foundInAdmin = requestsList.find(r => r.id === requestId);
  assert.ok(foundInAdmin, "Admin must see request in pending review list");

  const publishRes = await api(admin, `/api/v1/admin/requests/${requestId}/publish`, {
    notes: "Approved for local plumber broadcast",
  });
  assert.equal(publishRes.status, 200, `Publish failed: ${JSON.stringify(publishRes.data)}`);
  const pubReq = publishRes.data.request || publishRes.data.data;
  assert.equal(pubReq.status, "open_for_applications");
  console.log(`PASS: 4. Admin approved & published request #${requestId} -> open_for_applications`);

  // 5. Workers see the approved job in their feed
  const workerJobsAfter = await api(worker1, "/api/v1/worker/jobs");
  assert.equal(workerJobsAfter.status, 200);
  const jobsAfterList = workerJobsAfter.data.jobs || workerJobsAfter.data.data || [];
  const foundJob = jobsAfterList.find(j => j.id === requestId);
  assert.ok(foundJob, "Worker must see approved request in available jobs feed");
  console.log("PASS: 5. Worker now sees approved job in available jobs marketplace");

  // 6. Worker 1 applies for the job
  const app1Res = await api(worker1, `/api/v1/worker/jobs/${requestId}/apply`, {
    expectedCharges: 350,
    estimatedArrival: "Within 1 hour",
    note: "I have 5 years experience with sanitary pipes and have tools ready.",
  });
  assert.equal(app1Res.status, 201, `Worker 1 apply failed: ${JSON.stringify(app1Res.data)}`);
  const app1 = app1Res.data.application || app1Res.data.data;
  const app1Id = app1.id;
  assert.equal(app1.status, "pending");

  // 7. Worker 2 (competitor) also applies
  const app2Res = await api(worker2, `/api/v1/worker/jobs/${requestId}/apply`, {
    expectedCharges: 400,
    estimatedArrival: "Within 2 hours",
    note: "Master plumber available today.",
  });
  assert.equal(app2Res.status, 201);
  const app2 = app2Res.data.application || app2Res.data.data;
  const app2Id = app2.id;

  // Verify duplicate application by same worker is rejected (409)
  const dupApp = await api(worker1, `/api/v1/worker/jobs/${requestId}/apply`, { expectedCharges: 300 });
  assert.equal(dupApp.status, 409, "Duplicate worker application must be rejected");
  console.log("PASS: 6. Both workers applied; duplicate application rejected with 409");

  // 8. Admin reviews applications and shortlists Worker 1
  const adminApps = await api(admin, `/api/v1/admin/applications?requestId=${requestId}`);
  assert.equal(adminApps.status, 200);
  const appList = adminApps.data.applications || adminApps.data.data?.applications || [];
  assert.equal(appList.length, 2, "Admin must see both worker proposals");

  const shortlistRes = await api(admin, `/api/v1/admin/applications/${app1Id}/shortlist`, {});
  assert.equal(shortlistRes.status, 200);
  const shortApp = shortlistRes.data.application || shortlistRes.data.data;
  assert.equal(shortApp.status, "shortlisted");
  console.log("PASS: 7. Admin shortlisted Worker 1 proposal");

  // 9. Admin assigns Worker 1 to the job
  const assignRes = await api(admin, `/api/v1/admin/requests/${requestId}/assign`, {
    workerId: worker1.id,
    notes: "Assigned based on experience and competitive quote",
  });
  assert.equal(assignRes.status, 200, `Assign failed: ${JSON.stringify(assignRes.data)}`);
  const assignedReq = assignRes.data.request || assignRes.data.data;
  assert.equal(assignedReq.status, "assigned");
  assert.equal(assignedReq.workerId, worker1.id);

  // Verify non-selected applicant (Worker 2) is automatically marked rejected
  const app2Check = await api(admin, `/api/v1/admin/applications/${app2Id}`);
  const app2Details = app2Check.data.application || app2Check.data.data?.application;
  assert.equal(app2Details.status, "rejected", "Non-selected worker application must be rejected");
  console.log(`PASS: 8. Admin assigned Worker 1 -> status: assigned; Worker 2 marked rejected`);

  // 10. Worker 1 sees job in active assignments
  const assignments = await api(worker1, "/api/requests");
  assert.equal(assignments.status, 200);
  const activeJob = assignments.data.requests.find(r => r.id === requestId);
  assert.ok(activeJob, "Assigned worker must see job in assignments");
  assert.equal(activeJob.workerId, worker1.id);
  console.log("PASS: 9. Assigned worker sees job in their active assignments list");

  // 11. Worker 1 sends quote -> Customer approves -> Journey progress -> Completion & Payment
  // Quote
  const quoteRes = await api(worker1, `/api/requests/${requestId}`, {
    action: "quote",
    amount: 350,
    note: "Replace drain pipe and washer",
  }, "PATCH");
  assert.equal(quoteRes.status, 200);

  // Customer approves quote
  const appQuote = await api(customer, `/api/requests/${requestId}`, {
    action: "approve_quote",
    quotedAmount: 35000,
  }, "PATCH");
  assert.equal(appQuote.status, 200);

  // Worker proposes visit
  const visitLocal = new Date(Date.now() + 2 * 3600000 + 330 * 60000).toISOString();
  const propVisit = await api(worker1, `/api/requests/${requestId}`, {
    action: "propose_visit",
    date: visitLocal.slice(0, 10),
    time: visitLocal.slice(11, 16),
    visitVersion: 0,
  }, "PATCH");
  assert.equal(propVisit.status, 200);

  // Customer confirms visit
  const confVisit = await api(customer, `/api/requests/${requestId}`, {
    action: "confirm_visit",
    visitVersion: 1,
  }, "PATCH");
  assert.equal(confVisit.status, 200);

  // Worker on the way
  const onWay = await api(worker1, `/api/requests/${requestId}`, { action: "on_the_way" }, "PATCH");
  assert.equal(onWay.status, 200);

  // Worker starts work
  const startWork = await api(worker1, `/api/requests/${requestId}`, { action: "start" }, "PATCH");
  assert.equal(startWork.status, 200);

  // Worker finishes work
  const finishWork = await api(worker1, `/api/requests/${requestId}`, { action: "finish" }, "PATCH");
  assert.equal(finishWork.status, 200);

  // Customer confirms completion
  const confirmComp = await api(customer, `/api/requests/${requestId}`, { action: "confirm_complete" }, "PATCH");
  assert.equal(confirmComp.status, 200);

  // Customer reports direct payment
  const payRep = await api(customer, `/api/requests/${requestId}`, { action: "payment", method: "upi" }, "PATCH");
  assert.equal(payRep.status, 200);

  // Worker confirms payment received
  const payRec = await api(worker1, `/api/requests/${requestId}`, { action: "payment_received" }, "PATCH");
  assert.equal(payRec.status, 200);

  // Customer submits 5-star review
  const revRes = await api(customer, `/api/requests/${requestId}/review`, {
    rating: 5,
    comment: "Excellent repair, arrived on time and fixed quickly!",
  });
  assert.equal(revRes.status, 201);
  console.log("PASS: 10. Quote, Visit, Execution, Direct Payment and Customer Review lifecycle completed");

  // Verify final request state in Admin Panel
  const finalAdminCheck = await api(admin, `/api/v1/admin/requests/${requestId}`);
  assert.equal(finalAdminCheck.status, 200);
  const finalReq = finalAdminCheck.data.request || finalAdminCheck.data.data?.request;
  assert.equal(finalReq.status, "completed");
  assert.equal(finalReq.paymentStatus, "received");
  assert.equal(finalReq.reviewRating, 5);
  console.log("PASS: 11. Final verification: Admin sees completed request with full audit record");

  console.log("\n========================================================");
  console.log("ALL ADMIN-CONTROLLED MARKETPLACE WORKFLOW TESTS PASSED!");
  console.log("========================================================\n");
}

main().catch((err) => {
  console.error("\nTEST SUITE FAILED:", err);
  process.exit(1);
});
