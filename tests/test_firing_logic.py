import urllib.request
import urllib.error
import urllib.parse
import json
import pytest

BASE_URL = "http://localhost:8000"

def login(username, password):
    url = f"{BASE_URL}/auth/token"
    data = urllib.parse.urlencode({"username": username, "password": password}).encode("utf-8")
    req = urllib.request.Request(url, data=data, headers={"Content-Type": "application/x-www-form-urlencoded"})
    try:
        with urllib.request.urlopen(req) as response:
            return json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        raw_err = e.read().decode()
        try:
            return {"error": e.code, "detail": json.loads(raw_err)}
        except json.JSONDecodeError:
            return {"error": e.code, "detail": {"detail": raw_err}}

def get_staff(token):
    req = urllib.request.Request(f"{BASE_URL}/manager/staff", headers={"Authorization": f"Bearer {token}"})
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def delete_staff(token, user_id):
    req = urllib.request.Request(f"{BASE_URL}/manager/staff/{user_id}", headers={"Authorization": f"Bearer {token}"}, method="DELETE")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        raw_err = e.read().decode()
        try:
            return e.code, json.loads(raw_err)
        except json.JSONDecodeError:
            return e.code, {"detail": raw_err}

def toggle_status(token, user_id):
    req = urllib.request.Request(f"{BASE_URL}/manager/staff/{user_id}/toggle-status", headers={"Authorization": f"Bearer {token}"}, method="PUT")
    try:
        with urllib.request.urlopen(req) as response:
            return response.status, json.loads(response.read().decode())
    except urllib.error.HTTPError as e:
        return e.code, json.loads(e.read().decode())

def update_password(token, user_id, username, role, new_password):
    req = urllib.request.Request(
        f"{BASE_URL}/manager/staff/{user_id}", 
        data=json.dumps({"name": username, "role": role, "password": new_password}).encode(),
        headers={"Authorization": f"Bearer {token}", "Content-Type": "application/json"},
        method="PUT"
    )
    with urllib.request.urlopen(req) as response:
        return json.loads(response.read().decode())

def test_firing_logic():
    # Login as Manager
    manager_login = login("mohammed", "managerpassword")
    if "error" in manager_login:
        manager_login = login("mohammed", "manager123")
        if "error" in manager_login:
            manager_login = login("mohammed", "password123")
            if "error" in manager_login:
                manager_login = login("mohammed", "mohammed")

    assert "error" not in manager_login, "Manager login failed"
    token = manager_login["access_token"]
    
    staff_list = get_staff(token)
    target_cashier = next((s for s in staff_list if s["has_transactions"]), None)
    
    if not target_cashier:
        pytest.skip("Could not find a cashier with transactions to test Scenario A.")
    
    user_id = target_cashier["id"]
    username = target_cashier["name"]
    role = target_cashier["role"]

    if target_cashier["status"] == "Inactive":
        toggle_status(token, user_id)
        
    update_password(token, user_id, username, role, "mockpassword")

    # A: Hard Delete Block
    status_code, response_data = delete_staff(token, user_id)
    assert status_code in [400, 403], f"Hard delete not blocked. Got {status_code}"

    # B: Soft Delete Success
    status_code, response_data = toggle_status(token, user_id)
    assert status_code == 200, f"Deactivation failed. Got {status_code}"

    # C: Login Lockout
    login_attempt = login(username, "mockpassword")
    assert "error" in login_attempt, "Login succeeded for deactivated account"
    detail = login_attempt["detail"]["detail"]
    assert "deactivated" in detail.lower(), f"Wrong lockout message: {detail}"
        
    # Cleanup
    toggle_status(token, user_id)
