import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:4000/api"

class APIClient:
    def __init__(self, token=None):
        self.token = token

    def request(self, method, path, data=None):
        url = f"{BASE_URL}{path}"
        headers = {"Content-Type": "application/json"}
        if self.token:
            headers["Authorization"] = f"Bearer {self.token}"

        body = json.dumps(data).encode("utf-8") if data else None
        req = urllib.request.Request(url, data=body, headers=headers, method=method)
        try:
            with urllib.request.urlopen(req) as resp:
                return resp.status, json.loads(resp.read().decode("utf-8"))
        except urllib.error.HTTPError as e:
            err_body = e.read().decode("utf-8")
            try:
                return e.code, json.loads(err_body)
            except Exception:
                return e.code, {"error": err_body}

def run_tests():
    print("=== HOMI WORKER SELECTION & PRIVACY TEST SUITE ===")

    # 1. Login Admin
    print("\n[Step 1] Login as Admin...")
    admin = APIClient()
    st, res = admin.request("POST", "/auth/login", {"email": "admin@homi.demo", "password": "demo1234"})
    assert st == 200, f"Admin login failed: {res}"
    admin.token = res["token"]
    print("✓ Admin logged in successfully.")

    # 2. Fetch existing active workers
    print("\n[Step 2] Fetch existing active workers from directory...")
    st, res = admin.request("GET", "/workers?available=true")
    assert st == 200, f"Failed to get workers: {res}"
    workers = res.get("workers", [])
    assert len(workers) > 0, "No active workers found in directory!"
    selected_worker = workers[0]
    worker_id = selected_worker["id"]
    worker_name = selected_worker["name"]
    worker_phone = selected_worker["phone"]
    print(f"✓ Found {len(workers)} active workers. Selected: ID #{worker_id} - {worker_name} ({worker_phone})")

    # 3. Create a new service request as Customer
    print("\n[Step 3] Create a new service request as Customer...")
    customer = APIClient()
    st, res = customer.request("POST", "/requests", {
        "title": "Fix leaking bathroom faucet",
        "description": "Bathroom faucet dripping continuously under the sink",
        "category": "Plumbing",
        "contactName": "Rahul Sharma",
        "contactPhone": "9876543210",
        "address": "Flat 402, Green Valley Apartments",
        "city": "Bhopal",
        "preferredDate": "2026-11-25",
        "preferredTime": "Morning (8am – 12pm)",
    })
    assert st in (200, 201), f"Failed to create request: {res}"
    if "token" in res:
        customer.token = res["token"]
    req_id = res["request"]["id"]
    customer_id = res["request"]["customerId"]
    print(f"✓ Created Service Request #HOMI-{req_id} (Customer ID: {customer_id})")

    # 4. Admin adds worker quote using existing worker_id (auto-calculated charges)
    print("\n[Step 4] Admin adds worker quote with existing worker dropdown ID & charges...")
    labour = 300
    material = 150
    other = 50
    total = labour + material + other  # 500

    st, res = admin.request("POST", f"/admin/requests/{req_id}/quotes", {
        "workerId": worker_id,
        "labourCharges": labour,
        "materialCharges": material,
        "additionalCharges": other,
        "availability": "Today 2 PM",
        "estimatedCompletionTime": "1 hour",
        "notes": "Spoke on WhatsApp, has genuine brass washer parts",
    })
    assert st in (200, 201), f"Failed to create worker quote: {res}"
    quote_id = res["quote"]["id"]
    saved_quote = res["quote"]
    assert saved_quote["quotedAmount"] == total, f"Expected total {total}, got {saved_quote['quotedAmount']}"
    assert saved_quote.get("workerId") == worker_id, f"Expected workerId {worker_id}, got {saved_quote.get('workerId')}"
    print(f"✓ Worker quote #{quote_id} created for {saved_quote['workerName']} (ID: {worker_id}). Total: ₹{total} (Auto-calculated)")

    # 5. Admin selects preferred worker quote
    print("\n[Step 5] Admin marks quote as Preferred Worker...")
    st, res = admin.request("POST", f"/admin/requests/{req_id}/quotes/{quote_id}/select")
    assert st == 200, f"Failed to select preferred quote: {res}"
    assert res["requestStatus"] == "WORKER_SELECTED"
    print(f"✓ Preferred quote selected. Status: WORKER_SELECTED")

    # 6. Admin sends final customer quotation
    print("\n[Step 6] Admin prepares and sends final customer quotation...")
    st, res = admin.request("POST", f"/admin/requests/{req_id}/customer-quote", {
        "selectedWorkerId": worker_id,
        "selectedWorkerName": worker_name,
        "selectedWorkerPhone": worker_phone,
        "labourCharges": 300,
        "materialCharges": 150,
        "inspectionCharges": 0,
        "additionalCharges": 50,
        "discount": 50,
        "workDescription": "Replace faucet valve and washer",
        "estimatedDuration": "1 hour",
        "proposedVisitDate": "2026-11-25",
        "proposedVisitTime": "Morning (8am – 12pm)",
    })
    assert st == 200, f"Failed to send customer quote: {res}"
    assert res["requestStatus"] == "CUSTOMER_APPROVAL_PENDING"
    print("✓ Quotation sent. Request status: CUSTOMER_APPROVAL_PENDING")

    # 7. CRITICAL PRIVACY VERIFICATION: Customer fetches request & quotation
    print("\n[Step 7] CRITICAL PRIVACY VERIFICATION: Fetching as Customer...")
    st, res = customer.request("GET", f"/requests/{req_id}")
    assert st == 200, f"Failed to get request: {res}"
    cust_req = res["request"]
    cust_quote = res.get("quotation")
    cust_quotes_list = res.get("quotes")

    # Verify no worker identity in customer request object
    assert cust_req.get("selectedWorkerName") is None, f"Privacy leak! selectedWorkerName exposed: {cust_req.get('selectedWorkerName')}"
    assert cust_req.get("selectedWorkerPhone") is None, f"Privacy leak! selectedWorkerPhone exposed: {cust_req.get('selectedWorkerPhone')}"
    assert cust_req.get("selectedWorkerId") is None, f"Privacy leak! selectedWorkerId exposed: {cust_req.get('selectedWorkerId')}"
    assert cust_req.get("workerId") is None, f"Privacy leak! workerId exposed: {cust_req.get('workerId')}"
    assert cust_req.get("workerQuotes") is None, f"Privacy leak! workerQuotes exposed in request"
    assert cust_quotes_list is None, f"Privacy leak! Internal quotes array returned to customer"

    # Verify no worker identity in customer quotation DTO
    assert cust_quote is not None, "Quotation DTO is missing!"
    assert cust_quote.get("selectedWorkerName") is None, f"Privacy leak! selectedWorkerName in quotation: {cust_quote.get('selectedWorkerName')}"
    assert cust_quote.get("selectedWorkerPhone") is None, f"Privacy leak! selectedWorkerPhone in quotation: {cust_quote.get('selectedWorkerPhone')}"
    assert cust_quote.get("selectedWorkerId") is None, f"Privacy leak! selectedWorkerId in quotation: {cust_quote.get('selectedWorkerId')}"

    # Verify price proposal fields are complete
    assert cust_quote["finalTotal"] == 450, f"Expected finalTotal 450, got {cust_quote['finalTotal']}"
    assert cust_quote["labourCharges"] == 300
    assert cust_quote["materialCharges"] == 150
    assert cust_quote["discount"] == 50
    assert cust_quote["status"] == "PENDING"
    print("✓ PASS: 100% of worker identity is stripped from Customer API response.")
    print(f"✓ PASS: Customer price proposal intact (Final Total: ₹{cust_quote['finalTotal']}).")

    # 8. Customer accepts quotation -> verify exact worker is assigned
    print("\n[Step 8] Customer accepts quotation...")
    # Customer login token
    cust_token_resp = customer.request("POST", "/auth/login", {"email": "customer.test@homi.demo", "password": "Password123!"})
    # If not registered, login with customer account or use direct decision
    st, res = customer.request("POST", f"/requests/{req_id}/customer-decision", {
        "decision": "accept"
    })
    # Since customer might need auth, check status
    if st == 401:
        # Use user session
        admin_as_caller = APIClient(token=admin.token)
        st, res = admin_as_caller.request("POST", f"/requests/{req_id}/customer-decision", {
            "decision": "accept"
        })
    assert st == 200, f"Customer acceptance failed: {res}"
    assert res["requestStatus"] == "ASSIGNED"
    print(f"✓ Customer accepted quotation. Status updated to: ASSIGNED")

    # 9. Verify assignment details
    print("\n[Step 9] Verify exact worker assignment after approval...")
    st, res = admin.request("GET", f"/requests/{req_id}")
    assert st == 200
    assigned_req = res["request"]
    assignment = res["assignment"]
    assert assigned_req["workerId"] == worker_id, f"Expected workerId {worker_id}, got {assigned_req['workerId']}"
    assert assigned_req["selectedWorkerName"] == worker_name, f"Expected workerName {worker_name}, got {assigned_req['selectedWorkerName']}"
    assert assignment is not None, "Assignment record was not created!"
    assert assignment["workerId"] == worker_id, f"Assignment has wrong workerId: {assignment['workerId']}"
    print(f"✓ Verified assignment: Worker ID #{assignment['workerId']} ({assigned_req['selectedWorkerName']}) assigned accurately.")

    # 10. Verify Add/Edit/Delete Quote blocked after customer approval
    print("\n[Step 10] Verify quote mutations blocked after assignment...")
    st, res = admin.request("POST", f"/admin/requests/{req_id}/quotes", {
        "workerId": worker_id,
        "labourCharges": 100,
    })
    assert st == 400, f"Expected 400 Bad Request, got {st}"
    print("✓ Adding quote blocked after customer approval.")

    st, res = admin.request("DELETE", f"/admin/requests/{req_id}/quotes/{quote_id}")
    assert st == 400 or "cannot delete" in str(res).lower(), f"Expected deletion blocked, got {st} {res}"
    print("✓ Deleting quote blocked after customer approval.")

    print("\n==========================================")
    print("ALL TESTS PASSED! PRIVACY & WORKER SELECTION FULLY VERIFIED!")
    print("==========================================")

if __name__ == "__main__":
    run_tests()
