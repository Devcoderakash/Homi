import urllib.request
import urllib.parse
import json
import sys

BASE_URL = "http://localhost:4000/api/v1"

class APIClient:
    def __init__(self):
        self.headers = {"Content-Type": "application/json"}

    def set_token(self, token):
        self.headers["Authorization"] = f"Bearer {token}"

    def request(self, method, path, data=None):
        url = f"{BASE_URL}{path}"
        req_data = json.dumps(data).encode("utf-8") if data is not None else None
        req = urllib.request.Request(url, data=req_data, headers=self.headers, method=method)
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

def test_workflow():
    client = APIClient()

    print("--- 1. Login as Admin ---")
    status, res = client.request("POST", "/auth/login", {"email": "admin@homi.demo", "password": "demo1234"})
    assert status == 200, f"Admin login failed: {res}"
    admin_token = res["token"]
    print("Admin logged in successfully.")

    print("\n--- 2. Create Service Request as Customer ---")
    status, cust_res = client.request("POST", "/requests", {
        "category": "Furniture repair",
        "title": "Sofa leg repair test",
        "description": "Left sofa leg is wobbly and broken.",
        "contactName": "Ankit Verma",
        "contactPhone": "9999999999",
        "address": "Arera Colony, near Hanuman Mandir, Bhopal",
        "city": "Bhopal",
        "preferredDate": "2026-11-21",
        "preferredTime": "Morning (8am – 12pm)",
    })
    assert status == 200 or status == 201, f"Create request failed: {cust_res}"
    req_data = cust_res["request"]
    req_id = req_data["id"]
    print(f"Created Request #HOMI-{req_id}, Status: {req_data['status']}")
    assert req_data["status"] == "NEW"

    print("\n--- 3. Admin shares to WhatsApp & adds worker quote ---")
    client.set_token(admin_token)
    status, share_res = client.request("POST", f"/requests/{req_id}/mark-shared")
    assert status == 200, f"Mark shared failed: {share_res}"

    status, quote_res = client.request("POST", f"/requests/{req_id}/worker-quotes", {
        "workerName": "Suresh Lodhi",
        "workerPhone": "7868564598",
        "labourCharges": 120,
        "materialCharges": 0,
        "additionalCharges": 0,
        "availability": "Immediate / Today",
        "estimatedCompletionTime": "1-2 hours",
        "notes": "Available today"
    })
    assert status == 200 or status == 201, f"Add worker quote failed: {quote_res}"
    worker_quote_id = quote_res["quote"]["id"]
    print(f"Added worker quote #{worker_quote_id} for Suresh Lodhi (₹120)")

    status, select_res = client.request("POST", f"/requests/{req_id}/worker-quotes/{worker_quote_id}/select")
    assert status == 200, f"Select quote failed: {select_res}"

    print("\n--- 4. Admin sends Customer Quotation ---")
    status, send_res = client.request("POST", f"/requests/{req_id}/customer-quotation", {
        "selectedWorkerName": "Suresh Lodhi",
        "selectedWorkerPhone": "7868564598",
        "labourCharges": 120,
        "materialCharges": 0,
        "inspectionCharges": 0,
        "additionalCharges": 0,
        "discount": 0,
        "workDescription": "Sofa leg repair and realignment",
        "estimatedDuration": "1-2 hours",
        "proposedVisitDate": "2026-11-21",
        "proposedVisitTime": "Morning (8am – 12pm)"
    })
    assert status == 200, f"Send quotation failed: {send_res}"
    req_after_send = send_res["request"]
    print(f"Quotation sent. Request status: {req_after_send['status']}")
    assert req_after_send["status"] == "CUSTOMER_APPROVAL_PENDING"

    print("\n--- 5. Customer reviews & accepts quotation ---")
    status, get_req = client.request("GET", f"/requests/{req_id}")
    assert status == 200
    assert get_req["quotation"] is not None
    assert get_req["quotation"]["finalTotal"] == 120
    print(f"Customer fetched quotation: ₹{get_req['quotation']['finalTotal']}")

    # Customer accepts
    status, accept_res = client.request("POST", f"/requests/{req_id}/customer-decision", {"decision": "accept"})
    assert status == 200, f"Customer accept failed: {accept_res}"
    req_after_accept = accept_res["request"]
    print(f"Customer accepted. New Request Status: {req_after_accept['status']}")
    assert req_after_accept["status"] == "ASSIGNED"

    # Check assignment record was automatically created
    status, get_assigned = client.request("GET", f"/requests/{req_id}")
    assignment = get_assigned.get("assignment")
    assert assignment is not None, "Assignment was not created automatically!"
    print(f"Assignment automatically created: Worker={assignment['workerName']}, Phone={assignment['workerPhone']}, Status={assignment['status']}")
    assert assignment["workerName"] == "Suresh Lodhi"
    assert assignment["workerPhone"] == "7868564598"

    print("\n--- 6. Work execution: In Progress -> Completed ---")
    status, prog_res = client.request("POST", f"/requests/{req_id}/in-progress")
    assert status == 200, f"In-progress failed: {prog_res}"
    print(f"Status changed to: {prog_res['requestStatus']}")
    assert prog_res["requestStatus"] == "IN_PROGRESS"

    status, comp_res = client.request("POST", f"/requests/{req_id}/complete", {
        "completionNote": "Sofa leg repaired and fixed firmly."
    })
    assert status == 200, f"Mark completed failed: {comp_res}"
    print(f"Work marked completed. Request Status: {comp_res['requestStatus']}, Payment Status: {comp_res['paymentStatus']}")
    assert comp_res["requestStatus"] == "COMPLETED"
    assert comp_res["paymentStatus"] == "PAYMENT_PENDING"

    print("\n--- 7. Customer submits payment (UTR) ---")
    status, pay_submit = client.request("POST", f"/requests/{req_id}/payment", {
        "amount": 120,
        "paymentMethod": "UPI",
        "transactionReference": "UTR987654321012"
    })
    assert status == 200, f"Submit payment failed: {pay_submit}"
    pay_data = pay_submit["payment"]
    print(f"Payment submitted: UTR={pay_data['transactionReference']}, Status={pay_data['status']}")
    assert pay_data["status"] == "PAYMENT_SUBMITTED"

    print("\n--- 8. Admin verifies payment ---")
    status, verify_res = client.request("POST", f"/admin/payments/{pay_data['id']}/verify")
    assert status == 200, f"Verify payment failed: {verify_res}"
    verified_data = verify_res["payment"]
    print(f"Payment verified! Status: {verified_data['status']}")
    assert verified_data["status"] == "PAID"

    # Check final request state
    status, final_req = client.request("GET", f"/requests/{req_id}")
    assert final_req["request"]["status"] == "COMPLETED"
    assert final_req["request"]["paymentStatus"] == "PAID"
    print("\nALL WORKFLOW STEPS PASSED PERFECTLY!")

if __name__ == "__main__":
    test_workflow()
