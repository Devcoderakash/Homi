#!/usr/bin/env python3
"""
HOMI Platform — Secure Administrator Provisioning CLI

Usage:
    python3 scripts/provision-admin.py --email admin@homi.in --password "YourStrongPassword123!" --name "Homi Administrator"
    python3 scripts/provision-admin.py --email existing_user@example.com --promote-only
    python3 scripts/provision-admin.py --email admin@homi.in --supabase-id "00000000-0000-0000-0000-000000000000"
"""

import argparse
import os
import subprocess
import sys
import json
import urllib.request
import urllib.error

try:
    import bcrypt
except ImportError:
    # If bcrypt is not in python environment, install or fallback to subshell
    pass

def hash_password(password: str) -> str:
    """Hash password using built-in Node crypto (scrypt) or python bcrypt, 100% verified by Go backend"""
    try:
        import bcrypt
        salt = bcrypt.gensalt(rounds=10)
        return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")
    except ImportError:
        # Fallback to standard Node.js crypto scrypt (supported by backend/internal/utils/crypto.go)
        cmd = [
            "node",
            "-e",
            f"""
            const crypto = require('crypto');
            const salt = crypto.randomBytes(16).toString('hex');
            const hash = crypto.scryptSync({json.dumps(password)}, salt, 64).toString('hex');
            process.stdout.write(`${{salt}}:${{hash}}`);
            """
        ]
        proc = subprocess.run(cmd, capture_output=True, text=True, check=True)
        return proc.stdout.strip()

def load_env():
    """Load env vars prioritizing backend/.env"""
    env_paths = [".env", "backend/.env"]
    config = {}
    for p in env_paths:
        if os.path.exists(p):
            with open(p, "r") as f:
                for line in f:
                    line = line.strip()
                    if line and not line.startswith("#") and "=" in line:
                        k, v = line.split("=", 1)
                        config[k.strip()] = v.strip().strip('"').strip("'")
    return config

def exec_sql(query: str, db_target="homi"):
    """Execute raw SQL statement using psql CLI against URL or database name"""
    if db_target.startswith("postgres://") or db_target.startswith("postgresql://"):
        cmd = ["psql", db_target, "-c", query]
    else:
        cmd = ["psql", "-d", db_target, "-c", query]
    proc = subprocess.run(cmd, capture_output=True, text=True)
    if proc.returncode != 0:
        raise RuntimeError(f"Database error:\n{proc.stderr}")
    return proc.stdout

def main():
    parser = argparse.ArgumentParser(description="Securely provision or elevate a Homi Administrator")
    parser.add_argument("--email", required=True, help="Administrator email address")
    parser.add_argument("--password", help="Administrator password (minimum 8 characters)")
    parser.add_argument("--name", default="Platform Administrator", help="Administrator full name")
    parser.add_argument("--phone", default="+919999999999", help="Administrator contact phone")
    parser.add_argument("--supabase-id", help="Optional Supabase Auth UUID (sub)")
    parser.add_argument("--promote-only", action="store_true", help="Promote existing user to admin without changing password")

    args = parser.parse_args()
    email = args.email.strip().lower()

    env = load_env()
    db_url = env.get("DATABASE_URL", "postgresql://akashlodhi@localhost:5432/homi")
    db_name = "homi"
    if "/" in db_url:
        db_name = db_url.split("/")[-1].split("?")[0]

    print("==================================================")
    print("  HOMI — SECURE ADMINISTRATOR PROVISIONING TOOL  ")
    print("==================================================")
    print(f"Target Email : {email}")
    print(f"Target Name  : {args.name}")
    print(f"Database     : {db_name}")

    # Check if user already exists
    check_query = f"SELECT id, role, email FROM users WHERE LOWER(email) = '{email}';"
    out = exec_sql(check_query, db_url)
    user_exists = "(1 row)" in out

    if args.promote_only:
        if not user_exists:
            print(f"Error: User with email '{email}' does not exist. Cannot promote.")
            sys.exit(1)
        update_query = f"UPDATE users SET role = 'admin', updated_at = NOW() WHERE LOWER(email) = '{email}';"
        exec_sql(update_query, db_url)
        print(f"✓ Successfully elevated '{email}' to role = 'admin'.")
        return

    if not args.password and not user_exists:
        print("Error: --password is required when provisioning a new admin user.")
        sys.exit(1)

    password_hash = None
    if args.password:
        if len(args.password) < 8:
            print("Error: Password must be at least 8 characters.")
            sys.exit(1)
        password_hash = hash_password(args.password)

    sb_id_clause = f"'{args.supabase_id}'" if args.supabase_id else "NULL"

    if user_exists:
        print(f"User '{email}' found in database. Updating to administrator role...")
        if password_hash:
            update_sql = f"""
            UPDATE users
            SET role = 'admin',
                name = '{args.name}',
                phone = '{args.phone}',
                password_hash = '{password_hash}',
                supabase_id = COALESCE({sb_id_clause}, supabase_id),
                updated_at = NOW()
            WHERE LOWER(email) = '{email}';
            """
        else:
            update_sql = f"""
            UPDATE users
            SET role = 'admin',
                name = '{args.name}',
                supabase_id = COALESCE({sb_id_clause}, supabase_id),
                updated_at = NOW()
            WHERE LOWER(email) = '{email}';
            """
        exec_sql(update_sql, db_url)
        print(f"✓ Administrator '{email}' updated successfully.")
    else:
        print(f"Creating new administrator record for '{email}' in Supabase database...")
        insert_sql = f"""
        INSERT INTO users (name, email, phone, role, password_hash, supabase_id, created_at, updated_at)
        VALUES ('{args.name}', '{email}', '{args.phone}', 'admin', '{password_hash}', {sb_id_clause}, NOW(), NOW());
        """
        exec_sql(insert_sql, db_url)
        print(f"✓ Administrator '{email}' provisioned successfully in Supabase database.")

    # If Supabase cloud is configured with Service Role Key, sync app_metadata
    sb_url = env.get("SUPABASE_URL", "")
    sb_key = env.get("SUPABASE_SERVICE_ROLE_KEY", "")
    if sb_url and not "your-project" in sb_url and sb_key and not "your-supabase" in sb_key:
        print("\nSyncing administrator role with Supabase Auth app_metadata...")
        try:
            admin_api = f"{sb_url.rstrip('/')}/auth/v1/admin/users"
            req = urllib.request.Request(
                admin_api,
                data=json.dumps({
                    "email": email,
                    "password": args.password,
                    "email_confirm": True,
                    "app_metadata": {"role": "admin"},
                    "user_metadata": {"name": args.name}
                }).encode("utf-8"),
                headers={
                    "Content-Type": "application/json",
                    "apikey": sb_key,
                    "Authorization": f"Bearer {sb_key}"
                },
                method="POST"
            )
            with urllib.request.urlopen(req) as resp:
                print("✓ Supabase Auth administrator account synced with app_metadata = {'role': 'admin'}")
        except Exception as e:
            print(f"Note: Supabase cloud sync response: {e}")

    print("\nAdministrator provisioning complete!")
    print(f"Admin Email: {email}")
    print("Role: admin")
    print("Access URL: http://localhost:3001/login\n")

if __name__ == "__main__":
    main()
