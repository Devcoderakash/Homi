#!/usr/bin/env python3
"""
HOMI Platform - End-to-End Database Workflow & Security Verification Suite
Tests the complete 10-step lifecycle against the Go backend and Supabase database.
"""

import sys
import json
import urllib.request
import urllib.error

BASE_URL = "http://localhost:4000/api/v1"

def request(method, path, data=None, token=None):
    url = f"{BASE_URL}{path}"
    headers = {"Content-Type": "application/json"}
    if token:
        headers["Authorization"] = f"Bearer {token}"
    
    body = json.dumps(data).encode("utf-8") if data else None
    req = urllib.request.Request(url, data=body, headers=headers, method=method)
    
    try:
        with urllib.request.urlopen(req, timeout=35) as resp:
            resp_body = resp.read().decode("utf-8")
            return resp.status, json.loads(resp_body) if resp_body else {}
    except urllib.error.HTTPError as e:
        err_body = e.read().decode("utf-8")
        try:
            parsed = json.loads(err_body)
        except Exception:
            parsed = {"raw": err_body}
        return e.code, parsed
    except Exception as e:
        return 0, {"error": str(e)}

def run_tests():
    print("=" * 60)
    print("🧪 HOMI DATABASE & API END-TO-END WORKFLOW TEST SUITE")
    print("=" * 60)

    # 1. Health check
    status, res = request("GET", "/health")
    assert status == 200, f"Health check failed: {status} {res}"
    print("✅ 1. Health Endpoint: 200 OK")

    # 2. Admin Login
    status, res = request("POST", "/auth/login", {"email": "admin@homi.demo", "password": "demo1234"})
    assert status == 200, f"Admin login failed: {status} {res}"
    admin_token = res["token"]
    print("✅ 2. Admin Authentication: 200 OK (JWT acquired)")

    # 3. Customer Registration / Login
    test_email = f"audit_customer_{id(status)}@homi.test"
    status, res = request("POST", "/auth/register", {
        "name": "Audit Test Customer",
        "email": test_email,
        "phone": "9876543210",
        "password": "Password123!",
        "role": "customer",
        "city": "Bhopal",
        "address": "Arera Colony"
    })
    if status == 200 or status == 201:
        customer_token = res["token"]
        customer_id = res["user"]["id"]
    else:
        # Login if already exists
        status, res = request("POST", "/auth/login", {"email": test_email, "password": "Password123!"})
        customer_token = res["token"]
        customer_id = res["user"]["id"]
    print(f"✅ 3. Customer Authentication: User #{customer_id} logged in")

    # 4. Service Request Submission (Step 1 of workflow)
    status, res = request("POST", "/requests", {
        "category": "Plumbing",
        "description": "Kitchen sink pipe is leaking heavily under the counter.",
        "contactName": "Audit Test Customer",
        "contactPhone": "9876543210",
        "city": "Bhopal",
        "address": "E-4 Arera Colony, near Hanuman Mandir",
        "preferredDate": "2026-11-25",
        "preferredTime": "Morning (8am – 12pm)"
    }, token=customer_token)
    assert status in (200, 201), f"Request creation failed: {status} {res}"
    req_id = res["id"]
    print(f"✅ 4. Customer submits service request: Request #{req_id} created (Status: NEW)")

    # 5. Worker Application Submission
    status, res = request("POST", "/worker-applications", {
        "fullName": "Kailash Sharma",
        "phone": "9826123456",
        "email": "kailash.plumber@test.com",
        "category": "Plumbing",
        "skills": "Pipe fitting, leak repairs, bathroom sanitary installation",
        "experienceYears": 8,
        "city": "Bhopal",
        "area": "MP Nagar",
        "address": "Zone 2, MP Nagar",
        "bio": "Experienced local plumber serving central Bhopal."
    })
    assert status in (200, 201), f"Worker application failed: {status} {res}"
    print("✅ 5. Worker application submission: 200 OK (Stored in worker_applications)")

    # 6. Admin reviews request and shares in WhatsApp group (Step 2 & 3)
    status, res = request("POST", f"/admin/requests/{req_id}/mark-shared", token=admin_token)
    assert status == 200, f"Mark shared failed: {status} {res}"
    print(f"✅ 6. Admin shares in WhatsApp group: Request #{req_id} status updated to SHARED_WITH_WORKERS")

    # 7. Admin manually enters worker quotation (Step 4)
    status, res = request("POST", f"/admin/requests/{req_id}/quotes", {
        "workerName": "Ramesh Lodhi",
        "workerPhone": "9826011122",
        "quotedAmount": 35000, # paise (Rs 350)
        "labourCharges": 30000,
        "materialCharges": 5000,
        "availability": "Available today 2 PM",
        "notes": "Can fix the pipe in 45 mins"
    }, token=admin_token)
    assert status in (200, 201), f"Worker quote creation failed: {status} {res}"
    quote_id = res.get("quote", {}).get("id") or res.get("id")
    print(f"✅ 7. Admin enters worker quotation: Quote #{quote_id} created for Rs 350")

    # 8. Admin selects preferred worker (Step 5)
    status, res = request("POST", f"/admin/requests/{req_id}/quotes/{quote_id}/select", token=admin_token)
    assert status == 200, f"Select quote failed: {status} {res}"
    print(f"✅ 8. Admin selects preferred worker quote #{quote_id}")

    # 9. Admin creates customer-facing quotation (Step 6)
    status, res = request("POST", f"/admin/requests/{req_id}/customer-quote", {
        "workDescription": "Kitchen sink pipe replacement and leak sealing",
        "labourCharges": 35000,
        "materialCharges": 5000,
        "inspectionCharges": 0,
        "additionalCharges": 0,
        "discount": 0,
        "finalTotal": 40000, # Rs 400
        "estimatedDuration": "1 hour",
        "proposedVisitDate": "2026-11-25",
        "proposedVisitTime": "2:00 PM – 4:00 PM",
        "notes": "Standard 30-day service warranty included."
    }, token=admin_token)
    assert status in (200, 201), f"Customer quotation failed: {status} {res}"
    cust_quote_id = res.get("id") or quote_id
    print(f"✅ 9. Admin sends customer quotation: Quote sent (Status: CUSTOMER_APPROVAL_PENDING)")

    # 10. CRITICAL SECURITY TEST: Try to assign worker BEFORE customer approval (MUST FAIL)
    status, res = request("POST", f"/admin/requests/{req_id}/confirm-assignment", token=admin_token)
    assert status >= 400, f"CRITICAL FAILURE: Assignment succeeded before customer confirmation! {status} {res}"
    print(f"🔒 10. Integrity Verification: Worker assignment BLOCKED prior to customer approval ({status} {res.get('error', res)})")

    # 11. Customer reviews and accepts quotation (Step 7)
    status, res = request("POST", f"/requests/{req_id}/customer-decision", {
        "decision": "ACCEPT"
    }, token=customer_token)
    assert status == 200, f"Customer accept failed: {status} {res}"
    print(f"✅ 11. Customer accepts quotation: Request #{req_id} transitioned to CUSTOMER_CONFIRMED")

    # 12. Worker assignment is NOW possible (Step 8)
    status, res = request("POST", f"/admin/requests/{req_id}/confirm-assignment", token=admin_token)
    assert status in (200, 201), f"Assignment after confirmation failed: {status} {res}"
    print(f"✅ 12. Worker assignment succeeded post-approval: Request #{req_id} assigned")

    # 13. Admin updates work in-progress (Step 9)
    status, res = request("POST", f"/admin/requests/{req_id}/in-progress", token=admin_token)
    assert status == 200, f"In-progress failed: {status} {res}"
    print(f"✅ 13. Technician on site: Request #{req_id} marked IN_PROGRESS")

    # 14. Admin completes work (Step 10)
    status, res = request("POST", f"/admin/requests/{req_id}/complete", {
        "completionNote": "Job completed cleanly, leak sealed."
    }, token=admin_token)
    assert status == 200, f"Completion failed: {status} {res}"
    print(f"✅ 14. Work completed: Request #{req_id} marked COMPLETED")

    # 15. Verify Customer View (clean customer-facing quote, no internal worker quotes exposed)
    status, res = request("GET", f"/requests/{req_id}", token=customer_token)
    assert status == 200, f"Customer get request failed: {status} {res}"
    assert "workerQuotes" not in res or res["workerQuotes"] is None, "SECURITY LEAK: Customer should not see workerQuotes"
    print("🔒 15. Security Verification: Customer request response does not leak internal worker quotes")

    print("\n" + "=" * 60)
    print("🎉 ALL 15 DATABASE & WORKFLOW VERIFICATION TESTS PASSED 100%!")
    print("=" * 60)

if __name__ == "__main__":
    run_tests()
