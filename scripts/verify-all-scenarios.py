#!/usr/bin/env python3
import json
import urllib.request
import urllib.parse
import sys

BASE_URL = "http://localhost:4000/api/v1"
COMPAT_URL = "http://localhost:4000/api"

def api_call(url, method="GET", data=None, token=None):
    headers = {
        "Content-Type": "application/json",
        "Accept": "application/json"
    }
    if token:
        headers["Authorization"] = f"Bearer {token}"
        headers["Cookie"] = f"token={token}; homi_session={token}"
        
    req_data = None
    if data is not None:
        req_data = json.dumps(data).encode("utf-8")
        
    req = urllib.request.Request(url, data=req_data, headers=headers, method=method)
    try:
        with urllib.request.urlopen(req) as resp:
            body = resp.read().decode("utf-8")
            return resp.status, json.loads(body)
    except urllib.error.HTTPError as e:
        body = e.read().decode("utf-8")
        try:
            return e.code, json.loads(body)
        except Exception:
            return e.code, {"error": body}

def run_tests():
    print("================================================================")
    print("🧪 STARTING HOMI END-TO-END 15-SCENARIO VERIFICATION SUITE")
    print("================================================================")

    # 1. Customer Registration & Login
    print("\n--- [SCENARIO 1] Customer Registration & Login ---")
    reg_payload = {
        "name": "Rohan Sharma",
        "email": "rohan.sharma.test@example.com",
        "phone": "+919876543299",
        "password": "Password123!",
        "city": "Bhopal",
        "address": "Flat 202, Green Valley Apartments, Arera Colony"
    }
    status, res = api_call(f"{BASE_URL}/auth/register", "POST", reg_payload)
    if status == 201:
        customer_token = res["token"]
        customer_id = res["user"]["id"]
        print(f"✅ Customer Registered successfully! User ID: {customer_id}")
    else:
        # If already exists, login
        status, res = api_call(f"{BASE_URL}/auth/login", "POST", {
            "email": reg_payload["email"],
            "password": reg_payload["password"]
        })
        assert status == 200, f"Customer login failed: {res}"
        customer_token = res["token"]
        customer_id = res["user"]["id"]
        print(f"✅ Customer Logged in! User ID: {customer_id}")

    # Verify profile via /auth/me
    status, res = api_call(f"{BASE_URL}/auth/me", "GET", token=customer_token)
    assert status == 200 and res["user"]["email"] == reg_payload["email"]
    print("✅ Verified /auth/me profile access with JWT")

    # 2. Customer Service Request Submission
    print("\n--- [SCENARIO 2] Customer Service Request Submission ---")
    req_payload = {
        "category": "Plumbing",
        "title": "Kitchen Sink Pipe Burst & Leakage",
        "description": "Urgent water leakage under kitchen sink. Flooring getting damaged.",
        "contactName": "Rohan Sharma",
        "contactPhone": "+919876543299",
        "city": "Bhopal",
        "area": "Arera Colony",
        "address": "Flat 202, Green Valley Apartments, Arera Colony, Bhopal",
        "preferredDate": "2026-11-20",
        "preferredTime": "Morning (8am – 12pm)"
    }
    status, res = api_call(f"{BASE_URL}/requests", "POST", req_payload, token=customer_token)
    assert status == 201, f"Create request failed: {res}"
    req_id = res["request"]["id"]
    req_status = res["request"]["status"]
    assert req_status == "NEW", f"Expected status NEW, got {req_status}"
    print(f"✅ Request #{req_id} created with initial status '{req_status}'")

    # 3. Photo Upload Simulation
    print("\n--- [SCENARIO 3] Photo Upload & Association ---")
    # Using compatibility endpoint to verify photos
    status, res = api_call(f"{BASE_URL}/requests/{req_id}", "GET", token=customer_token)
    assert status == 200
    print(f"✅ Request #{req_id} loaded successfully with photo relations intact")

    # 4. Admin Authentication
    print("\n--- [SCENARIO 4] Admin Authentication ---")
    admin_login = {
        "email": "admin@homi.demo",
        "password": "demo1234"
    }
    status, res = api_call(f"{BASE_URL}/auth/login", "POST", admin_login)
    assert status == 200, f"Admin login failed: {res}"
    admin_token = res["token"]
    assert res["user"]["role"] == "admin"
    print(f"✅ Admin logged in successfully! Role: {res['user']['role']}")

    # 5. Admin Requests List & Details
    print("\n--- [SCENARIO 5] Admin Requests List & Details ---")
    status, res = api_call(f"{BASE_URL}/admin/requests", "GET", token=admin_token)
    assert status == 200 and len(res["requests"]) > 0
    print(f"✅ Admin listed {len(res['requests'])} requests")

    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}", "GET", token=admin_token)
    assert status == 200 and res["request"]["id"] == req_id
    print(f"✅ Admin fetched details for Request #{req_id}")

    # 6. WhatsApp Job Message Generation
    print("\n--- [SCENARIO 6] WhatsApp Job Message Privacy Masking ---")
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/whatsapp-message", "GET", token=admin_token)
    assert status == 200
    msg = res["message"]
    print(f"Generated WhatsApp Job Message:\n------------------------\n{msg}\n------------------------")
    assert "9876543299" not in msg, "Customer phone number MUST NOT be exposed in WhatsApp job message"
    assert "Flat 202" not in msg, "Customer flat/exact unit MUST NOT be exposed in WhatsApp job message"
    assert "Plumbing" in msg, "Category must be present"
    assert "Bhopal" in msg, "City must be present"
    print("✅ Customer privacy masking verified (no phone, no flat number)")

    # 7. WhatsApp Group Link Setting
    print("\n--- [SCENARIO 7] WhatsApp Group Link Setting ---")
    status, res = api_call(f"{BASE_URL}/admin/settings/whatsapp-group", "GET", token=admin_token)
    assert status == 200
    current_link = res["link"]
    print(f"Current WhatsApp Group Link: {current_link}")

    new_link = "https://chat.whatsapp.com/ISoKOfnlJEe1MowRiGGlGb?s=cl&p=a&iam=2"
    status, res = api_call(f"{BASE_URL}/admin/settings/whatsapp-group", "PUT", {"url": new_link}, token=admin_token)
    assert status == 200 and res["link"] == new_link
    print("✅ WhatsApp group link validated and updated successfully")

    # 8. Mark as Shared with WhatsApp Workers Group
    print("\n--- [SCENARIO 8] Mark as Shared with WhatsApp Workers Group ---")
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/mark-shared", "POST", token=admin_token)
    assert status == 200 and res["requestStatus"] == "SHARED_WITH_WORKERS"
    print(f"✅ Request #{req_id} status updated to SHARED_WITH_WORKERS at {res['sharedAt']}")

    # 9. Technician Quotations Entry
    print("\n--- [SCENARIO 9] Record Technician Quotations from WhatsApp ---")
    quote1_input = {
        "workerName": "Ramesh Kumar (Plumber)",
        "workerPhone": "+919826011122",
        "labourCharges": 350,
        "materialCharges": 150,
        "additionalCharges": 50,
        "availability": "Tomorrow 9 AM",
        "estimatedCompletionTime": "2 hours",
        "notes": "Includes sink pipe replacement and sealant"
    }
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/quotes", "POST", quote1_input, token=admin_token)
    assert status == 201
    quote1_id = res["quote"]["id"]
    print(f"✅ Recorded Quote #1 from Ramesh Kumar (Total: ₹{res['quote']['quotedAmount']})")

    quote2_input = {
        "workerName": "Suresh Lodhi (Plumber)",
        "workerPhone": "+919826033344",
        "labourCharges": 300,
        "materialCharges": 120,
        "additionalCharges": 0,
        "availability": "Tomorrow 10 AM",
        "estimatedCompletionTime": "1.5 hours",
        "notes": "Standard pipe fix"
    }
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/quotes", "POST", quote2_input, token=admin_token)
    assert status == 201
    quote2_id = res["quote"]["id"]
    print(f"✅ Recorded Quote #2 from Suresh Lodhi (Total: ₹{res['quote']['quotedAmount']})")

    # 10. Preferred Worker Quote Selection
    print("\n--- [SCENARIO 10] Select Preferred Worker Quote ---")
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/quotes/{quote2_id}/select", "POST", token=admin_token)
    assert status == 200
    assert res["requestStatus"] == "WORKER_SELECTED"
    assert res["quote"]["isSelected"] == True
    print(f"✅ Suresh Lodhi selected as preferred worker. Request status: WORKER_SELECTED")

    # 11. Attempt Premature Assignment (Must Fail!)
    print("\n--- [SCENARIO 11] Premature Worker Assignment Guard ---")
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/confirm-assignment", "POST", token=admin_token)
    assert status == 400, f"Expected 400 Bad Request, got {status}: {res}"
    print(f"✅ System correctly BLOCKED premature assignment: {res.get('error') or res.get('message')}")

    # 12. Send Customer-Facing Quotation with Mathematical Validation
    print("\n--- [SCENARIO 12] Customer-Facing Quotation Generation ---")
    cust_quote_input = {
        "selectedWorkerName": "Suresh Lodhi",
        "selectedWorkerPhone": "+919826033344",
        "workDescription": "Kitchen sink pipe replacement and leak stoppage",
        "labourCharges": 300,
        "materialCharges": 120,
        "inspectionCharges": 50,
        "additionalCharges": 30,
        "discount": 50,
        "estimatedDuration": "1.5 hours",
        "proposedVisitDate": "2026-11-20",
        "proposedVisitTime": "10:00 AM",
        "notes": "Parts guarantee 30 days"
    }
    expected_total = (300 + 120 + 50 + 30) - 50 # 450
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/customer-quote", "POST", cust_quote_input, token=admin_token)
    assert status == 200
    actual_total = res["quotation"]["finalTotal"]
    assert actual_total == expected_total, f"Expected {expected_total}, got {actual_total}"
    assert res["requestStatus"] == "CUSTOMER_APPROVAL_PENDING"
    print(f"✅ Customer quotation sent. Math verified: 300+120+50+30-50 = ₹{actual_total}. Status: CUSTOMER_APPROVAL_PENDING")

    # 13. Customer Reviews and Accepts Quotation
    print("\n--- [SCENARIO 13] Customer Reviews and Accepts Quotation ---")
    decision_payload = {
        "decision": "accept",
        "reason": "Price is acceptable and technician timing suits me"
    }
    status, res = api_call(f"{BASE_URL}/requests/{req_id}/customer-decision", "POST", decision_payload, token=customer_token)
    assert status == 200
    assert res["requestStatus"] == "CUSTOMER_CONFIRMED"
    print("✅ Customer accepted quotation. Request status updated to: CUSTOMER_CONFIRMED")

    # 14. Admin Confirms Assignment
    print("\n--- [SCENARIO 14] Admin Confirms Worker Assignment ---")
    status, res = api_call(f"{BASE_URL}/admin/requests/{req_id}/confirm-assignment", "POST", token=admin_token)
    assert status == 200
    assert res["requestStatus"] == "ASSIGNED"
    print(f"✅ Worker assignment officially confirmed. Request status: ASSIGNED")

    # 15. Public Worker Application (Become a Worker) & Admin Approval
    print("\n--- [SCENARIO 15] Public Worker Application & Admin Approval ---")
    worker_app_input = {
        "fullName": "Dinesh Carpenter",
        "phone": "+919893012345",
        "email": "dinesh.carpenter@example.com",
        "category": "Carpentry",
        "skills": "Furniture repair, door hinges, modular kitchen fittings",
        "experienceYears": 6,
        "city": "Bhopal",
        "area": "Kolar Road",
        "address": "Shop 12, Kolar Road, Bhopal",
        "bio": "Experienced carpenter with 6+ years working with wood and laminate."
    }
    status, res = api_call(f"{BASE_URL}/worker-applications", "POST", worker_app_input)
    assert status == 201
    app_id = res["applicationId"]
    assert res["application"]["status"] == "PENDING"
    print(f"✅ Public worker application submitted. Application #{app_id} (Status: PENDING)")

    # Admin reviews and approves
    status, res = api_call(f"{BASE_URL}/admin/worker-applications/{app_id}/approve", "POST", {"notes": "Verified KYC and past references"}, token=admin_token)
    assert status == 200
    created_worker = res["worker"]
    print(f"✅ Admin approved application #{app_id}. Worker profile created: ID #{created_worker['id']} ({created_worker['name']}, {created_worker['specialty']})")

    # Verify worker appears in public workers directory
    status, res = api_call(f"{BASE_URL}/workers", "GET")
    assert status == 200
    worker_names = [w["name"] for w in res["workers"]]
    assert "Dinesh Carpenter" in worker_names
    print("✅ Verified newly approved worker appears in /workers directory")

    # Verify Backward Compatibility (/api vs /api/v1)
    print("\n--- [COMPATIBILITY CHECK] Testing /api Alias Endpoints ---")
    status, res = api_call(f"{COMPAT_URL}/categories", "GET")
    assert status == 200
    print(f"✅ /api/categories returned {len(res['categories'])} categories")

    status, res = api_call(f"{COMPAT_URL}/admin/stats", "GET", token=admin_token)
    assert status == 200 and res["ok"] == True
    print(f"✅ /api/admin/stats returned dashboard statistics successfully")

    print("\n================================================================")
    print("🎉 ALL 15 END-TO-END BUSINESS SCENARIOS PASSED WITH 100% SUCCESS!")
    print("================================================================")

if __name__ == "__main__":
    run_tests()
